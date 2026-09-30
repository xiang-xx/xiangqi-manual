import { useKeepAwake } from 'expo-keep-awake';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Board } from '../../components/Board';
import { BoardScreenLayout } from '../../components/BoardScreenLayout';
import { getManualById } from '../../data/manuals';
import {
  commentedMoveIndex,
  enterVariation,
  exitVariation,
  getActiveVariation,
  goNext,
  goPrev,
  goToStep,
  initialPracticeState,
  isUserPracticeTurn,
  playOpponentPly,
  restartPractice,
  selectSquare,
  setPracticeSide,
  showHint,
  switchMode,
  toProgress,
  variationsAt,
  type PracticeState,
  type StudyMode,
} from '../../lib/practiceMachine';
import { loadProgress, flippedForPracticeSide, resolveFlipped, saveProgress } from '../../lib/progress';
import { playSfxIfMoved } from '../../lib/sfx';
import type { Square } from '../../lib/squares';
import { wood } from '../../lib/theme';
import type { ManualProgress, SideToMemorize } from '../../types/manual';

const PRACTICE_SIDES: { id: SideToMemorize; label: string }[] = [
  { id: 'both', label: '双方' },
  { id: 'red', label: '红' },
  { id: 'black', label: '黑' },
];

const OPPONENT_DELAY_MS = 500;

export default function ManualScreen() {
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });
  const params = useLocalSearchParams<{ id: string; entrySide?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const entrySideRaw = Array.isArray(params.entrySide) ? params.entrySide[0] : params.entrySide;
  const manual = getManualById(id);
  const entrySide: 'red' | 'black' | null =
    entrySideRaw === 'red' ? 'red' : entrySideRaw === 'black' ? 'black' : null;
  const [state, setState] = useState<PracticeState | null>(null);
  const [flipped, setFlipped] = useState(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opponentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!manual) return;
    let alive = true;
    (async () => {
      const progress = await loadProgress(manual.id);
      if (!alive) return;
      const seeded: ManualProgress | null = entrySide
        ? {
            maxReached: progress?.maxReached ?? 0,
            wrongCounts: progress?.wrongCounts ?? {},
            lastStudiedAt: progress?.lastStudiedAt,
            practiceSide: entrySide,
            flipped: entrySide === 'black',
          }
        : progress;
      setFlipped(resolveFlipped(manual, seeded));
      setState(initialPracticeState(manual, seeded, 'study'));
    })();
    return () => {
      alive = false;
    };
  }, [manual, entrySide]);

  useEffect(() => {
    if (!manual || !state) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      void saveProgress(manual.id, toProgress(state, flipped));
    }, 200);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [manual, state, flipped]);

  useEffect(() => {
    if (!manual || !state) return;
    if (state.mode !== 'practice' || state.status !== 'playing') return;
    if (isUserPracticeTurn(state)) return;

    if (opponentTimer.current) clearTimeout(opponentTimer.current);
    opponentTimer.current = setTimeout(() => {
      setState((prev) => {
        if (!prev) return prev;
        const next = playOpponentPly(manual, prev);
        playSfxIfMoved(prev.fen, next.fen, next.lastMove);
        return next;
      });
    }, OPPONENT_DELAY_MS);

    return () => {
      if (opponentTimer.current) clearTimeout(opponentTimer.current);
    };
  }, [manual, state?.mode, state?.practiceSide, state?.status, state?.stepIndex]);

  if (!manual) {
    return (
      <View style={[styles.fallback, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.error}>未找到棋谱</Text>
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

  const isStudy = state.mode === 'study';
  const inVariation = Boolean(state.variation);
  const activeVariation = getActiveVariation(manual, state);
  const commentMove = commentedMoveIndex(state);
  const availableVariations =
    isStudy && !inVariation && commentMove != null ? variationsAt(manual, commentMove) : [];

  const total = inVariation ? (activeVariation?.moves.length ?? 0) : manual.moves.length;
  const currentStep = inVariation ? (state.variation?.stepIndex ?? 0) : state.stepIndex;
  const progressLabel = inVariation
    ? `变 ${Math.min(currentStep, total)}/${total}`
    : `${Math.min(state.stepIndex, manual.moves.length)}/${manual.moves.length}`;

  const nextSan = (() => {
    if (!isStudy || state.status === 'complete') return null;
    if (inVariation && activeVariation) {
      return activeVariation.moves[state.variation!.stepIndex]?.san ?? null;
    }
    return manual.moves[state.stepIndex]?.san ?? null;
  })();

  const setMode = (mode: StudyMode) => {
    if (mode === 'practice') {
      const nextFlip = flippedForPracticeSide(state.practiceSide);
      if (nextFlip != null) setFlipped(nextFlip);
    }
    setState((prev) => (prev ? switchMode(manual, prev, mode) : prev));
  };

  const canPrev = isStudy && (inVariation || state.stepIndex > 0);
  const canNext = isStudy && currentStep < total;
  const canReset = inVariation || state.stepIndex > 0 || state.status === 'complete';

  const resetToStart = () => {
    setState((prev) => {
      if (!prev) return prev;
      if (prev.variation) return exitVariation(manual, prev);
      if (prev.mode === 'study') return goToStep(manual, prev, 0);
      return restartPractice(manual, {
        wrongCounts: prev.wrongCounts,
        practiceSide: prev.practiceSide,
        maxReached: prev.maxReached,
      });
    });
  };

  const onPracticeSide = (side: SideToMemorize) => {
    const nextFlip = flippedForPracticeSide(side);
    if (nextFlip != null) setFlipped(nextFlip);
    setState((prev) => (prev ? setPracticeSide(manual, prev, side) : prev));
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: manual.title,
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
              <View style={styles.topLeft}>
                <View style={styles.modeRow}>
                  {(['study', 'practice'] as StudyMode[]).map((m) => {
                    const on = state.mode === m;
                    return (
                      <Pressable key={m} onPress={() => setMode(m)} hitSlop={8} style={styles.modeHit}>
                        <Text style={[styles.modeText, on && styles.modeTextOn]}>
                          {m === 'study' ? '记谱' : '背谱'}
                        </Text>
                        {on ? <View style={styles.modeRule} /> : <View style={styles.modeRuleSpacer} />}
                      </Pressable>
                    );
                  })}
                </View>
                {!isStudy ? (
                  <View style={styles.sideRow}>
                    {PRACTICE_SIDES.map((s) => {
                      const on = state.practiceSide === s.id;
                      return (
                        <Pressable key={s.id} onPress={() => onPracticeSide(s.id)} hitSlop={6}>
                          <Text style={[styles.sideText, on && styles.sideTextOn]}>{s.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
              <Text style={styles.progress}>{progressLabel}</Text>
            </View>
          }
          overlay={
            <View style={styles.noteBlock}>
              <View style={styles.noteHeader}>
                {availableVariations.length > 0 ? (
                  <View style={styles.varLinks}>
                    {availableVariations.map((v, index) => (
                      <Pressable
                        key={v.id}
                        onPress={() =>
                          setState((prev) =>
                            prev && commentMove != null
                              ? enterVariation(manual, prev, commentMove, v.id)
                              : prev,
                          )
                        }
                        hitSlop={8}
                      >
                        <Text style={styles.varLink}>
                          {availableVariations.length === 1 ? '变例' : `变例${index + 1}`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : inVariation ? (
                  <Pressable
                    onPress={() => setState((prev) => (prev ? exitVariation(manual, prev) : prev))}
                    hitSlop={8}
                  >
                    <Text style={styles.varLink}>回主变</Text>
                  </Pressable>
                ) : (
                  <View />
                )}
                {isStudy && nextSan ? <Text style={styles.nextSan}>{nextSan}</Text> : null}
              </View>
              {state.comment ? (
                <ScrollView
                  style={styles.commentScroll}
                  showsVerticalScrollIndicator
                  nestedScrollEnabled
                >
                  <Text style={styles.comment}>{state.comment}</Text>
                </ScrollView>
              ) : null}
              {state.feedback ? (
                <Text style={styles.feedback} numberOfLines={1}>
                  {state.feedback}
                </Text>
              ) : null}
            </View>
          }
          board={
            <Board
              fen={state.fen}
              flipped={flipped}
              selected={isStudy ? null : state.selected}
              legalTargets={isStudy ? [] : state.legalTargets}
              hintFrom={isStudy ? null : state.hintFrom}
              hintTo={isStudy ? null : state.hintTo}
              lastMove={state.lastMove}
              onSquarePress={(sq: Square) => {
                if (isStudy) return;
                setState((prev) => {
                  if (!prev) return prev;
                  const next = selectSquare(manual, prev, sq);
                  playSfxIfMoved(prev.fen, next.fen, next.lastMove);
                  return next;
                });
              }}
            />
          }
          actions={
            isStudy
              ? [
                  {
                    key: 'prev',
                    label:
                      inVariation && (state.variation?.stepIndex ?? 0) <= 0 ? '回主变' : '上一步',
                    disabled: !canPrev,
                    onPress: () => {
                      setState((prev) => {
                        if (!prev) return prev;
                        if (prev.variation && prev.variation.stepIndex <= 0) {
                          return exitVariation(manual, prev);
                        }
                        return goPrev(manual, prev);
                      });
                    },
                  },
                  {
                    key: 'flip',
                    label: '翻转',
                    onPress: () => setFlipped((v) => !v),
                  },
                  {
                    key: 'next',
                    label: '下一步',
                    primary: true,
                    disabled: !canNext,
                    onPress: () =>
                      setState((prev) => {
                        if (!prev) return prev;
                        const next = goNext(manual, prev);
                        playSfxIfMoved(prev.fen, next.fen, next.lastMove);
                        return next;
                      }),
                  },
                ]
              : [
                  {
                    key: 'hint',
                    label: '提示',
                    onPress: () => setState((prev) => (prev ? showHint(manual, prev) : prev)),
                  },
                  {
                    key: 'flip',
                    label: '翻转',
                    onPress: () => setFlipped((v) => !v),
                  },
                  {
                    key: 'reset',
                    label: '重置',
                    disabled: !canReset,
                    onPress: resetToStart,
                  },
                ]
          }
        />
      </View>
    </>
  );
}

const COMMENT_LINES = 3;
const COMMENT_LINE_HEIGHT = 22;
const COMMENT_BODY_HEIGHT = COMMENT_LINES * COMMENT_LINE_HEIGHT;

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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  topLeft: {
    flexShrink: 1,
    gap: 8,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 20,
  },
  modeHit: {
    alignItems: 'flex-start',
  },
  modeText: {
    color: wood.creamFaint,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 2,
  },
  modeTextOn: {
    color: wood.cream,
    fontWeight: '600',
  },
  modeRule: {
    marginTop: 5,
    height: 1.5,
    width: '100%',
    backgroundColor: wood.gold,
  },
  modeRuleSpacer: {
    marginTop: 5,
    height: 1.5,
  },
  sideRow: {
    flexDirection: 'row',
    gap: 14,
  },
  sideText: {
    color: wood.creamFaint,
    fontSize: 12,
    letterSpacing: 1,
  },
  sideTextOn: {
    color: wood.gold,
    fontWeight: '600',
  },
  progress: {
    color: wood.creamFaint,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
    paddingBottom: 2,
  },
  noteBlock: {
    // 叠在棋盘上方空白区，不改变棋盘垂直位置
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 22,
    marginBottom: 6,
  },
  varLinks: {
    flexDirection: 'row',
    gap: 14,
  },
  varLink: {
    color: wood.gold,
    fontSize: 12,
    letterSpacing: 1,
  },
  nextSan: {
    color: wood.creamSoft,
    fontSize: 13,
    letterSpacing: 1,
  },
  commentScroll: {
    height: COMMENT_BODY_HEIGHT,
  },
  comment: {
    color: wood.cream,
    fontSize: 14,
    lineHeight: COMMENT_LINE_HEIGHT,
    opacity: 0.9,
  },
  feedback: {
    marginTop: 6,
    color: wood.gold,
    fontSize: 12,
  },
});
