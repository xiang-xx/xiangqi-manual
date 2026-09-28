import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { getManualById } from '../../data/manuals';

export default function ManualScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const manual = getManualById(id);

  if (!manual) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>未找到棋谱：{id}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: manual.title }} />
      <View style={styles.container}>
        <View style={styles.boardPlaceholder}>
          <Text style={styles.boardHint}>棋盘将在此渲染</Text>
          <Text style={styles.fen}>{manual.startFen}</Text>
        </View>
        <Text style={styles.sectionTitle}>着法预览</Text>
        {manual.moves.map((move, index) => (
          <Text key={`${move.uci}-${index}`} style={styles.moveLine}>
            {index + 1}. {move.san}
            {move.uci ? `（${move.uci}）` : ''}
          </Text>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  error: {
    color: '#B42318',
    fontSize: 16,
  },
  boardPlaceholder: {
    minHeight: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C9B896',
    backgroundColor: '#E8DCC3',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 20,
  },
  boardHint: {
    color: '#1B4332',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  fen: {
    color: '#5C6B5A',
    fontSize: 11,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#1B4332',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  moveLine: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 24,
  },
});
