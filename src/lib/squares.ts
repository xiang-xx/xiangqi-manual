/** 文件 a–i → 0–8；行 9（黑底）→ 0（红底） */
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] as const;

export type Square = string;

export function squareFromIndices(file: number, rankIndex: number): Square {
  return `${FILES[file]}${9 - rankIndex}`;
}

export function indicesFromSquare(square: Square): { file: number; rankIndex: number } {
  const file = FILES.indexOf(square[0] as (typeof FILES)[number]);
  const rank = Number(square.slice(1));
  return { file, rankIndex: 9 - rank };
}

export function parseUci(uci: string): { from: Square; to: Square } | null {
  const m = /^([a-i][0-9])([a-i][0-9])$/i.exec(uci.trim());
  if (!m) return null;
  return { from: m[1].toLowerCase(), to: m[2].toLowerCase() };
}
