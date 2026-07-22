# Pirates

Browserová taktická simulace **plachetnicových bitev** — dvě koruny, kupci
a volní piráti mezi nimi. Manévr podle **větru** (body plavby, křižování,
přechod na **vesla** do protivětru), **ostrovy** jako překážky (obeplouvání,
mělčiny, závětří, mlha) a boční **dělové salvy** s raking fire a boardingem.

Stavíme na architektuře už hotové vesmírné hry **„Wall of Battle"** (repo
`honorverse`): TypeScript + Canvas + Web Worker, deterministická simulace,
data-driven mise se zvraty. Mění se měřítko, lodě a přibývají tři nové
mechaniky (vítr, plavba/vesla, terén).

**Stav projektu:** fáze návrhu.

📄 **[Herní návrh a plán přenosu](docs/GAME_DESIGN.md)** — koncept vesmír→moře,
recyklační tabulka (co kopírovat / upravit / napsat nově), detailní návrh
větru a plavby, třídy lodí, model boje, mise a milníky implementace.
