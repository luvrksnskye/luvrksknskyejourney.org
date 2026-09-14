const A = 'assets/images/';

const CORE_SEEDS = [
  { id: 'roots',      icon: 'ico-handbook.png',      label: 'ROOTS',      r: 58,  a: -2.55 },
  { id: 'scenery',    icon: 'ico-scenery.png',       label: 'SCENERY',    r: 104, a: -1.98 },
  { id: 'stargazing', icon: 'ico-astrology.png',     label: 'STARGAZING', r: 152, a: -1.32 },
  { id: 'feasts',     icon: 'ico-cooking.png',       label: 'FEASTS',     r: 80,  a: -0.74 },
  { id: 'everyday',   icon: 'ico-daily.png',         label: 'EVERYDAY',   r: 126, a: -0.12 },
  { id: 'encounters', icon: 'ico-quest.png',         label: 'ENCOUNTERS', r: 184, a:  0.56 },
  { id: 'tables',     icon: 'ico-restaurant.png',    label: 'TABLES',     r: 104, a:  1.14 },
  { id: 'detours',    icon: 'ico-investigation.png', label: 'DETOURS',    r: 58,  a:  1.86 },
  { id: 'milestones', icon: 'ico-level.png',         label: 'MILESTONES', r: 152, a:  2.44 },
  { id: 'notes',      icon: 'ico-handbook.png',      label: 'NOTES',      r: 126, a:  3.02 },
];

const R = 'assets/images/photos/roots/';

const TIMELINES = {
  roots: [
    {
      id:    'parents-costa-rica',
      title: 'BEFORE ME',
      date:  'c. LATE 1970s · COSTA RICA',
      note:  "My dad and his little sister on her graduation day. Look at how young they are. Costa Rica, sometime in the late 70s I think. Long before any of this. Before Venezuela, before the States, before me. Two kids becoming adults together, and neither of them knowing what was coming.",
      photo: R + '01-parents-costa-rica.jpg',
    },
    {
      id:    'mom-nursing-grad',
      title: 'THE RED DRESS',
      date:  'c. EARLY 1990s · VENEZUELA',
      note:  "Mom the day she graduated as a nurse. She wore red. Diploma in one hand, that smile on her face like nothing in the world could touch her. I look at this and I get it. I get where my stubborn kind of hope comes from.",
      photo: R + '02-mom-nursing-grad.jpg',
    },
    {
      id:    'mom-garden',
      title: 'SAME DAY, DIFFERENT LIGHT',
      date:  'SAME AFTERNOON',
      note:  "Same day as the last one. They took her from spot to spot after the ceremony, cameras clicking everywhere. This one's my favorite. Green everywhere, that arch behind her, the red dress against the leaves. For one afternoon the whole world was hers, and she knew it.",
      photo: R + '03-mom-garden.jpg',
    },
    {
      id:    'grandparents-colombia',
      title: 'ABUELO Y ABUELA',
      date:  'CHRISTMAS · AGE 3 or 4',
      note:  "My mom's parents. Colombians, both of them. This is around Christmas, you can see the poinsettias behind us. I was tiny, maybe three, maybe four. My abuelo is on the left in the yellow shirt. He passed away when I was eight, and I remember him more in fragments than in scenes. His laugh, his hands, the smell of his shirts. My abuela is on the right, and she still is. I'm sitting between them like a punchline to a joke only we understood.",
      photo: R + '04-grandparents-colombia.jpg',
    },
    {
      id:    'toddler-portrait',
      title: 'STUDIO KID',
      date:  'AGE 3 or 4',
      note:  "My dad went through a phase where he wanted a studio portrait of me from every angle of every year. This is one of the earliest that survived. Peach little top, hair everywhere, that face I still make when I'm about to laugh at something no one else finds funny.",
      photo: R + '05-toddler-portrait.jpg',
    },
    {
      id:    'cattle-fair',
      title: 'FERIA DE SAN SEBASTIÁN',
      date:  'AGE 3 or 4 · VENEZUELA',
      note:  "The Feria de San Sebastián. I was so small I don't remember any of it, but the photo remembers for me. The animals scared me honestly, but my dad absolutely adored dragging me everywhere with him, and, well, I adored being dragged. Blue cap pulled low, plastic pony under me, one very real cow behind us pretending not to notice.",
      photo: R + '06-cattle-fair.jpg',
    },
    {
      id:    'first-school',
      title: 'FIRST SCHOOL',
      date:  'AGE 5 or 6',
      note:  "The day I was admitted to my first school. My dad was over the moon so of course, straight to the studio afterwards. The bear was almost as tall as I was and I hugged it like it had earned it. First of many small ceremonies my dad turned into full events.",
      photo: R + '07-first-school.png',
    },
    {
      id:    'sisters-wedding',
      title: 'THE RING BEARER',
      date:  'AGE 7 or 8',
      note:  "My older sister's wedding. I had ONE job... don't lose the rings. I look serious in this photo because I was serious. Nervous eyes, tiny hands, all my focus on that little cushion. I remember being so proud of not messing it up. Nuestra Boda printed at the bottom like the day was mine too.",
      photo: R + '08-sisters-wedding.jpg',
    },
    {
      id:    'shells-beach',
      title: 'SEA SHELLS',
      date:  'AGE 10 · U.S. COAST',
      note:  "The coast, somewhere in the States. I spent hours crouched at the tide line, pockets full of shells, sand and salt and all. Back home I lined them up in cups on my desk and sometimes I painted them. Little kid treasure hunting. I still remember the way I felt when I found a whole one, the tiny thrill of it.",
      photo: R + '09-shells-beach.jpg',
    },
    {
      id:    'chicago-16',
      title: 'SIXTEEN',
      date:  'AGE 16 · CHICAGO',
      note:  "Sixteen. Chicago behind me, cold air off the lake, that peace sign I did without thinking. I was socially awkward, honestly. Spent most of my time alone in art class, sometimes French, sometimes photography. I've spoken English fluently since I was tiny, and between that and how I look, the hispanic kids at school just assumed I didn't speak Spanish and kept me out of their circles. I did. I do. But eventually I stopped trying, stopped wanting to fit in, and just floated with the current. There's one story I have to tell about this though. I found out one of the ESL teachers was from Spain, and I wanted so badly to talk to someone actually from there that I begged my counselor to let me into an ESL class. She looked at me, laughed, told me I didn't need that. I begged harder. She finally caved. I made it three whole classes before they realized I very obviously didn't belong in ESL and pulled me back out. Absolutely worth it.",
      photo: R + '10-chicago-16.jpg',
    },
    {
      id:    'with-dad-chicago',
      title: 'WITH DAD',
      date:  'JULY 2022 · CHICAGO THEATRE',
      note:  "Same trip. Dad and me under the Chase Chicago marquee, downtown, the Marina City towers behind us. Lovett or Leave It, Father John Misty, Daniel Howell all lined up on the sign like a little prophecy of the year I was about to have. Dad in a blue shirt, me tucked under his arm, Calvin Klein sweater again because of course. This is one of the ones I keep. Him deciding I was old enough to just walk around a city with him.",
      photo: R + '11-with-dad-chicago.jpg',
    },
    {
      id:    'dad-laughing',
      title: 'DAD LAUGHING',
      date:  'JULY 2022 · SAME BLOCK',
      note:  "Same block, one photo later, and Dad is cracking up at something. I don't remember what I said, or what he said, or which one of us started it. I just remember laughing hard enough that whoever took the photo caught him mid-laugh and me trying to hold mine in. Some photos I love because of the composition and some I love because they caught the sound of a moment. This one caught the sound.",
      photo: R + '12-dad-laughing.jpg',
    },
    {
      id:    'eighteen-family',
      title: 'EIGHTEEN',
      date:  'JUNE 2023 · BIRTHDAY EVE',
      note:  "Eighteen. Same Calvin Klein sweater as the Chicago photos, I swear I wore that thing half the year. Mom, my aunt, my cousin, all of them clapping, and me trying not to cry into the cake. The next morning we drove to Universal Studios in Florida (I wrote the whole trip in the summer '23 journal entry). This photo is the night before, and honestly, it's the exact moment I started believing birthdays could be mine.",
      photo: R + '13-eighteen-family.jpg',
    },
    {
      id:    'birthday-21',
      title: 'TWENTY-ONE',
      date:  '2026 · MY 21ST',
      note:  "My 21st birthday. I slept terribly, woke up not wanting to celebrate anything. Dad and his wife came over anyway and pulled me out of my cave without telling me where we were going. Pajamas, sweater, crocs. The whole time I was terrified they'd take me somewhere I actually had to dress for. It ended up being a restaurant. Long face, hair a mess, and this is the photo. Bittersweet. I look like a disaster and I'm keeping it because that's what turning 21 actually looked like, not the version I would have staged.",
      photo: R + '14-birthday-21.jpg',
    },
  ],
  scenery:    [],
  stargazing: [],
  feasts:     [],
  everyday:   [],
  encounters: [],
  tables:     [],
  detours:    [],
  milestones: [],
  notes:      [],
};

export const cores = CORE_SEEDS.map((s, i) => ({
  id:       s.id,
  title:    s.label,
  catLabel: s.label,
  icon:     A + s.icon,
  r:        s.r,
  a:        s.a,
  index:    i,
  memories: (TIMELINES[s.id] || []).map((m, j) => ({
    id:    m.id    || `${s.id}-${String(j + 1).padStart(2, '0')}`,
    title: m.title || `MEMORY ${String(j + 1).padStart(2, '0')}`,
    date:  m.date  || '',
    note:  m.note  || '',
    photo: m.photo || '',
    thumb: m.thumb || m.photo || '',
  })),
}));

export const allMemories = cores.flatMap((c) =>
  c.memories.map((m) => ({ ...m, coreId: c.id, coreLabel: c.title, icon: c.icon }))
);
