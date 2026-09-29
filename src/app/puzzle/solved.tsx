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
      <Stack.Screen options={{ title: '已解残棋' }} />
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator color="#1B4332" style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={solved}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <Text style={styles.subtitle}>共 {solved.length} 题</Text>
            }
            ListEmptyComponent={<Text style={styles.empty}>还没有解过的残棋</Text>}
            renderItem={({ item }) => {
              const progress = progressMap[item.id];
              return (
                <Link href={`/puzzle/${item.id}`} asChild>
                  <Pressable style={styles.card}>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.badge}>已解</Text>
                    </View>
                    <Text style={styles.cardMeta}>{puzzleMetaLine(item)}</Text>
                    <Text style={styles.cardProgress}>
                      {progress?.attempts
                        ? `尝试 ${progress.attempts} 次`
                        : '已解'}
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
    paddingHorizontal: 16,
  },
  subtitle: {
    color: '#5C6B5A',
    fontSize: 14,
    marginBottom: 12,
    paddingTop: 8,
  },
  list: {
    gap: 10,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E4DDCF',
    opacity: 0.85,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    color: '#1B4332',
    fontSize: 17,
    fontWeight: '600',
  },
  badge: {
    color: '#2D6A4F',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: '#E8F0E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  cardMeta: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 4,
  },
  cardProgress: {
    color: '#2D6A4F',
    fontSize: 12,
    fontWeight: '500',
  },
  empty: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  },
});
