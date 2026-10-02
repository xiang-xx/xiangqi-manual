/** 棋谱结果：红胜 / 黑胜 / 和（先手名在标题左侧） */
export type ManualResult = 'red' | 'black' | 'draw';

const TITLE_RESULT_RE = /^(.+?)\s+(胜|负|和)\s+(.+)$/;

/** 东萍标题「红方 胜/负/和 黑方」→ 结果 */
export function parseResultFromTitle(title: string): ManualResult | null {
  const m = TITLE_RESULT_RE.exec(title.trim());
  if (!m) return null;
  if (m[2] === '和') return 'draw';
  if (m[2] === '胜') return 'red';
  if (m[2] === '负') return 'black';
  return null;
}

/** 东萍 result 标签，如「红胜」「黑胜」「和棋」 */
export function parseResultFromDongping(raw: string | null | undefined): ManualResult | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  if (/和/.test(t)) return 'draw';
  if (/红胜|先胜|红方胜|1\s*-\s*0/.test(t)) return 'red';
  if (/黑胜|后胜|黑方胜|0\s*-\s*1/.test(t)) return 'black';
  return null;
}

export function resolveManualResult(opts: {
  title?: string;
  dongpingResult?: string | null;
}): ManualResult | null {
  return parseResultFromDongping(opts.dongpingResult) ?? parseResultFromTitle(opts.title ?? '');
}

/** 只选了先手或只选了后手开局时，返回该侧；两侧都选 / 都未选则 null */
export function exclusiveOpeningSide(
  redOpening: string | null | undefined,
  blackOpening: string | null | undefined,
): 'red' | 'black' | null {
  if (redOpening && !blackOpening) return 'red';
  if (blackOpening && !redOpening) return 'black';
  return null;
}

/** 相对某一侧：胜 / 和；负或未知返回 null */
export function resultHintForSide(
  result: ManualResult | null | undefined,
  side: 'red' | 'black',
): '胜' | '和' | null {
  if (!result) return null;
  if (result === 'draw') return '和';
  if (result === side) return '胜';
  return null;
}

/** 该侧是否应保留（胜/和；未知结果保留） */
export function keepsResultForSide(
  result: ManualResult | null | undefined,
  side: 'red' | 'black',
): boolean {
  if (!result) return true;
  return result === 'draw' || result === side;
}
