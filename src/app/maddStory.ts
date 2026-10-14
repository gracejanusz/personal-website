// Story chapters for /madd. Each line belongs to specific searches: clicking one
// of a line's `queries` reveals that line, so the later parts of a chapter only
// appear when someone finds the later searches. Chapters are in timeline order,
// and lines show in the panel in the order listed here, whatever order they're
// found in.

export type SoundName = "radio" | "ticks" | "scurry" | "chiptune" | "heartbeat" | "wind" | "hollow" | "engine";

export type Line = { text: string; queries: string[] };

export type Chapter = {
  id: string;
  title: string;
  color: string; // glow tint around him while this chapter is active
  sound: SoundName;
  lines: Line[];
};

export const chapters: Chapter[] = [
  {
    id: "garage",
    title: "the garage",
    color: "255,190,120",
    sound: "radio",
    lines: [
      {
        text: "Saturday morning. The radio slides between stations and settles on Montgomery Gentry.",
        queries: ["montgomery gentry albums"],
      },
      {
        text: "He is pricing a trailer for a motorcycle, reading about clutch springs and the men who race them.",
        queries: ["3 rail motorcycle trailer", "suzuki clutch springs", "schnitz racing", "murdoch racing"],
      },
      {
        text: "Something in the garage is always half taken apart. Right now it's a 1975 KZ900.",
        queries: ["kz900", "kz900 microfish", "kz900 parts on microfish", "1975 kz900"],
      },
    ],
  },
  {
    id: "kid",
    title: "the other user",
    color: "140,200,255",
    sound: "chiptune",
    lines: [
      { text: "Some evenings the computer belongs to someone smaller.", queries: ["avatar high.com"] },
      { text: "What color is Pluto. Uranus. Saturn.", queries: ["what color is pluto", "uranus", "planet saturn"] },
      {
        text: "Pokémon cards, Harry Potter, free games, each typed twice a second apart, in case the first one didn't take.",
        queries: [
          "free online games.com",
          "pokemon ex cards",
          "pok'emon ex mystic force cards.com",
          "ex cards",
          "harry potter.com",
          "harry potter and the goblet of fire.com",
          "harry potter",
          "funbrain.com",
        ],
      },
    ],
  },
  {
    id: "credit",
    title: "the score",
    color: "150,170,200",
    sound: "ticks",
    lines: [
      {
        text: "He wants a house. The first question is how low is too low.",
        queries: [
          "100 mortgage financing and low credit score",
          "low credit score mortgage loans",
          "how low can credit score be to qualify for mortgage",
        ],
      },
      {
        text: "Then how to fix it quickly, and what the negative items even mean.",
        queries: ["how to quickly improve credit scores", "how to understand a credit report and negative information"],
      },
      {
        text: "Form letters. A bankruptcy, still on the report.",
        queries: ["form letters for credit repair", "should credit reports show included in bankruptcy"],
      },
      {
        text: "Two months later he is still writing to Experian, by mail.",
        queries: [
          "experian credit report and score",
          "how to dispute credit report inaccuracies",
          "how to correct experian credit report by mail",
        ],
      },
    ],
  },
  {
    id: "gerbils",
    title: "the gerbils",
    color: "230,200,160",
    sound: "scurry",
    lines: [
      {
        text: "Someone brings home gerbils. He looks up how to care for them, then how to breed them.",
        queries: ["caring for gerbils", "breeding gerbils", "breeding garbils"],
      },
      {
        text: "A month later, one is loose somewhere in the house.",
        queries: ["how to catch a loose gerbil", "catching a loose gerbil"],
      },
    ],
  },
  {
    id: "pregnancy",
    title: "april 5",
    color: "255,190,210",
    sound: "heartbeat",
    lines: [
      { text: "When to take a pregnancy test.", queries: ["when to do pregnancy testing"] },
      { text: "Whether a negative can be wrong.", queries: ["false negative on home pregnancy tests"] },
      { text: "Baby names ending in y.", queries: ["baby names ending in y"] },
    ],
  },
  {
    id: "tornado",
    title: "april 7",
    color: "170,200,170",
    sound: "wind",
    lines: [{ text: "A tornado comes through Sumner County, close enough to look up.", queries: ["tornado sumner county"] }],
  },
  {
    id: "man",
    title: "man being a man",
    color: "255,120,110",
    sound: "engine",
    lines: [
      { text: "Meanwhile, a Kawasaki ZX-14.", queries: ["kawasaki zx14", "zx14", "kawasaki parts"] },
      { text: "The NBA All-Star roster.", queries: ["nba allstar roster"] },
      {
        text: "One night in May, the searches people make alone, and then a site of yo mama jokes.",
        queries: ["big boobs", "free porn", "yo mama sofat.com", "yomoma sofat.com"],
      },
    ],
  },
  {
    id: "divorce",
    title: "april 19",
    color: "120,120,130",
    sound: "hollow",
    lines: [
      {
        text: "Two weeks after the test: medical bills and divorce.",
        queries: ["medical bills and divorce", "medical billing and divorce laws"],
      },
      {
        text: "Who pays half. Whether the papers count as proof.",
        queries: [
          "paying 1 2 of medical bills after divorce",
          "can i show divorce papers to physician's office for medical billing",
        ],
      },
      {
        text: "Billing his ex-wife directly, instead of waiting.",
        queries: ["billing ex-wife directly for medical bills instead of waiting for reimbursement"],
      },
    ],
  },
];

// Which chapter and line each search reveals. Line keys look like "garage:2".
export const lineByQuery = new Map<string, { chapter: Chapter; key: string }>(
  chapters.flatMap((c) => c.lines.flatMap((l, i) => l.queries.map((q) => [q, { chapter: c, key: `${c.id}:${i}` }] as const))),
);
