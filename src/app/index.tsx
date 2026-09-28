import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { manuals } from '../data/manuals';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>本地棋谱 · 离线背谱</Text>
      <FlatList
        data={manuals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Link href={`/manual/${item.id}`} asChild>
            <Pressable style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>
                {categoryLabel(item.category)} · 背{sideLabel(item.sideToMemorize)} ·{' '}
                {item.moves.length} 手
              </Text>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

function categoryLabel(category: string) {
  switch (category) {
    case 'opening':
      return '开局';
    case 'middlegame':
      return '中局';
    case 'endgame':
      return '残局';
    default:
      return category;
  }
}

function sideLabel(side: string) {
  return side === 'red' ? '红' : side === 'black' ? '黑' : '双方';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  subtitle: {
    color: '#5C6B5A',
    fontSize: 14,
    marginBottom: 12,
  },
  list: {
    gap: 10,
    paddingBottom: 24,
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
  },
});
