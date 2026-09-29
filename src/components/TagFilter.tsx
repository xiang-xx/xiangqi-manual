import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ink } from '../lib/theme';

type Props = {
  tags: string[];
  counts: Record<string, number>;
  selected: string[];
  onToggle: (tag: string) => void;
};

export function TagFilter({ tags, counts, selected, onToggle }: Props) {
  const selectedSet = new Set(selected);

  return (
    <View style={styles.wrap}>
      {tags.map((tag) => {
        const active = selectedSet.has(tag);
        const count = counts[tag] ?? 0;
        return (
          <Pressable
            key={tag}
            onPress={() => onToggle(tag)}
            style={[styles.chip, active && styles.chipActive]}
            hitSlop={4}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {tag}
              <Text style={[styles.chipCount, active && styles.chipCountActive]}> {count}</Text>
            </Text>
            {active ? <View style={styles.underline} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 4,
    rowGap: 2,
  },
  chip: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
  },
  chipActive: {},
  chipText: {
    color: ink.soft,
    fontSize: 14,
    fontWeight: '400',
  },
  chipTextActive: {
    color: ink.deep,
    fontWeight: '600',
  },
  chipCount: {
    color: ink.faint,
    fontSize: 12,
    fontWeight: '400',
  },
  chipCountActive: {
    color: ink.soft,
  },
  underline: {
    marginTop: 4,
    height: 1.5,
    backgroundColor: ink.deep,
    borderRadius: 1,
  },
});
