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
  initialPracticeState,
  restartPractice,
  selectSquare,
  showHint,
  toProgress,
  type PracticeState,
} from '../../lib/practiceMachine';
import { loadProgress, saveProgress } from '../../lib/progress';
import type { Square } from '../../lib/squares';

export default function ManualScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const manual = getManualById(id);
  const [state, setState] = useState<PracticeState | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!manual) return;
    let alive = true;
    (async () => {
      const progress = await loadProgress(manual.id);
      if (!alive) return;
      setState(initialPracticeState(manual, progress));
    })();
    return () => {
      alive = false;
    };
  }, [manual]);

  useEffect(() => {
    if (!manual || !state) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      void saveProgress(manual.id, toProgress(state));
    }, 200);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [manual, state]);

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
        <Text style={styles.meta}>加载中…</Text>
      </View>
    );
  }

  const currentSan =
    state.status === 'complete'
      ? '本谱已背完'
      : `请走 ${manual.moves[state.stepIndex]?.san ?? ''} · ${state.stepIndex + 1}/${manual.moves.length}`;

  const onSquarePress = (square: Square) => {
    setState((prev) => (prev ? selectSquare(manual, prev, square) : prev));
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
      <ImageBackground source={TABLE_WOOD} style={styles.scroll} resizeMode="cover">
        <View style={styles.dim} />
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Text style={styles.tags} numberOfLines={1}>
              {manual.tags.join(' · ')}
            </Text>
            <Text style={styles.meta}>{currentSan}</Text>
          </View>

          {/* 棋盘几乎通栏，左右仅留极窄边 */}
          <View style={styles.boardStage}>
            <Board
              fen={state.fen}
              selected={state.selected}
              legalTargets={state.legalTargets}
              hintFrom={state.hintFrom}
              hintTo={state.hintTo}
              lastMove={state.lastMove}
              onSquarePress={onSquarePress}
            />
          </View>

          {state.feedback ? <Text style={styles.feedback}>{state.feedback}</Text> : null}

          {state.comment ? (
            <View style={styles.commentBox}>
              <Text style={styles.commentLabel}>说明</Text>
              <Text style={styles.comment}>{state.comment}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              style={styles.button}
              onPress={() => setState((prev) => (prev ? showHint(manual, prev) : prev))}
            >
              <Text style={styles.buttonText}>提示</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonSecondary]}
              onPress={() =>
                setState((prev) => restartPractice(manual, prev?.wrongCounts))
              }
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>重来</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>着法</Text>
          <View style={styles.moveList}>
            {manual.moves.map((move, index) => {
              const done = index < state.stepIndex;
              const current = index === state.stepIndex && state.status === 'playing';
              return (
                <Text
                  key={`${move.uci}-${index}`}
                  style={[
                    styles.moveLine,
                    done && styles.moveDone,
                    current && styles.moveCurrent,
                  ]}
                >
                  {index + 1}.{move.san}
                  {done ? ' ✓' : ''}
                </Text>
              );
            })}
          </View>
        </ScrollView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
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
  container: {
    paddingBottom: 36,
  },
  topBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 4,
  },
  boardStage: {
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  error: {
    color: '#FFCDD2',
    fontSize: 16,
  },
  tags: {
    color: 'rgba(230, 205, 170, 0.72)',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  meta: {
    color: '#F6E7C8',
    fontSize: 15,
    fontWeight: '600',
  },
  feedback: {
    color: '#FFB74D',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 14,
    marginBottom: 6,
  },
  commentBox: {
    marginHorizontal: 12,
    backgroundColor: 'rgba(250, 236, 208, 0.94)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  commentLabel: {
    color: '#8A6230',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 1,
  },
  comment: {
    color: '#3A2A18',
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 12,
    marginBottom: 14,
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
  buttonText: {
    color: '#2A180C',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonTextSecondary: {
    color: '#F3E2C4',
  },
  sectionTitle: {
    color: 'rgba(246, 231, 200, 0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 14,
    marginBottom: 8,
    letterSpacing: 1,
  },
  moveList: {
    marginHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moveLine: {
    color: 'rgba(230, 205, 170, 0.88)',
    fontSize: 14,
    lineHeight: 22,
    minWidth: '30%',
  },
  moveDone: {
    color: 'rgba(170, 150, 120, 0.7)',
  },
  moveCurrent: {
    color: '#FFE082',
    fontWeight: '700',
  },
});
