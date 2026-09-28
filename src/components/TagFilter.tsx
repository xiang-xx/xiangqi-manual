import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

type Props = {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
};

export function TagFilter({ tags, selected, onToggle }: Props) {
  const selectedSet = new Set(selected);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {tags.map((tag) => {
        const active = selectedSet.has(tag);
        return (
          <Pressable
            key={tag}
            onPress={() => onToggle(tag)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{tag}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 4,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 12,
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
});
