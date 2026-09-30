/**
 * 棋声（落子 / 吃子 / 将军 / 将死），行为对齐常见象棋 App：
 * 将死 > 将军 > 吃子 > 落子。
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { triggerCombatFlash } from './combatFlash';
import { applyUci, createGame } from './engine';

export type MoveSfx = 'move' | 'capture' | 'check' | 'checkmate';

const SOURCES: Record<MoveSfx, number> = {
  move: require('../../assets/sounds/move.wav'),
  capture: require('../../assets/sounds/capture.wav'),
  check: require('../../assets/sounds/check.wav'),
  checkmate: require('../../assets/sounds/checkmate.wav'),
};

const players: Partial<Record<MoveSfx, AudioPlayer>> = {};
let initPromise: Promise<void> | null = null;

export function initSfx(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
        allowsRecording: false,
        shouldPlayInBackground: false,
      });
      for (const kind of Object.keys(SOURCES) as MoveSfx[]) {
        if (players[kind]) continue;
        const player = createAudioPlayer(SOURCES[kind], { keepAudioSessionActive: true });
        player.volume = 1;
        players[kind] = player;
      }
    })().catch((err) => {
      console.warn('sfx init failed', err);
      initPromise = null;
    });
  }
  return initPromise ?? Promise.resolve();
}

export function classifyMoveSfx(fenBefore: string, uci: string): MoveSfx | null {
  const applied = applyUci(fenBefore, uci);
  if (!applied) return null;
  const game = createGame(applied.fen);
  if (game.in_checkmate()) return 'checkmate';
  if (game.in_check()) return 'check';
  if (applied.move.captured) return 'capture';
  return 'move';
}

export function playSfx(kind: MoveSfx): void {
  if (kind === 'check' || kind === 'checkmate') {
    triggerCombatFlash(kind);
  }
  void initSfx().then(() => {
    const player = players[kind];
    if (!player) return;
    void player.seekTo(0).then(() => {
      player.play();
    });
  });
}

export function playMoveSfx(fenBefore: string, uci: string): void {
  const kind = classifyMoveSfx(fenBefore, uci);
  if (kind) playSfx(kind);
}

/** 局面变化且有 lastMove 时播对应棋声 */
export function playSfxIfMoved(
  prevFen: string,
  nextFen: string,
  lastMove: { from: string; to: string } | null | undefined,
): void {
  if (!lastMove || prevFen === nextFen) return;
  playMoveSfx(prevFen, `${lastMove.from}${lastMove.to}`);
}
