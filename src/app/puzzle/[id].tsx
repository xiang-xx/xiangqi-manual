import { useKeepAwake } from 'expo-keep-awake';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Board } from '../../components/Board';
import { BoardScreenLayout } from '../../components/BoardScreenLayout';
import { getPuzzleById, nextPuzzleId } from '../../data/puzzles';
import {
  initialPuzzleState,
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
import type { Square } from '../../lib/squares';
import { wood } from '../../lib/theme';

const OPPONENT_DELAY_MS = 500;

export default function PuzzleScreen() {
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });
  const { id } = useLocalSearchParams<{ id: string }>();
  const puzzle = getPuzzleById(id);
  const router = useRouter();
  const [state, setState] = useState<PuzzleState | null>(null);
  const [flipped, setFlipped] = useState(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opponentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!puzzle) return;
    let alive = true;
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

  useEffect(() => {
    if (!puzzle || !state) return;
    if (state.status !== 'playing') return;
    if (isSolverTurn(state.stepIndex)) return;

    if (opponentTimer.current) clearTimeout(opponentTimer.current);
    opponentTimer.current = setTimeout(() => {
      setState((prev) => (prev ? playOpponentReply(puzzle, prev) : prev));
    }, OPPONENT_DELAY_MS);

    return () => {
      if (opponentTimer.current) clearTimeout(opponentTimer.current);
    };
  }, [puzzle, state?.stepIndex, state?.status]);

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
  const progressLabel = `${Math.min(state.stepIndex, puzzle.solution.length)}/${puzzle.solution.length}`;
  const done = state.status === 'complete';

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
              <Text style={styles.progress}>{progressLabel}</Text>
              <Pressable onPress={() => setFlipped((f) => !f)} hitSlop={10}>
                <Text style={styles.flip}>翻转</Text>
              </Pressable>
            </View>
          }
          overlay={
            state.comment || state.feedback ? (
              <View style={styles.noteBlock}>
                {state.comment ? (
                  <Text style={styles.comment} numberOfLines={4}>
                    {state.comment}
                  </Text>
                ) : null}
                {state.feedback ? (
                  <Text style={styles.feedback} numberOfLines={1}>
                    {state.feedback}
                  </Text>
                ) : null}
              </View>
            ) : null
          }
          board={
            <Board
              fen={state.fen}
              flipped={flipped}
              selected={state.selected}
              legalTargets={state.legalTargets}
              hintFrom={state.hintFrom}
              hintTo={state.hintTo}
              lastMove={state.lastMove}
              onSquarePress={(sq: Square) =>
                setState((prev) => (prev ? selectSquare(puzzle, prev, sq) : prev))
              }
            />
          }
          actions={
            done
              ? [
                  {
                    key: 'restart',
                    label: '重来',
                    onPress: () =>
                      setState((prev) => (prev ? restartPuzzle(puzzle, prev) : prev)),
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
                    onPress: () => setState((prev) => (prev ? revealNext(puzzle, prev) : prev)),
                  },
                  {
                    key: 'restart',
                    label: '重来',
                    onPress: () =>
                      setState((prev) => (prev ? restartPuzzle(puzzle, prev) : prev)),
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
  progress: {
    color: wood.creamFaint,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
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
});
