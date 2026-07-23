/**
 * Plot3D — WebGL (three.js) vykreslovací vrstva. Skutečné 3D: nakláněná kamera
 * shora, animovaná vodní hladina, výškové ostrovy, procedurální 3D lodě.
 * Implementuje stejné rozhraní jako 2D TacticalPlot (Renderer), takže se dá
 * přepnout přes ?r=3d beze změny zbytku hry. Simulace zůstává beze změny;
 * vizuál se extrapoluje mezi snapshoty (plynulý pohyb).
 */
import * as THREE from 'three'
import type { Renderer } from './renderer'
import type { Island, ShipState, SimState, Vec2 } from '../sim/types'
import { SHIP_CLASSES } from '../data/defs'
import { hitRadius } from '../sim/weapons'
import { hashNoise } from '../sim/rng'

const DIST_MIN = 70, DIST_MAX = 4200
const SUN_DIR = new THREE.Vector3(-0.55, 1.05, -0.83).normalize()

const SIDE_COL: Record<string, number> = {
  player: 0x4fd0e0, enemy: 0xe06a44, neutral: 0xd8c24f,
}
const colorFor = (side: string): number => SIDE_COL[side] ?? 0xcfeef2

export class Plot3D implements Renderer {
  selectedId: number | null = null
  targetId: number | null = null
  compression = 1

  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private raycaster = new THREE.Raycaster()

  private state: SimState | null = null
  private dist = 340
  private camTarget = new THREE.Vector3()
  private followId: number | null = null
  private userPanned = false
  private snapT = 0
  private exSim = 0
  private raf = 0

  private ships = new Map<number, THREE.Group>()
  private islandsBuilt = false
  private waterGeo!: THREE.PlaneGeometry
  private waterBase!: Float32Array
  private waterMesh!: THREE.Mesh
  private sun!: THREE.DirectionalLight
  private selRing: THREE.Mesh
  private tgtRing: THREE.Mesh
  private selRange: THREE.Mesh
  private tgtRange: THREE.Mesh

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    this.renderer.setClearColor(0x0a2630, 1)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.scene.background = new THREE.Color(0x8fbdcf)
    this.scene.fog = new THREE.Fog(0x8fbdcf, 1800, 7200)

    this.camera = new THREE.PerspectiveCamera(45, 1, 1, 9000)

    this.sun = new THREE.DirectionalLight(0xfff2d6, 1.7)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    const sc = this.sun.shadow.camera
    sc.left = -500; sc.right = 500; sc.top = 500; sc.bottom = -500; sc.near = 1; sc.far = 2000
    this.scene.add(this.sun)
    this.scene.add(this.sun.target)
    this.scene.add(new THREE.HemisphereLight(0xd6f0fb, 0x1f4a60, 0.7))

    this.buildWater()

    // výběrový / cílový prstenec + kružnice dostřelu na hladině
    this.selRing = this.makeRing(0x4fd0e0)
    this.tgtRing = this.makeRing(0xe06a44)
    this.selRange = this.makeRing(0x4fd0e0, 0.985, 0.3)
    this.tgtRange = this.makeRing(0xe06a44, 0.985, 0.3)
    for (const r of [this.selRing, this.tgtRing, this.selRange, this.tgtRange]) { r.visible = false; this.scene.add(r) }

    this.resize()
    window.addEventListener('resize', () => this.resize())
    this.bindInput()
  }

  private makeRing(col: number, inner = 1, opacity = 0.8): THREE.Mesh {
    const g = new THREE.RingGeometry(inner, 1.12, 64)
    const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false })
    const mesh = new THREE.Mesh(g, m)
    mesh.rotation.x = -Math.PI / 2
    return mesh
  }

  private buildWater(): void {
    this.waterGeo = new THREE.PlaneGeometry(9000, 9000, 96, 96)
    this.waterGeo.rotateX(-Math.PI / 2)
    this.waterBase = (this.waterGeo.attributes.position.array as Float32Array).slice()
    const mat = new THREE.MeshStandardMaterial({
      color: 0x16657a, metalness: 0.25, roughness: 0.32, flatShading: true,
    })
    const water = new THREE.Mesh(this.waterGeo, mat)
    water.renderOrder = -1
    water.receiveShadow = true
    this.waterMesh = water
    this.scene.add(water)
  }

  private resize(): void {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / Math.max(1, h)
    this.camera.updateProjectionMatrix()
  }

  // ---------- world (x,y sever) → three (x,0,-y) ----------
  private w3(p: Vec2, y = 0): THREE.Vector3 { return new THREE.Vector3(p.x, y, -p.y) }
  private rpos(o: { pos: Vec2; vel: Vec2 }): Vec2 {
    return { x: o.pos.x + o.vel.x * this.exSim, y: o.pos.y + o.vel.y * this.exSim }
  }

  // ---------- Renderer API ----------
  setState(state: SimState): void {
    this.state = state
    this.snapT = performance.now()
    if (this.followId === null) {
      const own = state.ships.find(s => s.side === 'player' && !s.destroyed)
      if (own) { this.followId = own.id; this.selectedId = own.id }
    }
    if (!this.islandsBuilt) { this.buildIslands(state.islands); this.islandsBuilt = true }
  }

  start(): void {
    const loop = (): void => { this.render(); this.raf = requestAnimationFrame(loop) }
    this.raf = requestAnimationFrame(loop)
  }
  stop(): void { cancelAnimationFrame(this.raf) }
  follow(id: number | null): void { this.followId = id; this.userPanned = false }

  zoomStep(factor: number): void {
    this.dist = Math.min(DIST_MAX, Math.max(DIST_MIN, this.dist / factor))
  }
  panByScreen(dxPx: number, dyPx: number): void {
    this.userPanned = true
    const h = this.canvas.clientHeight
    const wpp = (2 * this.dist * Math.tan((this.camera.fov * Math.PI / 180) / 2)) / h
    this.camTarget.x -= dxPx * wpp
    this.camTarget.z -= dyPx * wpp
  }
  recenter(): void {
    this.userPanned = false
    const f = this.state?.ships.find(s => s.id === this.followId)
    if (f) { const p = this.w3(this.rpos(f)); this.camTarget.set(p.x, 0, p.z) }
  }

  /** obrazovka → svět přes průsečík s hladinou y=0 */
  s2w(sx: number, sy: number): Vec2 {
    const ndc = new THREE.Vector2((sx / this.canvas.clientWidth) * 2 - 1, -(sy / this.canvas.clientHeight) * 2 + 1)
    this.raycaster.setFromCamera(ndc, this.camera)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const hit = new THREE.Vector3()
    if (!this.raycaster.ray.intersectPlane(plane, hit)) return { x: this.camTarget.x, y: -this.camTarget.z }
    return { x: hit.x, y: -hit.z }
  }

  /** raycast na lodní skupiny; vrací shipId nejbližšího zásahu */
  pick(sx: number, sy: number): number | null {
    if (!this.state) return null
    const ndc = new THREE.Vector2((sx / this.canvas.clientWidth) * 2 - 1, -(sy / this.canvas.clientHeight) * 2 + 1)
    this.raycaster.setFromCamera(ndc, this.camera)
    const targets: THREE.Object3D[] = []
    this.ships.forEach(g => { if (g.visible) targets.push(g) })
    const hits = this.raycaster.intersectObjects(targets, true)
    for (const hit of hits) {
      let o: THREE.Object3D | null = hit.object
      while (o) { if (o.userData.shipId != null) return o.userData.shipId as number; o = o.parent }
    }
    return null
  }

  // ---------- islands ----------
  private buildIslands(islands: Island[]): void {
    for (const isl of islands) {
      if (isl.poly.length < 3) continue
      const grp = new THREE.Group()
      // centroid + poloměr
      let cx = 0, cy = 0
      for (const p of isl.poly) { cx += p.x; cy += p.y }
      cx /= isl.poly.length; cy /= isl.poly.length
      let r = 0
      for (const p of isl.poly) r += Math.hypot(p.x - cx, p.y - cy)
      r /= isl.poly.length

      if (isl.kind === 'reef') {
        const shape = this.islandShape(isl.poly)
        const geo = new THREE.ShapeGeometry(shape); geo.rotateX(-Math.PI / 2)
        const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x2f7d84, transparent: true, opacity: 0.5, roughness: 1 }))
        m.position.y = 0.4; grp.add(m); this.scene.add(grp); continue
      }

      // pláž (o něco větší, písek)
      const beach = new THREE.Mesh(
        (() => { const g = new THREE.ShapeGeometry(this.islandShape(isl.poly, cx, cy, 1.1)); g.rotateX(-Math.PI / 2); return g })(),
        new THREE.MeshStandardMaterial({ color: 0xd8c48e, roughness: 1 }))
      beach.position.y = 0.3; grp.add(beach)
      // travnatý podklad
      const grass = new THREE.Mesh(
        (() => { const g = new THREE.ShapeGeometry(this.islandShape(isl.poly)); g.rotateX(-Math.PI / 2); return g })(),
        new THREE.MeshStandardMaterial({ color: 0x4f7d3a, roughness: 1 }))
      grass.position.y = 0.6; grp.add(grass)
      // kopec (dóm) pro reliéf
      const hill = new THREE.Mesh(
        new THREE.SphereGeometry(r * 0.72, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x5f8a42, roughness: 1, flatShading: true }))
      hill.scale.y = (r * 0.42) / (r * 0.72)
      hill.position.set(cx, 0.6, -cy); hill.castShadow = true; hill.receiveShadow = true; grp.add(hill)
      grass.receiveShadow = true; beach.receiveShadow = true
      // stromy (kužely)
      const nT = Math.min(60, Math.max(6, Math.floor(r * 0.5)))
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x274b22, roughness: 1, flatShading: true })
      const treeGeo = new THREE.ConeGeometry(r * 0.06, r * 0.2, 6)
      const trees = new THREE.InstancedMesh(treeGeo, trunkMat, nT)
      const mtx = new THREE.Matrix4()
      for (let i = 0; i < nT; i++) {
        const ang = hashNoise(isl.poly.length, i, 1) * 6.283
        const rad = Math.sqrt(hashNoise(isl.poly.length, i, 2)) * r * 0.6
        const tx = cx + Math.cos(ang) * rad, ty = cy + Math.sin(ang) * rad
        const hy = this.hillHeight(rad, r)
        mtx.makeTranslation(tx, hy + r * 0.1, -ty)
        trees.setMatrixAt(i, mtx)
      }
      trees.instanceMatrix.needsUpdate = true
      grp.add(trees)
      this.scene.add(grp)
    }
  }

  private hillHeight(rad: number, r: number): number {
    const t = Math.max(0, 1 - rad / (r * 0.72))
    return 0.6 + t * (r * 0.42)
  }

  private islandShape(poly: Vec2[], cx = 0, cy = 0, scale = 1): THREE.Shape {
    const shape = new THREE.Shape()
    poly.forEach((p, i) => {
      const x = scale === 1 ? p.x : cx + (p.x - cx) * scale
      const y = scale === 1 ? p.y : cy + (p.y - cy) * scale
      i ? shape.lineTo(x, y) : shape.moveTo(x, y)
    })
    shape.closePath()
    return shape
  }

  // ---------- ships ----------
  private buildShip(sh: ShipState): THREE.Group {
    const def = SHIP_CLASSES[sh.classId]
    const grp = new THREE.Group()
    grp.userData.shipId = sh.id
    const L = Math.max(9, hitRadius(sh) * 1.7)
    const B = L * 0.34
    const isFort = def?.hullCode === 'FORT'
    const col = colorFor(sh.side)

    if (isFort) {
      const stone = new THREE.Mesh(
        new THREE.CylinderGeometry(L * 0.7, L * 0.8, L * 0.5, 6),
        new THREE.MeshStandardMaterial({ color: 0x6f6a62, roughness: 1, flatShading: true }))
      stone.position.y = L * 0.25; grp.add(stone)
      grp.add(this.flag(col, L * 0.6, 0))
      return grp
    }

    // trup — boat outline (příď +x) extrudovaný do výšky
    const s = new THREE.Shape()
    s.moveTo(L * 0.5, 0)
    s.quadraticCurveTo(L * 0.32, B * 0.5, -L * 0.1, B * 0.5)
    s.lineTo(-L * 0.45, B * 0.32)
    s.quadraticCurveTo(-L * 0.5, 0, -L * 0.45, -B * 0.32)
    s.lineTo(-L * 0.1, -B * 0.5)
    s.quadraticCurveTo(L * 0.32, -B * 0.5, L * 0.5, 0)
    const hullGeo = new THREE.ExtrudeGeometry(s, { depth: B * 0.55, bevelEnabled: false })
    hullGeo.rotateX(-Math.PI / 2)             // extrude(z) → výška(y), shape-y → -z (bok)
    hullGeo.translate(0, -B * 0.2, 0)
    const hull = new THREE.Mesh(hullGeo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.7, metalness: 0.05, flatShading: true }))
    hull.userData.shipId = sh.id
    hull.castShadow = true
    grp.add(hull)
    // paluba (světlejší, nahoře)
    const deck = new THREE.Mesh(
      (() => { const d = new THREE.Shape(); d.moveTo(L * 0.42, 0); d.quadraticCurveTo(L * 0.28, B * 0.34, -L * 0.08, B * 0.34); d.lineTo(-L * 0.4, B * 0.22); d.quadraticCurveTo(-L * 0.44, 0, -L * 0.4, -B * 0.22); d.lineTo(-L * 0.08, -B * 0.34); d.quadraticCurveTo(L * 0.28, -B * 0.34, L * 0.42, 0); const g = new THREE.ShapeGeometry(d); g.rotateX(-Math.PI / 2); return g })(),
      new THREE.MeshStandardMaterial({ color: 0x8a6b45, roughness: 1 }))
    deck.position.y = B * 0.36; grp.add(deck)

    // stěžně + plachty
    const nMast = L >= 42 ? 3 : L >= 26 ? 2 : 1
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x3a2a18, roughness: 1 })
    const sailMat = new THREE.MeshStandardMaterial({ color: 0xf2f4ef, roughness: 0.9, side: THREE.DoubleSide })
    const sails: THREE.Mesh[] = []
    for (let m = 0; m < nMast; m++) {
      const mx = nMast === 1 ? L * 0.04 : L * 0.34 - (m / (nMast - 1)) * L * 0.72
      const mastH = L * (0.5 + 0.08 * (nMast - m))
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(L * 0.02, L * 0.025, mastH, 6), mastMat)
      mast.position.set(mx, B * 0.36 + mastH / 2, 0); mast.castShadow = true; grp.add(mast)
      // plachta — plane napříč bokem
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(mastH * 0.72, B * 1.7, 1, 4), sailMat)
      sail.rotation.y = Math.PI / 2
      sail.position.set(mx, B * 0.36 + mastH * 0.55, 0)
      sail.userData.sail = true; sail.castShadow = true
      grp.add(sail); sails.push(sail)
    }
    grp.userData.sails = sails
    grp.add(this.flag(col, -L * 0.44, B * 0.36 + L * 0.2))
    return grp
  }

  private flag(col: number, x: number, y: number): THREE.Mesh {
    const f = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 3),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.8, side: THREE.DoubleSide }))
    f.position.set(x - 3, y, 0)
    return f
  }

  // ---------- render loop ----------
  private render(): void {
    const st = this.state
    if (!st) { this.renderer.render(this.scene, this.camera); return }
    const now = performance.now()
    this.exSim = Math.min((now - this.snapT) / 1000 * (this.compression || 0), 2.0)
    const t = now / 1000

    this.animateWater(t)
    this.syncShips(st)
    this.updateRings(st)
    this.updateCamera(st)
    this.renderer.render(this.scene, this.camera)
  }

  private animateWater(t: number): void {
    const pos = this.waterGeo.attributes.position
    const base = this.waterBase
    const arr = pos.array as Float32Array
    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i], z = base[i + 2]
      arr[i + 1] = Math.sin(x * 0.012 + t * 1.1) * 2.2 + Math.sin(z * 0.017 - t * 0.9) * 1.8
        + Math.sin((x + z) * 0.03 + t * 1.6) * 0.8
    }
    pos.needsUpdate = true
    this.waterGeo.computeVertexNormals()
  }

  private syncShips(st: SimState): void {
    const seen = new Set<number>()
    for (const sh of st.ships) {
      const isPlayer = sh.side === 'player'
      const con = st.contacts.player.find(c => c.shipId === sh.id)
      if (!isPlayer && !con) continue          // neviditelné nepřátele nekreslíme
      seen.add(sh.id)
      let g = this.ships.get(sh.id)
      if (!g) { g = this.buildShip(sh); this.ships.set(sh.id, g); this.scene.add(g) }
      const p = con?.memory ? con.pos : this.rpos(sh)
      const v3 = this.w3(p)
      g.position.set(v3.x, 0, v3.z)
      g.rotation.y = sh.heading
      g.visible = !sh.destroyed
      // plachty dolů / loď vzdána
      const sails = g.userData.sails as THREE.Mesh[] | undefined
      if (sails) for (const s of sails) s.visible = sh.sailsUp && !sh.destroyed && !sh.surrendered
    }
    // odeber lodě, které zmizely z pohledu
    for (const [id, g] of this.ships) {
      if (!seen.has(id)) { this.scene.remove(g); this.ships.delete(id) }
    }
  }

  private updateRings(st: SimState): void {
    const place = (ring: THREE.Mesh, id: number | null): void => {
      ring.visible = false
      if (id == null) return
      const sh = st.ships.find(s => s.id === id && !s.destroyed)
      if (!sh) return
      if (sh.side !== 'player') {
        const con = st.contacts.player.find(c => c.shipId === id)
        if (!con) return
      }
      const p = this.w3(this.rpos(sh))
      const r = Math.max(12, hitRadius(sh) * 2)
      ring.position.set(p.x, 1.5, p.z); ring.scale.set(r, r, r); ring.visible = true
    }
    place(this.selRing, this.selectedId)
    place(this.tgtRing, this.targetId)

    // kružnice dostřelu (na hladině): vlastní vybraná loď a zaměřený cíl
    const range = (ring: THREE.Mesh, id: number | null, own: boolean): void => {
      ring.visible = false
      if (id == null) return
      const sh = st.ships.find(s => s.id === id && !s.destroyed)
      if (!sh) return
      let cls = sh.classId
      if (!own && sh.side !== 'player') {
        const con = st.contacts.player.find(c => c.shipId === id)
        if (!con || con.idQuality < 1) return
        cls = con.classGuess ?? sh.classId
      }
      const gr = SHIP_CLASSES[cls]?.gunRange ?? 0
      if (gr <= 0) return
      const p = this.w3(sh.side === 'player' ? this.rpos(sh) : (st.contacts.player.find(c => c.shipId === id)?.memory ? (st.contacts.player.find(c => c.shipId === id)!.pos) : this.rpos(sh)))
      ring.position.set(p.x, 0.8, p.z); ring.scale.set(gr, gr, gr); ring.visible = true
    }
    range(this.selRange, this.selectedId, true)
    range(this.tgtRange, this.targetId, false)
  }

  private updateCamera(st: SimState): void {
    if (this.followId !== null && !this.userPanned) {
      const f = st.ships.find(s => s.id === this.followId)
      if (f) {
        const p = this.w3(this.rpos(f))
        this.camTarget.x += (p.x - this.camTarget.x) * 0.16
        this.camTarget.z += (p.z - this.camTarget.z) * 0.16
      }
    }
    // kamera: jihovýchodně nad cílem, sklon ~49° (pohled shora s hloubkou)
    const pitch = 0.86   // rad nad horizontem
    const yaw = 0.6
    const cx = this.camTarget.x + Math.cos(pitch) * Math.sin(yaw) * this.dist
    const cz = this.camTarget.z + Math.cos(pitch) * Math.cos(yaw) * this.dist
    const cy = Math.sin(pitch) * this.dist
    this.camera.position.set(cx, cy, cz)
    this.camera.lookAt(this.camTarget)
    // slunce (a jeho stínová kamera) sleduje střed dění
    this.sun.position.set(this.camTarget.x + SUN_DIR.x * 700, SUN_DIR.y * 700, this.camTarget.z + SUN_DIR.z * 700)
    this.sun.target.position.copy(this.camTarget)
    this.sun.target.updateMatrixWorld()
  }

  private bindInput(): void {
    this.canvas.addEventListener('wheel', e => {
      e.preventDefault()
      this.zoomStep(e.deltaY < 0 ? 1.12 : 1 / 1.12)
    }, { passive: false })
    let armed = false, moved = false, last = { x: 0, y: 0 }
    this.canvas.addEventListener('pointerdown', e => { armed = true; moved = false; last = { x: e.clientX, y: e.clientY } })
    window.addEventListener('pointermove', e => {
      if (!armed) return
      const dx = e.clientX - last.x, dy = e.clientY - last.y
      if (!moved && Math.hypot(dx, dy) < 5) return
      moved = true
      this.panByScreen(dx, dy)
      last = { x: e.clientX, y: e.clientY }
    })
    window.addEventListener('pointerup', () => { armed = false })
    this.canvas.addEventListener('contextmenu', e => e.preventDefault())
  }
}
