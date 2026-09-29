import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AI_DIFFICULTIES, isPikafishAvailable, type AiDifficulty } from '../../lib/pikafish';
import type { PlaySide } from '../../lib/playMachine';
import {
  createPlayGame,
  deletePlayGame,
  formatPlayUpdatedAt,
  listPlayGames,
  playGameSummary,
  type PlayGameRecord,
} from '../../lib/playProgress';
import { ink } from '../../lib/theme';

function unavailableHint(): string {
  if (Platform.OS !== 'android') return '当前仅 Android 支持引擎对弈。';
  if (Constants.executionEnvironment === 'storeClient') {
    return '请打开桌面「象棋背谱」开发客户端，勿用 Expo Go。';
  }
  return '引擎未加载，请重新安装开发构建。';
}

export default function PlaySetupScreen() {
  const router = useRouter();
  const available = useMemo(() => isPikafishAvailable(), []);
  const [side, setSide] = useState<PlaySide>('red');
  const [difficulty, setDifficulty] = useState<AiDifficulty>('中级');
  const [games, setGames] = useState<PlayGameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const refresh = useCallback(async () => {
    setGames(await listPlayGames());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const list = await listPlayGames();
        if (!alive) return;
        setGames(list);
        setLoading(false);
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const unfinished = useMemo(() => games.filter((g) => g.status === 'playing'), [games]);
  const finished = useMemo(() => games.filter((g) => g.status !== 'playing'), [games]);

  const start = async () => {
    if (!available || starting) return;
    setStarting(true);
    try {
      const record = await createPlayGame({ humanSide: side, difficulty });
      router.push({ pathname: '/play/game', params: { id: record.id } });
    } finally {
      setStarting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {!available ? <Text style={styles.warn}>{unavailableHint()}</Text> : null}

      <Text style={styles.kicker}>执棋</Text>
      <View style={styles.optionRow}>
        {(['red', 'black'] as PlaySide[]).map((s) => (
          <Pressable key={s} onPress={() => setSide(s)} hitSlop={8} style={styles.optionHit}>
            <Text style={[styles.option, side === s && styles.optionOn]}>
              {s === 'red' ? '红先' : '黑后'}
            </Text>
            {side === s ? <View style={styles.optionRule} /> : <View style={styles.optionRuleSpacer} />}
          </Pressable>
        ))}
      </View>

      <Text style={[styles.kicker, { marginTop: 28 }]}>难度</Text>
      <View style={styles.diffRow}>
        {AI_DIFFICULTIES.map((d) => (
          <Pressable key={d} onPress={() => setDifficulty(d)} hitSlop={6} style={styles.optionHit}>
            <Text style={[styles.option, difficulty === d && styles.optionOn]}>{d}</Text>
            {difficulty === d ? (
              <View style={styles.optionRule} />
            ) : (
              <View style={styles.optionRuleSpacer} />
            )}
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => void start()}
        disabled={!available || starting}
        style={[styles.startHit, (!available || starting) && styles.startDisabled]}
      >
        <Text style={styles.startText}>{starting ? '开局中' : '新对局'}</Text>
        <View style={styles.startRule} />
      </Pressable>

      {loading ? (
        <ActivityIndicator color={ink.deep} style={{ marginTop: 36 }} />
      ) : (
        <>
          {unfinished.length > 0 ? (
            <HistoryBlock
              label="未完"
              games={unfinished}
              onOpen={(id) => router.push({ pathname: '/play/game', params: { id } })}
              onDelete={async (id) => {
                await deletePlayGame(id);
                await refresh();
              }}
            />
          ) : null}
          {finished.length > 0 ? (
            <HistoryBlock
              label="近局"
              games={finished}
              onOpen={(id) => router.push({ pathname: '/play/game', params: { id } })}
              onDelete={async (id) => {
                await deletePlayGame(id);
                await refresh();
              }}
            />
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function HistoryBlock({
  label,
  games,
  onOpen,
  onDelete,
}: {
  label: string;
  games: PlayGameRecord[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={styles.listBlock}>
      <View style={styles.countRow}>
        <View style={styles.rule} />
        <Text style={styles.listLabel}>{label}</Text>
        <View style={styles.rule} />
      </View>
      {games.map((g) => (
        <View key={g.id} style={styles.row}>
          <Pressable onPress={() => onOpen(g.id)} style={styles.rowMain}>
            <Text style={styles.rowTitle}>{playGameSummary(g)}</Text>
            <Text style={styles.rowMeta}>{formatPlayUpdatedAt(g.updatedAt)}</Text>
          </Pressable>
          <Pressable onPress={() => void onDelete(g.id)} hitSlop={10} style={styles.deleteHit}>
            <Text style={styles.deleteText}>删</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ink.wash,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 48,
  },
  warn: {
    color: '#8A5A2B',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  kicker: {
    color: ink.faint,
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 28,
  },
  diffRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  optionHit: {
    alignItems: 'flex-start',
  },
  option: {
    color: ink.soft,
    fontSize: 16,
    fontWeight: '400',
  },
  optionOn: {
    color: ink.deep,
    fontWeight: '600',
  },
  optionRule: {
    marginTop: 6,
    height: 1.5,
    width: '100%',
    backgroundColor: ink.deep,
  },
  optionRuleSpacer: {
    marginTop: 6,
    height: 1.5,
  },
  startHit: {
    marginTop: 36,
    alignSelf: 'flex-start',
  },
  startDisabled: {
    opacity: 0.35,
  },
  startText: {
    color: ink.deep,
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 6,
  },
  startRule: {
    marginTop: 8,
    height: 1,
    width: 48,
    backgroundColor: ink.deep,
  },
  listBlock: {
    marginTop: 40,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: ink.rule,
  },
  listLabel: {
    color: ink.faint,
    fontSize: 11,
    letterSpacing: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ink.rule,
  },
  rowMain: {
    flex: 1,
  },
  rowTitle: {
    color: ink.deep,
    fontSize: 15,
    fontWeight: '500',
  },
  rowMeta: {
    marginTop: 4,
    color: ink.faint,
    fontSize: 12,
  },
  deleteHit: {
    paddingLeft: 14,
    paddingVertical: 4,
  },
  deleteText: {
    color: ink.faint,
    fontSize: 12,
  },
});
