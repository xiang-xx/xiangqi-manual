import { Pressable, StyleSheet, Text, View } from 'react-native';

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
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {tag}
              <Text style={[styles.chipCount, active && styles.chipCountActive]}>
                {' '}
                {count}
              </Text>
            </Text>
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
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#EFE6D6',
    borderWidth: 1,
    borderColor: '#D4C4A8',
  },
  chipActive: {
    backgroundColor: '#1B4332',
    borderColor: '#1B4332',
  },
  chipText: {
    color: '#3D4F3C',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#F7F3E8',
  },
  chipCount: {
    color: '#7A8A78',
    fontSize: 12,
    fontWeight: '600',
  },
  chipCountActive: {
    color: 'rgba(247, 243, 232, 0.72)',
  },
});
