import { parseUci } from './squares';

/** 谱内展示以 ManualMove.san 为准；此函数仅作兜底。 */
export function formatUci(uci: string): string {
  const parsed = parseUci(uci);
  if (!parsed) return uci;
  return `${parsed.from}→${parsed.to}`;
}

export function normalizeIccs(move: string): string {
  return move.trim().toLowerCase().replace(/-/g, '');
}
