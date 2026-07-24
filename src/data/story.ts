/**
 * Příběh kampaně — svět dvou korun a volných pirátů. CAMPAIGN_INTRO uvádí
 * svět; MISSION_STORY nese prology a epilogy misí (druhá osoba).
 */

export const CAMPAIGN_INTRO: string =
  'The Halcyon Archipelago: a hundred islands, two flag-tongues and one sea that '
  + 'belongs to no one. To the west, the Crown of Albion — mercantile, cautious, '
  + 'rich on customs duties and deadly at the guns. To the south, Castilla — proud, '
  + 'slow and set on the treasure galleons that twice a year carry silver home from '
  + 'the colonies. And between them, in the shadow of every strait and the lee of '
  + 'every island, the free pirates: prize sloops and patched brigs that own no flag '
  + 'and take everything that floats.\n\n'
  + 'You are a captain of the Royal Navy of Albion. The campaign follows your service, '
  + 'from customs patrol in the straits to the hunt for pirate captains and Castillan '
  + 'treasure fleets. Wind, islands and point of sail decide as much as guns do: the '
  + 'faster ship chooses when and where the fight happens — and whether it happens at all.'

export interface MissionStory {
  prolog: string
  epilog: string
  epilogLose?: string
}

export const DEFEAT_GENERIC =
  'The sea forgives nothing. The ship is gone, the prize escaped — but a captain '
  + 'who learns his lesson puts to sea again.'

export const MISSION_STORY: Record<string, MissionStory> = {
  mission01: {
    prolog:
      'The strait off Turtle Island, at dawn. The wind blows to the east and the '
      + 'water ripples. The port authority has handed you a name — Sea Maiden — and '
      + 'a feeling that something is not right.',
    epilog:
      'The Sea Maiden was no merchantman. Under her canvas she carried military '
      + 'rigging and sealed orders bearing a Castillan seal — the first thread in a '
      + 'net someone is weaving across Halcyon. The port authority says nothing. You '
      + 'already know the patrol is over and something larger is beginning.',
    epilogLose:
      'The Sea Maiden slipped past the buoy into open water, and everything she '
      + 'carried with her. The port authority will log it as "contact lost". You '
      + 'know it was a trail — and it got away from you.',
  },
  mission02: {
    prolog:
      'The Narrows between Boar Island and Mist Island, at noon. Two merchantmen '
      + 'hang off your stern, the strait tightens, and something stirs to windward.',
    epilog:
      'The pack scattered and the convoy got through. But in the hold of the pirate '
      + 'brig they found the same sealed orders as aboard the Sea Maiden — someone is '
      + 'paying the pirates of Halcyon to throttle Albion trade. And that someone '
      + 'speaks Castillan.',
    epilogLose:
      'The convoy stayed on the bottom of the Narrows. Cargo, ships, crews — the sea '
      + 'swallowed it all, while the pirates melted into the lee of the islands.',
  },
  mission03: {
    prolog:
      'Cauldron Island, a dead afternoon. A lone merchantman with no escort — exactly '
      + 'what the admiralty warned you about. Ready your sides and close in slowly.',
    epilog:
      'It was no merchantman, but a Castillan wolf in sheep\'s clothing. From her deck '
      + 'a voice sounded for the first time — the one meant to be behind it all: Don '
      + 'Cristóbal de Vega. The trap snapped shut on empty air — and the net finally '
      + 'has a name.',
    epilogLose:
      'The Q-ship got the first broadside for free and the Fortuna did not survive it. '
      + 'De Vega struck one frigate off his list.',
  },
  mission04: {
    prolog:
      'The waters off Punta Negra, a fresh wind. The courier already has a lead and is '
      + 'making for the guns of the fortress. If you want those dispatches, you must '
      + 'sail better than he does.',
    epilog:
      'The Céfiro never made port. From the dispatches a picture takes shape: de Vega '
      + 'answers to someone higher, someone with a treasure fleet and the rank of '
      + 'almirante. Silver and war are one and the same plan.',
    epilogLose:
      'The courier slipped under the fortress by a hair. The dispatches are safe in '
      + 'Castillan hands — and you were left standing in its range with empty hands.',
  },
  mission05: {
    prolog:
      'The bay of Bone Island at dawn. Somewhere in that shadow Silas Rourke lies at '
      + 'anchor — a pirate paid by Castillan silver. The Goshawk guards your flank; '
      + 'sail in and smash the nest.',
    epilog:
      'The nest burned and Rourke fell — or knelt. Before he fell silent, he gave up '
      + 'the last piece of the net: almirante Herrera and the last of the silver are '
      + 'making for the strait at the Three Beacons. That is where it will be decided.',
    epilogLose:
      'The battery and the pack were more than two ships could handle. The Fortuna '
      + 'stayed behind in the bay of Bone Island, and Rourke laughs on.',
  },
  mission06: {
    prolog:
      'The strait at the Three Beacons. On the horizon a Castillan squadron and, with '
      + 'it, the war de Vega has been preparing all along. Three ships of yours against '
      + 'a ship of the line and a frigate. This is where it breaks.',
    epilog:
      'The Trueno is silent, the silver lies on the bottom of the strait and Herrera\'s '
      + 'squadron is broken. The war someone in Castilla wove so carefully does not come '
      + 'to pass today at the Three Beacons — but de Vega, the hand behind it all, has '
      + 'vanished into shadow. This was not the end. It was the beginning of open war.',
    epilogLose:
      'The Fortuna fell at the Three Beacons and the silver sailed on to the straits. '
      + 'The war you were meant to prevent has just begun — and you will not be there '
      + 'for it.',
  },
  mission07: {
    prolog:
      'Gull Island, early morning. Smoke over the anchor station and frigate sails to '
      + 'windward — Castilla strikes back. De Vega wants blood for the Three Beacons.',
    epilog:
      'The reprisal is beaten off, three Castillan frigates broken against Gull Island. '
      + 'De Vega has learned that brute force is not enough against you — and pulled back '
      + 'to plan something larger. The war is spilling toward his own shores.',
    epilogLose:
      'The station at Gull Island burns, and your squadron with it. De Vega has his '
      + 'revenge.',
  },
  mission08: {
    prolog:
      'At last a trail straight to him. De Vega himself, on a fast courier, is fleeing '
      + 'to Cádiz — and his escort stands in your way. This time it is personal.',
    epilog:
      'The courier got away from you, but his shield has fallen: the Q-ship and both '
      + 'frigates lie on the bottom. De Vega reached Cádiz stripped and cornered — and '
      + 'you know where to find him. All that remains is to break the gate.',
    epilogLose:
      'De Vega and his escort vanished over the horizon toward Cádiz. The hunt ended in '
      + 'failure.',
  },
  mission09: {
    prolog:
      'For the first time three gun decks thunder beneath you: HMS Sovereign, a ship of '
      + 'the line. Before you the gate of Cádiz — a fortress and a squadron, and behind '
      + 'them de Vega and his silver.',
    epilog:
      'The outer defence of Cádiz is broken and de Vega is shut inside with the treasure '
      + 'fleet. The Sovereign proved to be the fist Albion needed. All that remains is to '
      + 'take his silver — and then the man himself.',
    epilogLose:
      'The Sovereign went down under the guns of Cádiz. The blockade is broken and de '
      + 'Vega free.',
  },
  mission10: {
    prolog:
      'Behind the fortress lies Castilla\'s last treasure fleet at anchor — two galleons '
      + 'of silver and their guardians. This silver is the engine of de Vega\'s war. Take it.',
    epilog:
      'The silver fleet is finished, the galleons on the bottom or in your hands. Without '
      + 'silver, de Vega\'s war is dying. One thing remains: the man himself and Corona, '
      + 'his floating throne.',
    epilogLose:
      'The Sovereign fell among the galleons and the silver sailed on. De Vega will make '
      + 'you pay for this war yet.',
  },
  mission11: {
    prolog:
      'The Cádiz roadstead, the last day of the war. Against your fleet stands Corona — '
      + 'four decks of de Vega\'s pride — and the remnant of Castillan power. Here it will '
      + 'be decided who is master of Halcyon.',
    epilog:
      'Corona is silent. Castillan power in Halcyon is broken and de Vega\'s game for two '
      + 'crowns and one sea is over. The wind, the islands and the silver belong once more '
      + 'to those who can read them — and today that was you, captain. The war you were '
      + 'meant to avoid you did not, in the end, prevent; but you won it — and Halcyon will '
      + 'remember.',
    epilogLose:
      'The Sovereign sinks into the Cádiz roadstead, and the Albion line with it. Corona '
      + 'sails on and Halcyon gets a new master — Don Cristóbal de Vega. The war is lost.',
  },
}
