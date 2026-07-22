/**
 * Příběh kampaně — svět dvou korun a volných pirátů. CAMPAIGN_INTRO uvádí
 * svět; MISSION_STORY nese prology a epilogy misí (druhá osoba).
 */

export const CAMPAIGN_INTRO: string =
  'Souostroví Halcyon: stovka ostrovů, dva vlajkové jazyky a jedno moře, které '
  + 'nikomu nepatří. Na západě Koruna Albionu — obchodní, opatrná, bohatá z cel '
  + 'a přesná u děl. Na jihu Castilla — hrdá, pomalá a napřená k pokladním '
  + 'galeonám, které dvakrát ročně vezou stříbro z kolonií domů. A mezi nimi, '
  + 've stínu každé úžiny a závětří každého ostrova, volní piráti: kořistní '
  + 'šalupy a látané brigy, které neuznávají vlajku a berou všechno, co plave.\n\n'
  + 'Ty jsi kapitán Královského námořnictva Albionu. Kampaň sleduje tvou službu '
  + 'od celní hlídky v úžinách po lov na pirátské kapitány i castillské pokladní '
  + 'flotily. Vítr, ostrovy a bod plavby rozhodují stejně jako děla: rychlejší '
  + 'loď si vybírá, kdy a kde se bojuje — a jestli vůbec.'

export interface MissionStory {
  prolog: string
  epilog: string
  epilogLose?: string
}

export const DEFEAT_GENERIC =
  'Moře nepromíjí. Loď je pryč, kořist unikla — ale kapitán, který se poučí, '
  + 'vypluje znovu.'

export const MISSION_STORY: Record<string, MissionStory> = {
  mission01: {
    prolog:
      'Úžina u Želvího ostrova, svítání. Vítr vane k východu, hladina se čeří. '
      + 'Kapitanát ti předal jméno — Mořská panna — a pocit, že něco nesedí.',
    epilog:
      'Mořská panna nebyla kupec. Pod plátnem vezla vojenský takeláž a zapečetěné '
      + 'rozkazy s castillskou pečetí — první nit v síti, kterou někdo splétá napříč '
      + 'Halcyonem. Kapitanát mlčí. Ty už víš, že hlídka skončila a začíná něco většího.',
    epilogLose:
      'Mořská panna zmizela za bójí do volného moře i s tím, co vezla. Kapitanát '
      + 'to zapíše jako „kontakt ztracen". Ty víš, že to byla stopa — a utekla ti.',
  },
  mission02: {
    prolog:
      'Soutěska mezi Kančím a Mlžným ostrovem, poledne. Dva kupci ti visí na zádi, '
      + 'úžina se zužuje a v návětří se něco hýbe.',
    epilog:
      'Smečka se rozprchla a konvoj prošel. V podpalubí pirátské brigy se ale našly '
      + 'stejné zapečetěné rozkazy jako na Mořské panně — někdo platí pirátům Halcyonu, '
      + 'aby škrtili albionský obchod. A ten někdo mluví castillsky.',
    epilogLose:
      'Konvoj zůstal na dně Soutěsky. Náklad, lodě, posádky — všechno pohltilo moře, '
      + 'zatímco piráti mizeli do závětří ostrovů.',
  },
}
