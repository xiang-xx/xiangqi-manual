import { createGame, fenAfterMoves, turnFromFen } from './engine';
import { formatUci, normalizeIccs } from './notation';
import { findBestMoveTimed } from './pikafish';
import type { PlaySide } from './playMachine';
import { parseUci } from './squares';

export type ReviewNote = {
  /** 着法下标（0-based，对应 moves[ply]） */
  ply: number;
  played: string;
  best: string;
  ok: boolean;
  /** 一行短评 */
  text: string;
};

const REVIEW_MOVETIME_MS = 700;

/**
 * 只检查人走的那几手：与引擎建议比对。
 * 相同算稳妥；不同标「可改进」并给出建议着。
 */
export async function analyzeHumanPlies(
  moves: string[],
  humanSide: PlaySide,
  onProgress?: (done: number, total: number) => void,
): Promise<ReviewNote[]> {
  const startFen = createGame().fen();
  const humanPlies: number[] = [];
  for (let i = 0; i < moves.length; i++) {
    const fen = i === 0 ? startFen : fenAfterMoves(startFen, moves.slice(0, i));
    if (turnFromFen(fen) === humanSide) humanPlies.push(i);
  }

  const notes: ReviewNote[] = [];
  let done = 0;
  for (const ply of humanPlies) {
    const fen = ply === 0 ? startFen : fenAfterMoves(startFen, moves.slice(0, ply));
    const played = normalizeIccs(moves[ply]);
    let best: string;
    try {
      best = normalizeIccs(await findBestMoveTimed(fen, REVIEW_MOVETIME_MS));
    } catch {
      done += 1;
      onProgress?.(done, humanPlies.length);
      continue;
    }
    const ok = played === best;
    const playedLabel = formatUci(played);
    const bestLabel = formatUci(best);
    notes.push({
      ply,
      played,
      best,
      ok,
      text: ok
        ? `第 ${ply + 1} 手 ${playedLabel} · 稳妥`
        : `第 ${ply + 1} 手 ${playedLabel} · 可改进，建议 ${bestLabel}`,
    });
    done += 1;
    onProgress?.(done, humanPlies.length);
  }
  return notes;
}

export function reviewSummary(notes: ReviewNote[]): string {
  if (notes.length === 0) return '无可复盘人着';
  const miss = notes.filter((n) => !n.ok).length;
  if (miss === 0) return `复盘完毕 · ${notes.length} 手均稳妥`;
  return `复盘完毕 · ${miss}/${notes.length} 手可改进`;
}

export function noteAtPly(notes: ReviewNote[], ply: number): ReviewNote | null {
  return notes.find((n) => n.ply === ply) ?? null;
}

export function hintFromNote(note: ReviewNote | null): {
  hintFrom: string | null;
  hintTo: string | null;
} {
  if (!note || note.ok) return { hintFrom: null, hintTo: null };
  const parsed = parseUci(note.best);
  if (!parsed) return { hintFrom: null, hintTo: null };
  return { hintFrom: parsed.from, hintTo: parsed.to };
}
