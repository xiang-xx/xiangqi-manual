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
      <View style={styles.container}>
        <Text style={styles.error}>未找到棋谱：{id}</Text>
      </View>
    );
  }

  if (!state) {
    return (
      <View style={styles.container}>
        <Text style={styles.meta}>加载中…</Text>
      </View>
    );
  }

  const currentSan =
    state.status === 'complete'
      ? '已完成'
      : `第 ${state.stepIndex + 1} / ${manual.moves.length} 手 · 请走 ${manual.moves[state.stepIndex]?.san ?? ''}`;

  const onSquarePress = (square: Square) => {
    setState((prev) => (prev ? selectSquare(manual, prev, square) : prev));
  };

  return (
    <>
      <Stack.Screen options={{ title: manual.title }} />
      <ImageBackground source={TABLE_WOOD} style={styles.scroll} resizeMode="cover">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.tags}>{manual.tags.join(' · ')}</Text>
        <Text style={styles.meta}>{currentSan}</Text>

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
            <Text style={styles.commentLabel}>着法说明</Text>
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
              {index + 1}. {move.san}
              {done ? ' ✓' : ''}
            </Text>
          );
        })}
      </ScrollView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#3E2716',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 8,
  },
  boardStage: {
    borderRadius: 12,
    overflow: 'visible',
    marginVertical: 4,
  },
  error: {
    color: '#FFCDD2',
    fontSize: 16,
  },
  tags: {
    color: '#D7C4A8',
    fontSize: 13,
  },
  meta: {
    color: '#F5E6C8',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  feedback: {
    color: '#FFAB91',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  commentBox: {
    backgroundColor: 'rgba(245, 230, 200, 0.92)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C9A46E',
    marginTop: 4,
  },
  commentLabel: {
    color: '#8A6D3B',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  comment: {
    color: '#3D3D3D',
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#C9A46E',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C9A46E',
  },
  buttonText: {
    color: '#2A180C',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#F5E6C8',
  },
  sectionTitle: {
    color: '#F5E6C8',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  moveLine: {
    color: '#D7C4A8',
    fontSize: 15,
    lineHeight: 24,
  },
  moveDone: {
    color: '#9A8570',
  },
  moveCurrent: {
    color: '#FFE082',
    fontWeight: '700',
  },
});
