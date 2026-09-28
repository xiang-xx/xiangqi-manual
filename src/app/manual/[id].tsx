import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Board } from '../../components/Board';
import { getManualById } from '../../data/manuals';
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
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.tags}>{manual.tags.join(' · ')}</Text>
        <Text style={styles.meta}>{currentSan}</Text>

        <Board
          fen={state.fen}
          selected={state.selected}
          legalTargets={state.legalTargets}
          hintFrom={state.hintFrom}
          hintTo={state.hintTo}
          lastMove={state.lastMove}
          onSquarePress={onSquarePress}
        />

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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 8,
  },
  error: {
    color: '#B42318',
    fontSize: 16,
  },
  tags: {
    color: '#5C6B5A',
    fontSize: 13,
  },
  meta: {
    color: '#1B4332',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  feedback: {
    color: '#B42318',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  commentBox: {
    backgroundColor: '#FFF8E7',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E4D4A8',
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
    backgroundColor: '#1B4332',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1B4332',
  },
  buttonText: {
    color: '#F7F3E8',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#1B4332',
  },
  sectionTitle: {
    color: '#1B4332',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  moveLine: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 24,
  },
  moveDone: {
    color: '#6B7280',
  },
  moveCurrent: {
    color: '#1B4332',
    fontWeight: '700',
  },
});
