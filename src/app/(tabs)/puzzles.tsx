import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TagFilter } from '../../components/TagFilter';
import {
  allPuzzleTags,
  filterPuzzles,
  puzzleMetaLine,
  puzzles,
  puzzleTagFacetCounts,
} from '../../data/puzzles';
import { listAllPuzzleProgress } from '../../lib/puzzleProgress';
import type { PuzzleProgress } from '../../types/puzzle';

export default function PuzzlesScreen() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
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

  const tags = useMemo(() => allPuzzleTags(), []);
  const activeFilter = useMemo(() => ({ tags: selectedTags }), [selectedTags]);
  const filtered = useMemo(() => filterPuzzles(activeFilter), [activeFilter]);
  const tagCounts = useMemo(() => puzzleTagFacetCounts(activeFilter), [activeFilter]);
  const solvedCount = useMemo(
    () => puzzles.filter((p) => progressMap[p.id]?.solved).length,
    [progressMap],
  );

  const unsolved = useMemo(() => {
    return filtered.filter((p) => !progressMap[p.id]?.solved);
  }, [filtered, progressMap]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color="#1B4332" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={unsolved}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.subtitleRow}>
                <Text style={styles.subtitle}>
                  只走解题方 · 对方按主变自动
                </Text>
                {solvedCount > 0 ? (
                  <Link href="/puzzle/solved" asChild>
                    <Pressable hitSlop={8} style={styles.solvedEntry}>
                      <Text style={styles.solvedEntryText}>已解 {solvedCount}</Text>
                    </Pressable>
                  </Link>
                ) : null}
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>分类</Text>
                <TagFilter
                  tags={tags}
                  counts={tagCounts}
                  selected={selectedTags}
                  onToggle={toggleTag}
                />
                {selectedTags.length > 0 && (
                  <Pressable onPress={() => setSelectedTags([])} style={styles.clearTags}>
                    <Text style={styles.clearTagsText}>清除筛选</Text>
                  </Pressable>
                )}
              </View>
              <Text style={styles.sectionTitle}>
                残棋列表（{unsolved.length}）
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {filtered.length === 0
                ? '没有符合条件的残棋'
                : '未解题已全部完成'}
            </Text>
          }
          renderItem={({ item }) => {
            const progress = progressMap[item.id];
            return (
              <Link href={`/puzzle/${item.id}`} asChild>
                <Pressable style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.cardMeta}>{puzzleMetaLine(item)}</Text>
                  <Text style={styles.cardProgress}>{progressLabel(progress)}</Text>
                </Pressable>
              </Link>
            );
          }}
        />
      )}
    </View>
  );
}

function progressLabel(progress: PuzzleProgress | undefined): string {
  if (!progress) return '未开始';
  if (progress.attempts > 0 || progress.fails > 0) {
    return `未解 · 失败 ${progress.fails} 次`;
  }
  return '未开始';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 8,
    gap: 4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  subtitle: {
    flex: 1,
    color: '#5C6B5A',
    fontSize: 14,
  },
  solvedEntry: {
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  solvedEntryText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#1B4332',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  clearTags: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  clearTagsText: {
    color: '#2D6A4F',
    fontSize: 13,
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
