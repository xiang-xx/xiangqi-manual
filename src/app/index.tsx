import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TagFilter } from '../components/TagFilter';
import {
  allOpenings,
  allTags,
  filterManuals,
  getManualById,
  manualMetaLine,
  manuals,
  openingFacetCounts,
  tagFacetCounts,
} from '../data/manuals';
import { listAllProgress, listRecentManualIds } from '../lib/progress';
import type { Manual, ManualProgress } from '../types/manual';

export default function HomeScreen() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [redOpening, setRedOpening] = useState<string | null>(null);
  const [blackOpening, setBlackOpening] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, ManualProgress>>({});
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [all, recent] = await Promise.all([listAllProgress(), listRecentManualIds(5)]);
        if (!alive) return;
        setProgressMap(all);
        setRecentIds(recent);
        setLoading(false);
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  const tags = useMemo(() => allTags(), []);
  const redOptions = useMemo(() => allOpenings('red'), []);
  const blackOptions = useMemo(() => allOpenings('black'), []);

  const activeFilter = useMemo(
    () => ({ tags: selectedTags, redOpening, blackOpening }),
    [selectedTags, redOpening, blackOpening],
  );
  const filtered = useMemo(() => filterManuals(activeFilter), [activeFilter]);
  const tagCounts = useMemo(() => tagFacetCounts(activeFilter), [activeFilter]);
  const redCounts = useMemo(
    () => openingFacetCounts('red', activeFilter),
    [activeFilter],
  );
  const blackCounts = useMemo(
    () => openingFacetCounts('black', activeFilter),
    [activeFilter],
  );
  const recentManuals = useMemo(
    () =>
      recentIds
        .map((id) => getManualById(id))
        .filter((m): m is Manual => m != null)
        .slice(0, 5),
    [recentIds],
  );

  const hasFilter = selectedTags.length > 0 || redOpening != null || blackOpening != null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const toggleRed = (name: string) => {
    setRedOpening((prev) => (prev === name ? null : name));
  };

  const toggleBlack = (name: string) => {
    setBlackOpening((prev) => (prev === name ? null : name));
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setRedOpening(null);
    setBlackOpening(null);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color="#1B4332" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.subtitle}>本地棋谱 · 离线背谱</Text>

              {recentManuals.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>最近背谱</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recentRow}
                  >
                    {recentManuals.map((item) => (
                      <Link key={item.id} href={`/manual/${item.id}`} asChild>
                        <Pressable style={styles.recentCard}>
                          <Text style={styles.recentTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <Text style={styles.recentMeta} numberOfLines={1}>
                            {progressLabel(progressMap[item.id], item)}
                          </Text>
                        </Pressable>
                      </Link>
                    ))}
                  </ScrollView>
                </View>
              )}

              {(redOptions.length > 0 || blackOptions.length > 0) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>开局</Text>
                  {redOptions.length > 0 && (
                    <View style={styles.openingBlock}>
                      <Text style={styles.openingSide}>先手</Text>
                      <TagFilter
                        tags={redOptions}
                        counts={redCounts}
                        selected={redOpening ? [redOpening] : []}
                        onToggle={toggleRed}
                      />
                    </View>
                  )}
                  {blackOptions.length > 0 && (
                    <View style={styles.openingBlock}>
                      <Text style={styles.openingSide}>后手</Text>
                      <TagFilter
                        tags={blackOptions}
                        counts={blackCounts}
                        selected={blackOpening ? [blackOpening] : []}
                        onToggle={toggleBlack}
                      />
                    </View>
                  )}
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>分类</Text>
                <TagFilter
                  tags={tags}
                  counts={tagCounts}
                  selected={selectedTags}
                  onToggle={toggleTag}
                />
                {hasFilter && (
                  <Pressable onPress={clearFilters} style={styles.clearTags}>
                    <Text style={styles.clearTagsText}>清除筛选</Text>
                  </Pressable>
                )}
              </View>

              <Text style={styles.sectionTitle}>
                棋谱列表
                {hasFilter ? `（${filtered.length}）` : `（${manuals.length}）`}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>没有同时符合所选条件的棋谱</Text>
          }
          renderItem={({ item }) => (
            <Link href={`/manual/${item.id}`} asChild>
              <Pressable style={styles.card}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMeta}>{manualMetaLine(item)}</Text>
                <Text style={styles.cardProgress}>
                  {progressLabel(progressMap[item.id], item)}
                </Text>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}

function progressLabel(progress: ManualProgress | undefined, manual: Manual): string {
  if (!progress || progress.maxReached <= 0) return '未开始';
  if (progress.maxReached >= manual.moves.length) return '已完成';
  return `学到第 ${progress.maxReached} / ${manual.moves.length} 手`;
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
  subtitle: {
    color: '#5C6B5A',
    fontSize: 14,
    marginBottom: 12,
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
  openingBlock: {
    marginBottom: 8,
  },
  openingSide: {
    color: '#5C6B5A',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  recentRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
    paddingRight: 8,
  },
  recentCard: {
    width: 148,
    backgroundColor: '#E8F0E6',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C5D5C0',
  },
  recentTitle: {
    color: '#1B4332',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  recentMeta: {
    color: '#5C6B5A',
    fontSize: 12,
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
  cardTitle: {
    color: '#1B4332',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
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
