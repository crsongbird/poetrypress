# Happenings on the Ringworld: robot fights, mages, hunts, people in company, the giant's beam

Ruby, 2026-10-26: "More robots and robots that attack people and other robots... robot fights. robot wars. robots
versus mages. humans in groups. humanoids moving to true destinations in groups or in organized paths. wildlife that
interact with each other. robots hunting wildlife. the large tall half-giant robot that can't move... it's head should
be able to shoot a laser, guardian laser style." How to read the tags: [src](URL) is a page that was opened and read;
[est] is an estimate, a computation or a design judgment.

## 1 · What it is drawn from

- The Decayed Guardian of Breath of the Wild: Guardians that have "lost their mobility" over long exposure to the
  elements; as the player nears, they "light up and aim their laser sights at him in preparation to fire"; damaged, they
  fire "several lasers in rapid succession"; in Master Mode they "take slightly longer in their charge up phase", to
  throw off the player's timing [src](https://zeldawiki.wiki/wiki/Decayed_Guardian).
- How wolves hunt: they try "getting as close to it as possible without being seen", using gullies and ridges; they "test
  animals' health status by running at and chasing a herd or individual for a short distance"; "These chases often don't
  last long", and "only a small portion of hunts will be successful"; they "will leave if they can't get the animal to
  run" [src](https://www.ukwct.org.uk/files/hunting.pdf).
- Red Dead Redemption 2's wolves "attack in packs surrounding their prey"
  [src](https://www.well-played.com.au/all-about-red-dead-redemption-2s-wildlife-horses-hunting-and-fishing/).
- Never a flash: no more than three flashes a second, the flashing area small
  [src](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html).

## 2 · So in the painter [est]

Every happening is a pure function of its own seed and the clock (eventKit.js `evAt`), in eras that end where the next
begins, so a film can start anywhere and nothing jumps.

- A skirmish (the neon, the ruins, the builders' country, now and then a city): two lines of two or three robots close
  from 46 m to some 24 and trade bolts, each on its own beat, many missing into the ground; one of the losing side is
  knocked down by a shot timed to land, topples and smokes, its side backs off; the fire stops, both walk back to their
  lines, and the fallen one is mended and stands before the next era.
- Mages against sentries (the magic world): one or two people in robes of their region's light, staffs lit at the tip,
  raised as they cast; their orbs fly slower on an arc, the sentries' bolts are met by a shield of light round the mage.
- A drone running a herd (the builders' open country) and a wolf pack running deer or elk (the wilds): the herd grazes,
  the hunter closes from its waiting place (a pack stalking low), the herd bolts and runs to the far grazing, the hunter
  after it a few lengths behind (a drone's shots kicking up the ground about the herd) until it is outrun, then draws off
  to wait beyond; next era the hunt runs back the other way. Nothing is caught.
- People in company (the towns most, the villages too): a band of three to seven sets out from one house's door to
  another's some 40 to 180 m off, walks there in pairs on a gentle curve, gathers there in a loose ring a while and walks
  back; by day only, and at all hours in a neon city.
- The kneeling giant wakes every half minute or so: its eye lights, a thin beam settles on a mark on the ground before it
  for some five seconds, the eye gathers its light, and the beam fires for about a second, eased on and off over a
  quarter of a second and more, with a small burst and a scorch that fades (`evGiant`).
- Robots are half again as common as they were.
