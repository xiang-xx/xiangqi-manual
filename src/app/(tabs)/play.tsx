import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AI_DIFFICULTIES,
  difficultyLabel,
  isPikafishAvailable,
  type AiDifficulty,
} from '../../lib/pikafish';
import type { PlaySide } from '../../lib/playMachine';

export default function PlaySetupScreen() {
  const router = useRouter();
  const available = useMemo(() => isPikafishAvailable(), []);
  const [side, setSide] = useState<PlaySide>('red');
  const [difficulty, setDifficulty] = useState<AiDifficulty>('中级');

  const start = () => {
    router.push({
      pathname: '/play/game',
      params: { side, difficulty },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>对弈</Text>
      <Text style={styles.subtitle}>离线 · Pikafish 引擎</Text>

      {!available ? (
        <View style={styles.warnBox}>
          <Text style={styles.warnTitle}>需要 Android 开发构建</Text>
          <Text style={styles.warnBody}>
            {Platform.OS === 'android'
              ? 'Expo Go 不含引擎模块。请用 npx expo run:android 安装开发构建后再对弈。'
              : '当前仅 Android 支持引擎对弈。'}
          </Text>
        </View>
      ) : null}

      <Text style={styles.section}>执棋</Text>
      <View style={styles.row}>
        {(['red', 'black'] as PlaySide[]).map((s) => (
          <Pressable
            key={s}
            onPress={() => setSide(s)}
            style={[styles.chip, side === s && styles.chipOn]}
          >
            <Text style={[styles.chipText, side === s && styles.chipTextOn]}>
              {s === 'red' ? '执红先手' : '执黑后手'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>难度</Text>
      <View style={styles.diffWrap}>
        {AI_DIFFICULTIES.map((d) => (
          <Pressable
            key={d}
            onPress={() => setDifficulty(d)}
            style={[styles.diffChip, difficulty === d && styles.chipOn]}
          >
            <Text style={[styles.chipText, difficulty === d && styles.chipTextOn]}>
              {difficultyLabel(d)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={start}
        disabled={!available}
        style={[styles.startBtn, !available && styles.startBtnDisabled]}
      >
        <Text style={styles.startText}>开始对局</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B4332',
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7A68',
  },
  warnBox: {
    marginTop: 20,
    padding: 14,
    backgroundColor: '#EFE6D6',
    borderRadius: 10,
  },
  warnTitle: {
    fontWeight: '700',
    color: '#7A3E12',
    marginBottom: 4,
  },
  warnBody: {
    color: '#5C4A38',
    lineHeight: 20,
    fontSize: 13,
  },
  section: {
    marginTop: 28,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#1B4332',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#E8E1D2',
  },
  diffWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  diffChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#E8E1D2',
  },
  chipOn: {
    backgroundColor: '#1B4332',
  },
  chipText: {
    color: '#3D4F3C',
    fontWeight: '600',
    fontSize: 14,
  },
  chipTextOn: {
    color: '#F7F3E8',
  },
  startBtn: {
    marginTop: 36,
    backgroundColor: '#1B4332',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  startBtnDisabled: {
    opacity: 0.4,
  },
  startText: {
    color: '#F7F3E8',
    fontSize: 16,
    fontWeight: '700',
  },
});
