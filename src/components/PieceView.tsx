import { useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { pieceImage } from '../lib/pieceAssets';
import type { BoardPiece } from '../lib/pieces';

type Props = {
  piece: BoardPiece;
  size: number;
  lifted?: boolean;
};

const LIFT_MS = 110;

export function PieceView({ piece, size, lifted = false }: Props) {
  const lift = useSharedValue(lifted ? 1 : 0);

  useEffect(() => {
    lift.value = withTiming(lifted ? 1 : 0, {
      duration: LIFT_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [lifted, lift]);

  const animStyle = useAnimatedStyle(() => {
    const t = lift.value;
    return {
      transform: [
        { translateY: -size * 0.07 * t },
        { scale: 1 + 0.06 * t },
      ],
      shadowRadius: 2 + 5 * t,
      shadowOpacity: 0.2 + 0.18 * t,
      elevation: 3 + 7 * t,
    };
  });

  return (
    <Animated.View
      style={[
        styles.shadow,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: 'transparent',
        },
        animStyle,
      ]}
    >
      <Image
        source={pieceImage(piece)}
        style={{ width: size, height: size, backgroundColor: 'transparent' }}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

export function FlyingPiece({
  piece,
  size,
  translateX,
  translateY,
  scale,
}: {
  piece: BoardPiece;
  size: number;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scale: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    shadowRadius: 7,
    shadowOpacity: 0.32,
    elevation: 14,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.shadow,
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: 'transparent',
          zIndex: 20,
        },
        style,
      ]}
    >
      <Image
        source={pieceImage(piece)}
        style={{ width: size, height: size, backgroundColor: 'transparent' }}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

export const MOVE_MS = 150;

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#1A1208',
    shadowOffset: { width: 0, height: 2 },
  },
});
