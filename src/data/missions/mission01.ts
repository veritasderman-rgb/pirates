/**
 * Mise 1 — „Hlídka u Želvího ostrova" (tutoriál, šalupa).
 * Celní kontrola: „kupec" Mořská panna po výzvě odhodí masku a od t=40 s
 * PRCHÁ na volné moře (po větru, broad reach). Honička s termínem, ve které
 * se hráč učí body plavby, trim, vesla a obeplutí ostrova.
 *
 * Id lodí (pořadí pole ships, od 1):
 *   1 = Vlaštovka (hráč), 2 = Mořská panna, 3 = bóje „Volné moře"
 */
import type { Scenario } from '../../sim/types'
import { circlePoly } from '../../sim/geom'

const PLAYER = 1
const RUNNER = 2
const BUOY = 3

export const mission01: Scenario = {
  id: 'mission01',
  title: 'Hlídka u Želvího ostrova',
  briefing:
    'HMS Vlaštovka drží celní hlídku v úžině u Želvího ostrova. Přístavní '
    + 'kapitanát hlásí kupeckou loď Mořská panna s podezřelým manifestem — '
    + 'proveďte kontrolu: přibližte se na 300 metrů. Pozor: jestli má co '
    + 'skrývat, napne plachty a poběží na volné moře.\n\n'
    + 'VÝCVIK: vítr vane k východu — chytněte ho do plachet (nejrychleji plujete '
    + 'na zadoboční vítr, tzv. broad reach), doladíte trim, a do bezvětří nebo '
    + 'proti větru nasadíte vesla. Ostrov se musí OBEPLOUT — na mělčinu nenajíždějte.',
  seed: 17010704,
  ambient: '#0d3b4a',
  wind: { baseDir: 0.15, baseSpeed: 8.5, rotationRate: 0.0008, gustiness: 0.4 },

  islands: [
    {
      id: 'turtle', name: 'Želví ostrov', kind: 'island',
      poly: circlePoly(3000, -250, 520, 14, 0.35),
      desc: 'Želví ostrov — nízký korálový hřbet uprostřed úžiny. Zvedá se sotva '
        + 'nad hladinu, ale jeho mělčiny lámaly kýly už dávno před tím, než sem '
        + 'připlula první koruna.',
    },
    {
      id: 'reef-e', name: 'Dračí zuby', kind: 'reef', depth: 2,
      poly: circlePoly(3750, 700, 260, 10, 0.4),
      desc: 'Dračí zuby — útesy těsně pod hladinou. Šalupa přeplují, cokoli s '
        + 'hlubším ponorem tu nechá dno.',
    },
  ],

  ships: [
    {
      classId: 'sloop-albion', side: 'player', name: 'HMS Vlaštovka',
      pos: { x: 0, y: 0 }, vel: { x: 2, y: 0 }, heading: 0.15, doctrine: 'player',
      fireControl: { mode: 'hold', shot: 'round', engaged: false },
    },
    {
      classId: 'merch', side: 'enemy', name: 'Mořská panna',
      pos: { x: 1100, y: 150 }, vel: { x: 1, y: 0 }, heading: 0.2, doctrine: 'buoy',
      desc: 'Kupecká loď Mořská panna — na papíře veze sůl a plátno. Sedí '
        + 'v úžině nezvykle klidně, jako by na někoho čekala.',
    },
    {
      classId: 'merch', side: 'neutral', name: 'Volné moře',
      pos: { x: 6800, y: 300 }, vel: { x: 0, y: 0 }, heading: 0, doctrine: 'buoy',
      sailsUp: false, trim: 0,
      desc: 'Navigační bóje na hranici hlídkovaných vod. Za ní začíná volné '
        + 'moře — a tam už žádná koruna nedosáhne.',
    },
    {
      classId: 'merch', side: 'neutral', name: 'Albatros',
      pos: { x: 1500, y: -1400 }, vel: { x: 3, y: 0.5 }, heading: 0.1, doctrine: 'freighter',
      nav: { kind: 'course', dest: { x: 7000, y: -1000 }, arriveAtRest: false },
      desc: 'Kupecká loď na pravidelné lince — platný tranzit, manifest, který '
        + 'výjimečně sedí.',
    },
  ],

  objectives: [
    { id: 'obj-inspect', text: 'Proveď kontrolu Mořské panny (na 300 m)', state: 'open' },
    { id: 'obj-stop', text: 'Nedovol jí uniknout na volné moře', state: 'open' },
  ],

  triggers: [
    {
      id: 'trg-traffic-ident', once: true,
      conditions: [{ kind: 'time', t: 2 }],
      actions: [{ kind: 'revealClass', shipId: 4 }],
    },
    {
      id: 'trg-hail', once: true,
      conditions: [{ kind: 'time', t: 5 }],
      actions: [{
        kind: 'comm', speaker: 'port',
        text: 'Kapitanát volá Vlaštovku: „Zastavte Mořskou pannu a proveďte kontrolu. '
          + 'Přibližte se k ní na tři sta metrů — a mějte oči na stěžni."',
      }],
    },
    {
      id: 'trg-wind-lesson', once: true,
      conditions: [{ kind: 'time', t: 10 }],
      actions: [{
        kind: 'comm', speaker: 'mate',
        text: 'ŠKOLA PLAVBY: vítr vane k východu. Nejrychleji plujeme, když ho máme '
          + 'zezadu z boku (zadoboční vítr). Přímo proti větru plachty neberou — tam '
          + 'se musí KŘIŽOVAT (cik-cak) nebo nasadit VESLA. Sleduj růžici větru v rohu.',
      }],
    },
    {
      id: 'trg-panna-reply', once: true,
      conditions: [{ kind: 'time', t: 22 }],
      actions: [{
        kind: 'comm', speaker: 'enemy-captain',
        text: 'Mořská panna: „Vezeme sůl a máme skluz, hlídko. Tohle si vyřídíme '
          + 's guvernérem — nezdržujte nás."',
      }],
    },
    {
      id: 'trg-flee', once: true,
      conditions: [{ kind: 'time', t: 40 }],
      actions: [
        { kind: 'message', text: 'Mořská panna napíná všechny plachty a prchá k volnému moři!' },
        { kind: 'setDoctrine', shipId: RUNNER, doctrine: 'runner' },
        { kind: 'setFlag', flag: 'fleeing' },
        { kind: 'revealClass', shipId: RUNNER },
        {
          kind: 'comm', speaker: 'lookout',
          text: 'Věděl jsem, že ten klid smrdí! Pod plachtami má vojenský takeláž — '
            + 'žádný kupec. Prchá po větru, kapitáne, dožeňte ji, než zmizí za bójí!',
        },
      ],
    },
    {
      id: 'trg-tack-lesson', once: true,
      conditions: [{ kind: 'flag', flag: 'fleeing' }, { kind: 'time', t: 60 }],
      actions: [{
        kind: 'comm', speaker: 'mate',
        text: 'Běží po větru, tam je rychlá. Drž plný trim a čistý vítr — a POZOR na '
          + 'Želví ostrov: obepluj ho, na mělčinu nenajížděj. V jeho závětří vítr slábne, '
          + 'tam bys ztratil tah.',
      }],
    },
    {
      id: 'trg-inspect-done', once: true,
      conditions: [{ kind: 'distanceBelow', shipA: PLAYER, shipB: RUNNER, distance: 300 }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-inspect' },
        {
          kind: 'comm', speaker: 'gunner',
          text: 'Jsme u ní! Na tuhle vzdálenost jí děla utrhnou ráhnoví — řetězovou '
            + 'salvou ji zpomal, plnou koulí potop, nebo ji přinuť spustit vlajku a obsaď ji.',
        },
      ],
    },
    {
      id: 'trg-runner-destroyed', once: true,
      conditions: [{ kind: 'shipDestroyed', shipId: RUNNER }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-stop' },
        { kind: 'winMission', text: 'Mořská panna leží na dně. Kapitanát: dobrá práce, Vlaštovko.' },
      ],
    },
    {
      id: 'trg-runner-struck', once: true,
      conditions: [{ kind: 'shipSurrendered', shipId: RUNNER }],
      actions: [
        { kind: 'objectiveComplete', objectiveId: 'obj-stop' },
        { kind: 'winMission', text: 'Mořská panna spustila vlajku — zajata i s nákladem. Výborně.' },
      ],
    },
    {
      id: 'trg-runner-escaped', once: true,
      conditions: [{ kind: 'distanceBelow', shipA: RUNNER, shipB: BUOY, distance: 400 }],
      actions: [
        { kind: 'objectiveFail', objectiveId: 'obj-stop' },
        { kind: 'loseMission', text: 'Mořská panna unikla na volné moře. Kapitanát nebude mít radost.' },
      ],
    },
    {
      id: 'trg-player-lost', once: true,
      conditions: [{ kind: 'shipDestroyed', shipId: PLAYER }],
      actions: [{ kind: 'loseMission', text: 'HMS Vlaštovka se potopila.' }],
    },
  ],
}
