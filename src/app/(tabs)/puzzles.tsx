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
import { ink } from '../../lib/theme';
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
  const unsolved = useMemo(
    () => filtered.filter((p) => !progressMap[p.id]?.solved),
    [filtered, progressMap],
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color={ink.deep} style={{ marginTop: 28 }} />
      ) : (
        <FlatList
          data={unsolved}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.topRow}>
                <Text style={styles.kicker}>未解</Text>
                {solvedCount > 0 ? (
                  <Link href="/puzzle/solved" asChild>
                    <Pressable hitSlop={8}>
                      <Text style={styles.solvedLink}>已解 {solvedCount}</Text>
                    </Pressable>
                  </Link>
                ) : null}
              </View>

              <View style={styles.section}>
                <TagFilter
                  tags={tags}
                  counts={tagCounts}
                  selected={selectedTags}
                  onToggle={(tag) =>
                    setSelectedTags((prev) =>
                      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                    )
                  }
                />
                {selectedTags.length > 0 ? (
                  <Pressable onPress={() => setSelectedTags([])} hitSlop={8} style={styles.clear}>
                    <Text style={styles.clearText}>清除筛选</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.countRow}>
                <View style={styles.rule} />
                <Text style={styles.count}>{unsolved.length} 题</Text>
                <View style={styles.rule} />
              </View>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {filtered.length === 0 ? '无匹配残棋' : '已全部解完'}
            </Text>
          }
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
                    {progress && (progress.attempts > 0 || progress.fails > 0) ? (
                      <Text style={styles.rowProgress}>{`  失败 ${progress.fails}`}</Text>
                    ) : null}
                  </Text>
                </Pressable>
              </Link>
            );
          }}
        />
      )}
    </View>
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
  header: {
    paddingTop: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  kicker: {
    color: ink.faint,
    fontSize: 11,
    letterSpacing: 3,
  },
  solvedLink: {
    color: ink.faint,
    fontSize: 13,
  },
  section: {
    marginBottom: 18,
  },
  clear: {
    alignSelf: 'flex-start',
    marginTop: 6,
    marginLeft: 8,
  },
  clearText: {
    color: ink.faint,
    fontSize: 13,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  rowProgress: {
    color: ink.faint,
  },
  empty: {
    color: ink.faint,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});
