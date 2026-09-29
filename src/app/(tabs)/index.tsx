import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TagFilter } from '../../components/TagFilter';
import {
  allOpenings,
  allTags,
  filterManuals,
  getManualById,
  manualMetaLine,
  manuals,
  openingFacetCounts,
  tagFacetCounts,
} from '../../data/manuals';
import { listAllProgress, listRecentManualIds } from '../../lib/progress';
import { ink } from '../../lib/theme';
import { loadManualFilterPrefs, saveManualFilterPrefs } from '../../lib/uiPrefs';
import type { Manual, ManualProgress } from '../../types/manual';

export default function HomeScreen() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [redOpening, setRedOpening] = useState<string | null>(null);
  const [blackOpening, setBlackOpening] = useState<string | null>(null);
  const [prefsReady, setPrefsReady] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, ManualProgress>>({});
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const prefs = await loadManualFilterPrefs();
      if (!alive) return;
      setSelectedTags(prefs.tags);
      setRedOpening(prefs.redOpening);
      setBlackOpening(prefs.blackOpening);
      setPrefsReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveManualFilterPrefs({
        tags: selectedTags,
        redOpening,
        blackOpening,
      });
    }, 200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [prefsReady, selectedTags, redOpening, blackOpening]);

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
  const redCounts = useMemo(() => openingFacetCounts('red', activeFilter), [activeFilter]);
  const blackCounts = useMemo(() => openingFacetCounts('black', activeFilter), [activeFilter]);
  const recentManuals = useMemo(
    () =>
      recentIds
        .map((id) => getManualById(id))
        .filter((m): m is Manual => m != null)
        .slice(0, 5),
    [recentIds],
  );
  const hasFilter = selectedTags.length > 0 || redOpening != null || blackOpening != null;

  return (
    <View style={styles.container}>
      {loading || !prefsReady ? (
        <ActivityIndicator color={ink.deep} style={{ marginTop: 28 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.header}>
              {recentManuals.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.kicker}>最近</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recentRow}
                  >
                    {recentManuals.map((item, i) => (
                      <View key={item.id} style={styles.recentItem}>
                        {i > 0 ? <Text style={styles.recentSep}>/</Text> : null}
                        <Link href={`/manual/${item.id}`} asChild>
                          <Pressable hitSlop={6}>
                            <Text style={styles.recentTitle} numberOfLines={1}>
                              {item.title}
                            </Text>
                          </Pressable>
                        </Link>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {(redOptions.length > 0 || blackOptions.length > 0) && (
                <View style={styles.section}>
                  {redOptions.length > 0 ? (
                    <View style={styles.filterBlock}>
                      <Text style={styles.filterSide}>先手</Text>
                      <TagFilter
                        tags={redOptions}
                        counts={redCounts}
                        selected={redOpening ? [redOpening] : []}
                        onToggle={(n) => setRedOpening((p) => (p === n ? null : n))}
                      />
                    </View>
                  ) : null}
                  {blackOptions.length > 0 ? (
                    <View style={styles.filterBlock}>
                      <Text style={styles.filterSide}>后手</Text>
                      <TagFilter
                        tags={blackOptions}
                        counts={blackCounts}
                        selected={blackOpening ? [blackOpening] : []}
                        onToggle={(n) => setBlackOpening((p) => (p === n ? null : n))}
                      />
                    </View>
                  ) : null}
                </View>
              )}

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
                {hasFilter ? (
                  <Pressable
                    onPress={() => {
                      setSelectedTags([]);
                      setRedOpening(null);
                      setBlackOpening(null);
                    }}
                    hitSlop={8}
                    style={styles.clear}
                  >
                    <Text style={styles.clearText}>清除筛选</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.countRow}>
                <View style={styles.rule} />
                <Text style={styles.count}>
                  {hasFilter ? filtered.length : manuals.length} 局
                </Text>
                <View style={styles.rule} />
              </View>
            </View>
          }
          ListEmptyComponent={<Text style={styles.empty}>无匹配棋谱</Text>}
          renderItem={({ item }) => (
            <Link href={`/manual/${item.id}`} asChild>
              <Pressable style={styles.row}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {manualMetaLine(item)}
                  <Text style={styles.rowProgress}>
                    {'  '}
                    {progressLabel(progressMap[item.id], item)}
                  </Text>
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
  return `${progress.maxReached}/${manual.moves.length}`;
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
  section: {
    marginBottom: 22,
  },
  kicker: {
    color: ink.faint,
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 10,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 180,
  },
  recentSep: {
    color: ink.faint,
    marginHorizontal: 10,
    fontSize: 13,
  },
  recentTitle: {
    color: ink.deep,
    fontSize: 15,
    fontWeight: '500',
  },
  filterBlock: {
    marginBottom: 6,
  },
  filterSide: {
    color: ink.faint,
    fontSize: 11,
    letterSpacing: 2,
    marginLeft: 8,
    marginBottom: -2,
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
    lineHeight: 18,
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
