// The case file on /madd. Every field starts unknown and fills in as story lines
// are found (23 in all). A field can sharpen over several stages: each stage
// takes over once `at` lines have been found. Order matters: the impersonal
// details come first, the most personal last.

export type Field = { label: string; unknown: string; stages: { at: number; text: string }[] };

export const fields: Field[] = [
  { label: "name", unknown: "11139391", stages: [{ at: 9, text: "Gary?" }] },
  {
    label: "age",
    unknown: "?",
    stages: [
      { at: 4, text: "30–45 ?" },
      { at: 7, text: "34–38" },
    ],
  },
  { label: "sex", unknown: "?", stages: [{ at: 2, text: "male" }] },
  {
    label: "occupation",
    unknown: "?",
    stages: [
      { at: 1, text: "works with their hands" },
      { at: 2, text: "works with his hands" },
      { at: 6, text: "mechanic, contractor, or shift supervisor" },
    ],
  },
  {
    label: "location",
    unknown: "?",
    stages: [
      { at: 3, text: "Tennessee" },
      { at: 6, text: "Sumner County, TN (Gallatin / Hendersonville)" },
    ],
  },
  { label: "computer", unknown: "?", stages: [{ at: 5, text: "family desktop in the den, Windows XP" }] },
  { label: "children", unknown: "?", stages: [{ at: 11, text: "one, age 8–11" }] },
  { label: "money", unknown: "?", stages: [{ at: 13, text: "past bankruptcy, low credit, wants a house" }] },
  { label: "marital status", unknown: "?", stages: [{ at: 15, text: "divorced" }] },
  { label: "relationship", unknown: "?", stages: [{ at: 18, text: "seeing someone new. maybe expecting" }] },
];

// Shown under the file once every line is found
export const summary = { at: 23, text: "a tired dad in Middle Tennessee, trying to rebuild his life one search at a time" };

export function fieldValue(field: Field, found: number) {
  const stage = field.stages.filter((s) => found >= s.at).pop();
  return stage ? stage.text : null;
}

// He comes fully into focus once this many lines are found
export const CLEAR_AT = 18;
