import { Link, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { puzzleMetaLine, puzzles } from '../../data/puzzles';
import { listAllPuzzleProgress } from '../../lib/puzzleProgress';
import { ink } from '../../lib/theme';
import type { PuzzleProgress } from '../../types/puzzle';

export default function SolvedPuzzlesScreen() {
  const [progressMap, setProgressMap] = useState<Record<string, PuzzleProgress>>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const all = await listAllPuzzleProgress();
        if (!alive) return;
        setProgressMap(all);
        setLoading(false);
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const solved = useMemo(
    () => puzzles.filter((p) => progressMap[p.id]?.solved),
    [progressMap],
  );

  return (
    <>
      <Stack.Screen options={{ title: '已解' }} />
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator color={ink.deep} style={{ marginTop: 28 }} />
        ) : (
          <FlatList
            data={solved}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={styles.countRow}>
                <View style={styles.rule} />
                <Text style={styles.count}>{solved.length} 题</Text>
                <View style={styles.rule} />
              </View>
            }
            ListEmptyComponent={<Text style={styles.empty}>暂无</Text>}
            renderItem={({ item }) => {
              const progress = progressMap[item.id];
              return (
                <Link href={`/puzzle/${item.id}`} asChild>
                  <Pressable style={styles.row}>
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {puzzleMetaLine(item)}
                      {progress?.attempts ? `  ·  ${progress.attempts} 次` : ''}
                    </Text>
                  </Pressable>
                </Link>
              );
            }}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ink.wash,
    paddingHorizontal: 22,
  },
  list: {
    paddingBottom: 40,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    marginBottom: 6,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: ink.rule,
  },
  count: {
    color: ink.faint,
    fontSize: 11,
    letterSpacing: 2,
  },
  row: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ink.rule,
  },
  rowTitle: {
    color: ink.deep,
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 24,
  },
  rowMeta: {
    marginTop: 6,
    color: ink.soft,
    fontSize: 12,
  },
  empty: {
    color: ink.faint,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});
