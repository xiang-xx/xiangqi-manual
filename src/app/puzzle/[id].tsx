import { useKeepAwake } from 'expo-keep-awake';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Board } from '../../components/Board';
import { BoardScreenLayout } from '../../components/BoardScreenLayout';
import { getPuzzleById, nextPuzzleId } from '../../data/puzzles';
import { findBestMove, isPikafishAvailable, shutdownEngine } from '../../lib/pikafish';
import {
  applyOpponentMove,
  beginOpponentThink,
  initialPuzzleState,
  isOpponentTurn,
  isSolverTurn,
  playOpponentReply,
  restartPuzzle,
  resolvePuzzleFlipped,
  revealNext,
  selectSquare,
  showHint,
  toPuzzleProgress,
  type PuzzleState,
} from '../../lib/puzzleMachine';
import { loadPuzzleProgress, savePuzzleProgress } from '../../lib/puzzleProgress';
import { playMoveSfx, playSfxIfMoved } from '../../lib/sfx';
import type { Square } from '../../lib/squares';
import { wood } from '../../lib/theme';

/** 残棋对方固定弱档，避免强防堵死杀局 */
const PUZZLE_AI_DIFFICULTY = '入门' as const;
const OPPONENT_DELAY_MS = 400;

export default function PuzzleScreen() {
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });
  const { id } = useLocalSearchParams<{ id: string }>();
  const puzzle = getPuzzleById(id);
  const router = useRouter();
  const [state, setState] = useState<PuzzleState | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [useEngine, setUseEngine] = useState(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opponentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiBusy = useRef(false);
  const genRef = useRef(0);
  const mounted = useRef(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    mounted.current = true;
    setUseEngine(isPikafishAvailable());
    return () => {
      mounted.current = false;
      void shutdownEngine();
    };
  }, []);

  useEffect(() => {
    if (!puzzle) return;
    let alive = true;
    aiBusy.current = false;
    genRef.current += 1;
    if (opponentTimer.current) clearTimeout(opponentTimer.current);
    (async () => {
      const progress = await loadPuzzleProgress(puzzle.id);
      if (!alive) return;
      setFlipped(resolvePuzzleFlipped(puzzle, progress));
      setState(initialPuzzleState(puzzle, progress));
    })();
    return () => {
      alive = false;
      if (opponentTimer.current) clearTimeout(opponentTimer.current);
    };
  }, [puzzle]);

  useEffect(() => {
    if (!puzzle || !state) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      void savePuzzleProgress(puzzle.id, toPuzzleProgress(state, flipped));
    }, 200);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [puzzle, state, flipped]);

  // 无引擎：对方走谱
  useEffect(() => {
    if (!puzzle || !state || useEngine) return;
    if (!isOpponentTurn(puzzle, state)) return;

    if (opponentTimer.current) clearTimeout(opponentTimer.current);
    opponentTimer.current = setTimeout(() => {
      setState((prev) => {
        if (!prev) return prev;
        const next = playOpponentReply(puzzle, prev);
        playSfxIfMoved(prev.fen, next.fen, next.lastMove);
        return next;
      });
    }, OPPONENT_DELAY_MS);

    return () => {
      if (opponentTimer.current) clearTimeout(opponentTimer.current);
    };
  }, [puzzle, state?.fen, state?.status, state?.thinking, useEngine]);

  // 有引擎：对方 AI
  useEffect(() => {
    if (!puzzle || !state || !useEngine) return;
    if (!isOpponentTurn(puzzle, state)) return;
    if (aiBusy.current) return;

    const requestFen = state.fen;
    let cancelled = false;
    aiBusy.current = true;
    const gen = ++genRef.current;

    (async () => {
      setState((prev) =>
        prev && prev.fen === requestFen ? beginOpponentThink(prev) : prev,
      );
      try {
        const uci = await findBestMove(requestFen, PUZZLE_AI_DIFFICULTY);
        if (cancelled || !mounted.current || genRef.current !== gen) return;
        await new Promise((r) => setTimeout(r, OPPONENT_DELAY_MS));
        if (cancelled || !mounted.current || genRef.current !== gen) return;
        setState((prev) => {
          if (!prev || prev.fen !== requestFen) return prev;
          const next = applyOpponentMove(puzzle, prev, uci);
          playMoveSfx(prev.fen, uci);
          return next;
        });
      } catch {
        if (cancelled || !mounted.current || genRef.current !== gen) return;
        // 引擎失败则回退走谱（仅主变上可用）
        setUseEngine(false);
        setState((prev) => {
          if (!prev || prev.fen !== requestFen) return prev;
          const warmed = { ...prev, thinking: false };
          const next = playOpponentReply(puzzle, warmed);
          playSfxIfMoved(prev.fen, next.fen, next.lastMove);
          return next;
        });
      } finally {
        if (genRef.current === gen) aiBusy.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [puzzle, state?.fen, state?.status, useEngine]);

  if (!puzzle) {
    return (
      <View style={[styles.fallback, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.error}>未找到残棋</Text>
      </View>
    );
  }

  if (!state) {
    return (
      <View style={[styles.fallback, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.muted}>载入中…</Text>
      </View>
    );
  }

  const nextId = nextPuzzleId(puzzle.id);
  const done = state.status !== 'playing';
  const canInteract = isSolverTurn(puzzle, state);

  const onRestart = () => {
    aiBusy.current = false;
    genRef.current += 1;
    if (opponentTimer.current) clearTimeout(opponentTimer.current);
    setUseEngine(isPikafishAvailable());
    setState((prev) => (prev ? restartPuzzle(puzzle, prev) : prev));
  };

  const overlayText =
    state.feedback ||
    state.comment ||
    (state.thinking ? '对方落子…' : null);

  return (
    <>
      <Stack.Screen
        options={{
          title: puzzle.title,
          headerStyle: { backgroundColor: wood.header },
          headerTintColor: wood.cream,
          headerTitleStyle: { fontWeight: '500', fontSize: 16 },
          headerShadowVisible: false,
          statusBarStyle: 'light',
        }}
      />
      <View style={styles.root}>
        <BoardScreenLayout
          bottomInset={insets.bottom}
          header={
            <View style={styles.topBar}>
              <Text style={styles.goal}>{puzzle.goalLabel}</Text>
              <Pressable onPress={() => setFlipped((f) => !f)} hitSlop={10}>
                <Text style={styles.flip}>翻转</Text>
              </Pressable>
            </View>
          }
          overlay={
            overlayText ? (
              <View style={styles.noteBlock}>
                {state.comment && !state.feedback && !state.thinking ? (
                  <Text style={styles.comment} numberOfLines={4}>
                    {state.comment}
                  </Text>
                ) : null}
                {state.feedback ? (
                  <Text style={styles.feedback} numberOfLines={1}>
                    {state.feedback}
                  </Text>
                ) : state.thinking ? (
                  <Text style={styles.thinking} numberOfLines={1}>
                    对方落子…
                  </Text>
                ) : null}
              </View>
            ) : null
          }
          board={
            <Board
              fen={state.fen}
              flipped={flipped}
              selected={canInteract ? state.selected : null}
              legalTargets={canInteract ? state.legalTargets : []}
              hintFrom={state.hintFrom}
              hintTo={state.hintTo}
              lastMove={state.lastMove}
              onSquarePress={(sq: Square) => {
                if (!canInteract) return;
                setState((prev) => {
                  if (!prev) return prev;
                  const next = selectSquare(puzzle, prev, sq, { requireBook: !useEngine });
                  playSfxIfMoved(prev.fen, next.fen, next.lastMove);
                  return next;
                });
              }}
            />
          }
          actions={
            done
              ? [
                  {
                    key: 'restart',
                    label: '重来',
                    onPress: onRestart,
                  },
                  nextId
                    ? {
                        key: 'next',
                        label: '下一题',
                        primary: true,
                        onPress: () => router.replace(`/puzzle/${nextId}`),
                      }
                    : {
                        key: 'list',
                        label: '回列表',
                        primary: true,
                        onPress: () => router.replace('/(tabs)/puzzles'),
                      },
                ]
              : [
                  {
                    key: 'hint',
                    label: '提示',
                    onPress: () => setState((prev) => (prev ? showHint(puzzle, prev) : prev)),
                  },
                  {
                    key: 'reveal',
                    label: '看答案',
                    onPress: () =>
                      setState((prev) => {
                        if (!prev) return prev;
                        const next = revealNext(puzzle, prev);
                        playSfxIfMoved(prev.fen, next.fen, next.lastMove);
                        return next;
                      }),
                  },
                  {
                    key: 'restart',
                    label: '重来',
                    onPress: onRestart,
                  },
                ]
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: wood.stage,
  },
  fallback: {
    flex: 1,
    backgroundColor: wood.stage,
    paddingHorizontal: 16,
  },
  error: { color: wood.danger, fontSize: 15 },
  muted: { color: wood.creamSoft, fontSize: 14 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goal: {
    color: wood.creamFaint,
    fontSize: 12,
    letterSpacing: 2,
  },
  flip: {
    color: wood.creamSoft,
    fontSize: 13,
    letterSpacing: 2,
  },
  noteBlock: {},
  comment: {
    color: wood.cream,
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.88,
  },
  feedback: {
    marginTop: 4,
    color: wood.gold,
    fontSize: 12,
  },
  thinking: {
    marginTop: 4,
    color: wood.creamFaint,
    fontSize: 12,
  },
});
