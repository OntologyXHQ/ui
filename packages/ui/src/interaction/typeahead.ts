export type TypeaheadSearchOptions = {
  key: string;
  labels: readonly string[];
  currentIndex?: number;
  nowMs?: number;
  /** Menu-like collections search after the active item; Select keeps first-match semantics until repeated-key cycling. */
  preferNextMatch?: boolean;
};

export type TypeaheadMatch = {
  index: number;
  query: string;
  repeated: boolean;
};

export class TypeaheadController {
  private query = '';
  private updatedAtMs = Number.NEGATIVE_INFINITY;

  constructor(private readonly resetAfterMs = 700) {}

  search({
    key,
    labels,
    currentIndex = -1,
    nowMs = monotonicNow(),
    preferNextMatch = false,
  }: TypeaheadSearchOptions): TypeaheadMatch | null {
    if (!isTypeaheadCharacter(key) || labels.length === 0) return null;

    const normalizedKey = normalizeTypeaheadText(key);
    const previous = nowMs - this.updatedAtMs > this.resetAfterMs ? '' : this.query;
    const repeated = previous.length > 0 && [...previous].every((character) => character === normalizedKey);
    const query = repeated ? normalizedKey : `${previous}${normalizedKey}`;
    this.query = query;
    this.updatedAtMs = nowMs;

    const matches = labels
      .map((label, index) => ({ index, label: normalizeTypeaheadText(label) }))
      .filter((candidate) => candidate.label.startsWith(query));
    if (!matches.length) return null;

    let match = matches[0];
    if ((repeated || preferNextMatch) && matches.length > 1) {
      const currentMatchIndex = matches.findIndex((candidate) => candidate.index === currentIndex);
      if (currentMatchIndex >= 0) match = matches[(currentMatchIndex + 1) % matches.length] ?? match;
    } else if (preferNextMatch && currentIndex >= 0) {
      match = matches.find((candidate) => candidate.index > currentIndex) ?? matches[0];
    }

    return { index: match.index, query, repeated };
  }

  reset() {
    this.query = '';
    this.updatedAtMs = Number.NEGATIVE_INFINITY;
  }
}

export function normalizeTypeaheadText(value: string | null | undefined) {
  return (value ?? '').normalize('NFKC').trim().toLocaleLowerCase();
}

export function isTypeaheadCharacter(key: string) {
  return key.length === 1 && !/\s/u.test(key);
}

function monotonicNow() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
