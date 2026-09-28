import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Board } from '../../components/Board';
import { getManualById } from '../../data/manuals';
import { TABLE_WOOD } from '../../lib/pieceAssets';
import {
  commentedMoveIndex,
  enterVariation,
  exitVariation,
  getActiveVariation,
  goNext,
  goPrev,
  goToStep,
  initialPracticeState,
  restartPractice,
  selectSquare,
  showHint,
  switchMode,
  toProgress,
  variationsAt,
  type PracticeState,
  type StudyMode,
} from '../../lib/practiceMachine';
import { loadProgress, resolveFlipped, saveProgress } from '../../lib/progress';
import type { Square } from '../../lib/squares';

export default function ManualScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const manual = getManualById(id);
  const [state, setState] = useState<PracticeState | null>(null);
  const [flipped, setFlipped] = useState(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!manual) return;
    let alive = true;
    (async () => {
      const progress = await loadProgress(manual.id);
      if (!alive) return;
      setFlipped(resolveFlipped(manual, progress));
      setState(initialPracticeState(manual, progress, 'study'));
    })();
    return () => {
      alive = false;
    };
  }, [manual]);

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

  if (!manual) {
    return (
      <View style={[styles.fallback, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.error}>未找到棋谱：{id}</Text>
      </View>
    );
  }

  if (!state) {
    return (
      <View style={[styles.fallback, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.progressText}>加载中…</Text>
      </View>
    );
  }

  const isStudy = state.mode === 'study';
  const inVariation = Boolean(state.variation);
  const activeVariation = getActiveVariation(manual, state);
  const commentMove = commentedMoveIndex(state);
  const availableVariations =
    isStudy && !inVariation && commentMove != null ? variationsAt(manual, commentMove) : [];

  const total = inVariation
    ? (activeVariation?.moves.length ?? 0)
    : manual.moves.length;
  const currentStep = inVariation
    ? (state.variation?.stepIndex ?? 0)
    : state.stepIndex;
  const progressLabel = inVariation
    ? `变例 ${Math.min(currentStep, total)}/${total}`
    : `${Math.min(state.stepIndex, manual.moves.length)}/${manual.moves.length}`;

  // 固定槽：记谱显示「下一步」；背谱不剧透着法
  const cueLabel = (() => {
    if (state.status === 'complete') {
      if (inVariation) return '变例已看完';
      return isStudy ? '本谱已看完' : '本谱已背完';
    }
    if (isStudy) {
      if (inVariation && activeVariation) {
        const next = activeVariation.moves[state.variation!.stepIndex];
        return next ? `变例下一步  ${next.san}` : '';
      }
      const next = manual.moves[state.stepIndex];
      return next ? `下一步  ${next.san}` : '';
    }
    return '请走下一步';
  })();

  const lastSan = (() => {
    if (inVariation && activeVariation && state.variation) {
      if (state.variation.stepIndex <= 0) return null;
      return activeVariation.moves[state.variation.stepIndex - 1]?.san ?? null;
    }
    return state.stepIndex > 0 ? manual.moves[state.stepIndex - 1]?.san ?? null : null;
  })();

  const onSquarePress = (square: Square) => {
    if (isStudy) return;
    setState((prev) => (prev ? selectSquare(manual, prev, square) : prev));
  };

  const setMode = (mode: StudyMode) => {
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
      return restartPractice(manual, prev.wrongCounts);
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: manual.title,
          headerStyle: { backgroundColor: '#2C1A0E' },
          headerTintColor: '#F3E2C4',
          headerTitleStyle: { fontWeight: '600', fontSize: 16 },
          headerShadowVisible: false,
        }}
      />
      <ImageBackground source={TABLE_WOOD} style={styles.root} resizeMode="cover">
        <View style={styles.dim} />

        {/* 顶栏：模式 + 进度 + 重置 */}
        <View style={styles.topBar}>
          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeTab, isStudy && styles.modeTabActive]}
              onPress={() => setMode('study')}
            >
              <Text style={[styles.modeTabText, isStudy && styles.modeTabTextActive]}>
                记谱
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeTab, !isStudy && styles.modeTabActive]}
              onPress={() => setMode('practice')}
            >
              <Text style={[styles.modeTabText, !isStudy && styles.modeTabTextActive]}>
                背谱
              </Text>
            </Pressable>
          </View>
          <View style={styles.topRight}>
            <Text style={styles.progressText}>{progressLabel}</Text>
            <Pressable
              style={[styles.resetBtn, !canReset && styles.buttonDisabled]}
              disabled={!canReset}
              onPress={resetToStart}
              hitSlop={8}
            >
              <Text
                style={[styles.resetBtnText, !canReset && styles.buttonTextDisabled]}
              >
                重置
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 说明：固定高度；右上角变例 / 返回主变 */}
        <View style={styles.commentPanel}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentLabel}>{inVariation ? '变例' : '说明'}</Text>
            {inVariation ? (
              <Pressable
                onPress={() => setState((prev) => (prev ? exitVariation(manual, prev) : prev))}
                hitSlop={8}
              >
                <Text style={styles.variationLink}>返回主变</Text>
              </Pressable>
            ) : availableVariations.length > 0 ? (
              <View style={styles.variationHeaderLinks}>
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
                    <Text style={styles.variationLink}>
                      {availableVariations.length === 1 ? '变例' : `变例${index + 1}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
          <ScrollView
            style={styles.commentScroll}
            contentContainerStyle={styles.commentScrollContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {state.comment ? (
              <Text style={styles.commentBody}>{state.comment}</Text>
            ) : (
              <Text style={styles.commentEmpty}>
                {inVariation ? '本变例暂无说明' : '本步暂无说明'}
              </Text>
            )}
          </ScrollView>
        </View>

        {/* 棋盘 */}
        <View style={styles.boardStage}>
          <Board
            fen={state.fen}
            flipped={flipped}
            selected={isStudy ? null : state.selected}
            legalTargets={isStudy ? [] : state.legalTargets}
            hintFrom={isStudy ? null : state.hintFrom}
            hintTo={isStudy ? null : state.hintTo}
            lastMove={state.lastMove}
            onSquarePress={onSquarePress}
          />
        </View>

        {/* 着法提示槽 */}
        <View style={styles.cueSlot}>
          <Text style={styles.cueText} numberOfLines={1}>
            {cueLabel}
          </Text>
          {lastSan && state.status !== 'complete' ? (
            <Text style={styles.lastMoveText} numberOfLines={1}>
              刚走  {lastSan}
            </Text>
          ) : (
            <Text style={styles.lastMovePlaceholder}> </Text>
          )}
          <Text
            style={[styles.feedbackText, !state.feedback && styles.feedbackHidden]}
            numberOfLines={2}
          >
            {state.feedback ?? ' '}
          </Text>
        </View>

        {/* 操作按钮贴底 */}
        <View style={[styles.actions, { marginBottom: Math.max(insets.bottom, 10) }]}>
          {isStudy ? (
            <>
              <Pressable
                style={[styles.button, styles.buttonSecondary, !canPrev && styles.buttonDisabled]}
                disabled={!canPrev}
                onPress={() => {
                  setState((prev) => {
                    if (!prev) return prev;
                    if (prev.variation && prev.variation.stepIndex <= 0) {
                      return exitVariation(manual, prev);
                    }
                    return goPrev(manual, prev);
                  });
                }}
              >
                <Text
                  style={[
                    styles.buttonText,
                    styles.buttonTextSecondary,
                    !canPrev && styles.buttonTextDisabled,
                  ]}
                >
                  {inVariation && (state.variation?.stepIndex ?? 0) <= 0 ? '回主变' : '上一步'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonSecondary, flipped && styles.buttonActive]}
                onPress={() => setFlipped((v) => !v)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    styles.buttonTextSecondary,
                    flipped && styles.buttonTextActive,
                  ]}
                >
                  翻转
                </Text>
              </Pressable>
              <Pressable
                style={[styles.button, !canNext && styles.buttonDisabled]}
                disabled={!canNext}
                onPress={() => setState((prev) => (prev ? goNext(manual, prev) : prev))}
              >
                <Text style={[styles.buttonText, !canNext && styles.buttonTextDisabled]}>
                  下一步
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                style={styles.button}
                onPress={() => setState((prev) => (prev ? showHint(manual, prev) : prev))}
              >
                <Text style={styles.buttonText}>提示</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonSecondary, flipped && styles.buttonActive]}
                onPress={() => setFlipped((v) => !v)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    styles.buttonTextSecondary,
                    flipped && styles.buttonTextActive,
                  ]}
                >
                  翻转
                </Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonSecondary, !canReset && styles.buttonDisabled]}
                disabled={!canReset}
                onPress={resetToStart}
              >
                <Text
                  style={[
                    styles.buttonText,
                    styles.buttonTextSecondary,
                    !canReset && styles.buttonTextDisabled,
                  ]}
                >
                  重置
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ImageBackground>
    </>
  );
}

const COMMENT_LINES = 3;
const COMMENT_LINE_HEIGHT = 21;
const COMMENT_BODY_HEIGHT = COMMENT_LINES * COMMENT_LINE_HEIGHT;

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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    minHeight: 44,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  modeTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#D2A86A',
  },
  modeTabText: {
    color: 'rgba(243, 226, 196, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: '#2A180C',
  },
  progressText: {
    color: 'rgba(230, 205, 170, 0.55)',
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(210, 168, 106, 0.45)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  resetBtnText: {
    color: 'rgba(243, 226, 196, 0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  boardStage: {
    paddingHorizontal: 10,
  },
  cueSlot: {
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 4,
    minHeight: 58,
    justifyContent: 'center',
    gap: 2,
  },
  cueText: {
    color: 'rgba(230, 205, 170, 0.45)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  lastMoveText: {
    color: 'rgba(230, 205, 170, 0.32)',
    fontSize: 12,
  },
  lastMovePlaceholder: {
    fontSize: 12,
    opacity: 0,
  },
  feedbackText: {
    color: '#FFB74D',
    fontSize: 13,
    fontWeight: '600',
    minHeight: 18,
  },
  feedbackHidden: {
    opacity: 0,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#D2A86A',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(210, 168, 106, 0.7)',
  },
  buttonActive: {
    backgroundColor: 'rgba(210, 168, 106, 0.28)',
    borderColor: '#D2A86A',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#2A180C',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonTextSecondary: {
    color: '#F3E2C4',
  },
  buttonTextActive: {
    color: '#FFE082',
  },
  buttonTextDisabled: {
    color: 'rgba(243, 226, 196, 0.5)',
  },
  commentPanel: {
    marginHorizontal: 12,
    marginBottom: 6,
    height: 98,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(210, 168, 106, 0.22)',
    paddingHorizontal: 12,
    paddingTop: 8,
    overflow: 'hidden',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    height: 14,
  },
  commentLabel: {
    color: 'rgba(210, 168, 106, 0.55)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  variationLink: {
    color: '#D2A86A',
    fontSize: 12,
    fontWeight: '600',
  },
  variationHeaderLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentScroll: {
    height: COMMENT_BODY_HEIGHT,
  },
  commentScrollContent: {
    paddingBottom: 4,
    flexGrow: 1,
  },
  commentBody: {
    color: 'rgba(246, 231, 200, 0.88)',
    fontSize: 14,
    lineHeight: COMMENT_LINE_HEIGHT,
  },
  commentEmpty: {
    color: 'rgba(230, 205, 170, 0.28)',
    fontSize: 13,
    lineHeight: COMMENT_LINE_HEIGHT,
  },
  error: {
    color: '#FFCDD2',
    fontSize: 16,
  },
});
