import { StyleSheet, Text, View } from 'react-native';

import { pieceLabel, type BoardPiece } from '../lib/pieces';

type Props = {
  piece: BoardPiece;
  size: number;
};

export function PieceView({ piece, size }: Props) {
  const isRed = piece.color === 'r';
  const fontSize = size * 0.48;

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: isRed ? '#C62828' : '#212121',
          borderWidth: Math.max(2, size * 0.06),
          backgroundColor: isRed ? '#F4E4C1' : '#F0E6D2',
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            width: size * 0.78,
            height: size * 0.78,
            borderRadius: size * 0.39,
            borderColor: isRed ? '#E57373' : '#757575',
          },
        ]}
      >
        <Text
          style={{
            color: isRed ? '#B71C1C' : '#111111',
            fontSize,
            fontWeight: '700',
            lineHeight: fontSize * 1.15,
          }}
        >
          {pieceLabel(piece)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3E2723',
    shadowOpacity: 0.25,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
