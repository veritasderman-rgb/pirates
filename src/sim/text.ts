/**
 * Dynamické hlášky simulace (dosazují jméno lodi, počty děl, šance…) — nejde
 * je přeložit slovníkem přes přesné znění, proto mají šablony per jazyk.
 * České texty jsou PŮVODNÍ znění hry (obnovená z historie před anglickým
 * překladem), ať sedí tón. Jazyk čte z i18n jádra (worker si ho nastaví
 * z init zprávy; testy běží s výchozí angličtinou).
 */
import { activeLang } from '../i18n/core'
import type { ShotType, Broadside } from './types'

const cs = (): boolean => activeLang() === 'cs'

export const shotName = (s: ShotType): string => cs()
  ? (s === 'round' ? 'plné koule' : s === 'chain' ? 'řetězové' : 'kartáče')
  : (s === 'round' ? 'round shot' : s === 'chain' ? 'chain shot' : 'grape')

export const TXT = {
  broadsideFirePlayer: (side: Broadside, n: number, shot: ShotType): string => cs()
    ? `${side === 'port' ? 'Levobok' : 'Pravobok'} — PAL! (${n} děl, ${shotName(shot)})`
    : `${side === 'port' ? 'Port' : 'Starboard'} — FIRE! (${n} guns, ${shotName(shot)})`,
  broadsideFireOther: (name: string): string => cs()
    ? `${name} pálí boční salvu.` : `${name} fires a broadside.`,
  chaserFirePlayer: (end: 'bow' | 'stern', n: number, shot: ShotType): string => cs()
    ? `${end === 'bow' ? 'Příďové' : 'Záďové'} dělo — pal! (${n} děl, ${shotName(shot)})`
    : `${end === 'bow' ? 'Bow' : 'Stern'} chaser — fire! (${n} guns, ${shotName(shot)})`,

  rakingDealt: (name: string, zone: 'bow' | 'stern'): string => cs()
    ? `RAKING! Podélná salva rozmetla ${name} od ${zone === 'bow' ? 'přídě' : 'zádě'} k zádi!`
    : `RAKING! A raking broadside tore ${name} from ${zone} to stern!`,
  rakingTaken: (name: string): string => cs()
    ? `Nepřítel nás rakuje podélně — ${name} sténá! Uhni přídí z linie.`
    : `They're raking us end to end — ${name} is groaning! Turn your bow out of the line.`,
  sinking: (name: string): string => cs() ? `${name} se potápí!` : `${name} is going down!`,

  subName: (k: string): string => (cs()
    ? { rigging: 'ráhnoví', rudder: 'kormidlo', gunsPort: 'děla levoboku', gunsStbd: 'děla pravoboku', crew: 'posádka' }
    : { rigging: 'rigging', rudder: 'rudder', gunsPort: 'port guns', gunsStbd: 'starboard guns', crew: 'crew' }
  )[k as 'rigging'] ?? k,
  disableCallout: (name: string, k: string): string => (cs()
    ? {
      rudder: `${name}: kormidlo vyřazeno — nepřítel už nezatáčí!`,
      rigging: `${name}: ráhnoví v cárech — ztrácí rychlost, doháníme ji!`,
      gunsPort: `${name}: děla levoboku umlčena!`,
      gunsStbd: `${name}: děla pravoboku umlčena!`,
      crew: `${name}: posádka zdecimována — teď boarding!`,
    }
    : {
      rudder: `${name}: rudder shot away — she can't steer any more!`,
      rigging: `${name}: rigging in tatters — she's losing speed, we're catching her!`,
      gunsPort: `${name}: port guns silenced!`,
      gunsStbd: `${name}: starboard guns silenced!`,
      crew: `${name}: crew decimated — board her now!`,
    })[k as 'rudder'] ?? (cs() ? `${name}: ${TXT.subName(k)} vyřazeno!` : `${name}: ${TXT.subName(k)} knocked out!`),
  subsystemHit: (name: string, k: string): string => cs()
    ? `${name}: ${TXT.subName(k)} vyřazeno!` : `${name}: ${TXT.subName(k)} knocked out!`,

  refuseStrike: (name: string): string => cs()
    ? `${name} odmítá spustit vlajku!` : `${name} refuses to strike her colours!`,
  struckColours: (name: string): string => cs()
    ? `${name} spustila vlajku a vzdává se!` : `${name} has struck her colours and surrenders!`,
  boardRange: (): string => cs()
    ? 'Na boarding musíme přiléhnout bok k boku — přibliž se na ~60 m!'
    : 'To board we must lay alongside — close to ~60 m!',
  grapples: (name: string, odds: number, surrendered: boolean): string => {
    const verdict = cs()
      ? (surrendered ? 'vzdala se — jistá kořist'
        : odds >= 65 ? 'převaha je naše' : odds >= 45 ? 'vyrovnané — riskantní!' : 'jsme v nevýhodě — hrozí ztráty!')
      : (surrendered ? 'she has struck — a sure prize'
        : odds >= 65 ? 'the advantage is ours' : odds >= 45 ? 'even odds — risky!' : 'we\'re outmatched — expect losses!')
    return cs()
      ? `Háky na ${name}! Naše šance ~${odds} % — ${verdict}`
      : `Grapples onto ${name}! Our odds ~${odds}% — ${verdict}`
  },
  boardingRepulsed: (name: string): string => cs()
    ? `Výsadek zatlačen zpět — stahujeme se z ${name}! Změkči ji palbou.`
    : `Boarding party thrown back — we're pulling off ${name}! Soften her with fire.`,
  boarded: (name: string): string => cs()
    ? `${name} obsazena! Kořist je naše.` : `${name} boarded and taken! The prize is ours.`,

  wrecked: (name: string, reef: boolean): string => cs()
    ? `${name} se roztříštila na ${reef ? 'útesu' : 'mělčině'}!`
    : `${name} has been wrecked on the ${reef ? 'reef' : 'shoals'}!`,
  agroundPlayer: (reef: boolean): string => cs()
    ? `Najeli jsme na ${reef ? 'útes' : 'mělčinu'}! Zpětný vítr do plachet, dostat nás z toho!`
    : `We've run onto ${reef ? 'a reef' : 'a shoal'}! Back the sails, get us off it!`,
  agroundOther: (name: string): string => cs()
    ? `${name} uvázla na mělčině.` : `${name} has run aground.`,

  sailHo: (name: string | null): string => cs()
    ? `Plachta na obzoru! ${name ?? 'neznámý kontakt'}.`
    : `Sail on the horizon! ${name ?? 'unknown contact'}.`,
  flagshipFallen: (name: string): string => cs()
    ? `Vlajková loď padla — vlajku přebírá ${name}! Veď nás dál, kapitáne.`
    : `The flagship has fallen — ${name} takes up the colours! Lead us on, Captain.`,
}
