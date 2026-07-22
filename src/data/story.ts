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
  mission03: {
    prolog:
      'Kotlový ostrov, mrtvé odpoledne. Osamělý kupec bez eskorty — přesně to, před '
      + 'čím tě admiralita varovala. Připrav boky a přibližuj se pomalu.',
    epilog:
      'Nebyl to kupec, ale castillský vlk v beránčí kůži. Z jeho paluby zazněl poprvé '
      + 'hlas, který má za vším stát: Don Cristóbal de Vega. Past sklapla naprázdno — '
      + 'a síť má konečně jméno.',
    epilogLose:
      'Q-loď dostala první salvu zadarmo a Fortuna ji nepřežila. De Vega si škrtl '
      + 'jednu fregatu ze seznamu.',
  },
  mission04: {
    prolog:
      'Vody u Punta Negry, čerstvý vítr. Kurýr už má náskok a míří pod děla pevnosti. '
      + 'Jestli chceš ty depeše, musíš plout líp než on.',
    epilog:
      'Céfiro nedoplul. Z depeší se skládá obraz: de Vega odpovídá někomu výš, komusi '
      + 's pokladní flotilou a hodností almiranteho. Stříbro a válka jsou tentýž plán.',
    epilogLose:
      'Kurýr proklouzl pod pevnost o vlásek. Depeše jsou v bezpečí Castilly — a ty '
      + 'jsi zůstal stát v jejím dostřelu s prázdnýma rukama.',
  },
  mission05: {
    prolog:
      'Zátoka Kostivého ostrova za úsvitu. Někde v tom stínu kotví Silas Rourke — '
      + 'pirát, kterého platí castillské stříbro. Ostříž ti kryje bok; vpluj a rozbij hnízdo.',
    epilog:
      'Hnízdo vyhořelo a Rourke padl — či klekl. Než zmlkl, vydal poslední kus sítě: '
      + 'almirante Herrera a poslední stříbro míří na úžinu u Tří majáků. Tam se to rozhodne.',
    epilogLose:
      'Baterie a smečka byly nad síly dvou lodí. Fortuna zůstala v zátoce Kostivého '
      + 'ostrova a Rourke se směje dál.',
  },
  mission06: {
    prolog:
      'Úžina u Tří majáků. Na obzoru castillská eskadra a s ní válka, kterou de Vega '
      + 'chystal celou dobu. Tři tvé lodě proti řadové lodi a fregatě. Tady se to láme.',
    epilog:
      'Trueno mlčí, stříbro leží na dně úžiny a Herrerova eskadra je rozbita. Válka, '
      + 'kterou někdo v Castille tak pečlivě splétal, se dnes u Tří majáků nekoná — '
      + 'ale de Vega, ruka za vším, zmizel do stínu. Tohle nebyl konec. Byl to začátek '
      + 'otevřené války.',
    epilogLose:
      'Fortuna padla u Tří majáků a stříbro proplulo na úžiny. Válka, které jsi měl '
      + 'předejít, právě začala — a ty už u ní nebudeš.',
  },
  mission07: {
    prolog:
      'Rackův ostrov, časné ráno. Kouř nad kotvící stanicí a plachty fregat v návětří — '
      + 'Castilla vrací úder. De Vega chce krev za Tři majáky.',
    epilog:
      'Odveta odražena, tři castillské fregaty rozbité o Rackův ostrov. De Vega zjistil, '
      + 'že hrubá síla proti tobě nestačí — a stáhl se plánovat něco většího. Válka se '
      + 'přelévá k jeho břehům.',
    epilogLose:
      'Stanice u Rackova ostrova hoří a s ní tvá eskadra. De Vega má svou pomstu.',
  },
  mission08: {
    prolog:
      'Konečně stopa přímo k němu. De Vega osobně, na rychlém kurýru, prchá k Cádizu — '
      + 'a jeho eskorta se ti staví do cesty. Tentokrát je to osobní.',
    epilog:
      'Kurýr ti utekl, ale jeho štít padl: Q-loď i obě fregaty leží na dně. De Vega '
      + 'doplul do Cádizu nahý a zavřený — a ty víš, kde ho najít. Zbývá prolomit bránu.',
    epilogLose:
      'De Vega i jeho eskorta zmizeli za obzorem k Cádizu. Lov skončil neúspěchem.',
  },
  mission09: {
    prolog:
      'Poprvé pod tebou duní tři paluby děl: HMS Sovereign, řadová loď. Před tebou brána '
      + 'Cádizu — pevnost a eskadra, za nimi de Vega a jeho stříbro.',
    epilog:
      'Vnější obrana Cádizu je prolomená a de Vega zavřený uvnitř s pokladní flotilou. '
      + 'Sovereign se ukázala jako pěst, jakou Albion potřeboval. Zbývá vzít mu stříbro — '
      + 'a pak jeho samotného.',
    epilogLose:
      'Sovereign klesla pod děly Cádizu. Blokáda je zlomena a de Vega volný.',
  },
  mission10: {
    prolog:
      'Za pevností kotví poslední pokladní flotila Castilly — dvě galeony stříbra a jejich '
      + 'strážci. Tohle stříbro je motor de Vegovy války. Ber ho.',
    epilog:
      'Stříbrná flotila je vyřízena, galeony na dně nebo v tvých rukou. Bez stříbra '
      + 'de Vegova válka umírá. Zbývá jediné: on sám a Corona, jeho plovoucí trůn.',
    epilogLose:
      'Sovereign padla mezi galeonami a stříbro proplulo. De Vega si válku ještě zaplatí.',
  },
  mission11: {
    prolog:
      'Rejda Cádizu, poslední den války. Proti tvé flotile stojí Corona — čtyři paluby '
      + 'de Vegovy pýchy — a zbytek castillské moci. Tady se rozhodne, kdo je pánem Halcyonu.',
    epilog:
      'Corona mlčí. Castillská moc v Halcyonu je zlomená a de Vegova hra o dvě koruny '
      + 'a jedno moře skončila. Vítr, ostrovy a stříbro patří zas těm, kdo je umí číst — '
      + 'a to jsi dnes byl ty, kapitáne. Válce, které ses měl vyhnout, jsi nakonec '
      + 'nepředešel; ale vyhrál jsi ji — a Halcyon si to bude pamatovat.',
    epilogLose:
      'Sovereign klesá do rejdy Cádizu a s ní albionská linie. Corona pluje dál a Halcyon '
      + 'dostane nového pána — Dona Cristóbala de Vegu. Válka je prohraná.',
  },
}
