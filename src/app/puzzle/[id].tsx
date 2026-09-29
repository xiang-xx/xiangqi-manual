import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Board } from '../../components/Board';
import { getPuzzleById, nextPuzzleId } from '../../data/puzzles';
import { TABLE_WOOD } from '../../lib/pieceAssets';
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

const OPPONENT_DELAY_MS = 500;

export default function PuzzleScreen() {
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

  // 对方应着：至少等 OPPONENT_DELAY_MS 再走，方便看清己方着法
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
        <Text style={styles.error}>未找到残棋：{id}</Text>
      </View>
    );
  }

  if (!state) {
    return (
      <View style={[styles.fallback, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.muted}>加载中…</Text>
      </View>
    );
  }

  const nextId = nextPuzzleId(puzzle.id);
  const progressLabel = `${Math.min(state.stepIndex, puzzle.solution.length)}/${puzzle.solution.length}`;

  return (
    <>
      <Stack.Screen
        options={{
          title: puzzle.title,
          headerStyle: { backgroundColor: '#2C1A0E' },
          headerTintColor: '#F3E2C4',
          headerTitleStyle: { fontWeight: '600', fontSize: 16 },
          headerShadowVisible: false,
        }}
      />
      <ImageBackground source={TABLE_WOOD} style={styles.root} resizeMode="cover">
        <View style={styles.dim} />

        <View style={styles.metaRow}>
          <Text style={styles.progressText}>{progressLabel}</Text>
          <Pressable onPress={() => setFlipped((f) => !f)} hitSlop={8} style={styles.flipBtn}>
            <Text style={styles.flipText}>翻转</Text>
          </Pressable>
        </View>

        {state.comment ? (
          <Text style={styles.comment} numberOfLines={2}>
            {state.comment}
          </Text>
        ) : (
          <Text style={styles.commentPlaceholder}> </Text>
        )}

        <View style={styles.boardStage}>
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
        </View>

        {state.feedback ? (
          <Text style={styles.feedbackText} numberOfLines={2}>
            {state.feedback}
          </Text>
        ) : (
          <View style={styles.feedbackSpacer} />
        )}

        <View style={[styles.actions, { marginBottom: Math.max(insets.bottom, 10) }]}>
          {state.status === 'complete' ? (
            <>
              <Pressable
                style={[styles.button, styles.buttonGhost]}
                onPress={() => setState((prev) => (prev ? restartPuzzle(puzzle, prev) : prev))}
              >
                <Text style={styles.buttonGhostText}>重来</Text>
              </Pressable>
              {nextId ? (
                <Pressable
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={() => router.replace(`/puzzle/${nextId}`)}
                >
                  <Text style={styles.buttonPrimaryText}>下一题</Text>
                </Pressable>
              ) : (
                <Link href="/(tabs)/puzzles" asChild>
                  <Pressable style={[styles.button, styles.buttonPrimary]}>
                    <Text style={styles.buttonPrimaryText}>回列表</Text>
                  </Pressable>
                </Link>
              )}
            </>
          ) : (
            <>
              <Pressable
                style={[styles.button, styles.buttonGhost]}
                onPress={() => setState((prev) => (prev ? showHint(puzzle, prev) : prev))}
              >
                <Text style={styles.buttonGhostText}>提示</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonGhost]}
                onPress={() => setState((prev) => (prev ? revealNext(puzzle, prev) : prev))}
              >
                <Text style={styles.buttonGhostText}>看答案</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonPrimary]}
                onPress={() => setState((prev) => (prev ? restartPuzzle(puzzle, prev) : prev))}
              >
                <Text style={styles.buttonPrimaryText}>重来</Text>
              </Pressable>
            </>
          )}
        </View>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#24140C',
  },
  dim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(20, 10, 4, 0.28)',
  },
  fallback: {
    flex: 1,
    backgroundColor: '#24140C',
    paddingHorizontal: 16,
  },
  error: {
    color: '#E8A0A0',
    fontSize: 16,
  },
  muted: {
    color: 'rgba(230, 205, 170, 0.7)',
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  progressText: {
    color: 'rgba(230, 205, 170, 0.55)',
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    flex: 1,
  },
  flipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(210, 168, 106, 0.45)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  flipText: {
    color: 'rgba(243, 226, 196, 0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  comment: {
    color: 'rgba(243, 226, 196, 0.82)',
    fontSize: 13,
    minHeight: 36,
    marginHorizontal: 12,
    marginBottom: 4,
  },
  commentPlaceholder: {
    minHeight: 36,
    marginBottom: 4,
  },
  boardStage: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    paddingHorizontal: 10,
  },
  feedbackText: {
    color: '#E8B4A0',
    fontSize: 13,
    textAlign: 'center',
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 4,
    minHeight: 20,
  },
  feedbackSpacer: {
    height: 30,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#D2A86A',
  },
  buttonPrimaryText: {
    color: '#2A180C',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonGhost: {
    borderWidth: 1,
    borderColor: 'rgba(210, 168, 106, 0.45)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  buttonGhostText: {
    color: 'rgba(243, 226, 196, 0.9)',
    fontSize: 15,
    fontWeight: '600',
  },
});
