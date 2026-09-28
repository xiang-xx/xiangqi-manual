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

const LIFT_MS = 120;

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
        { translateY: -size * 0.08 * t },
        { scale: 1 + 0.07 * t },
      ],
      shadowRadius: 2 + 6 * t,
      shadowOpacity: 0.22 + 0.2 * t,
      elevation: 3 + 8 * t,
    };
  });

  return (
    <Animated.View
      style={[
        styles.shadow,
        { width: size, height: size, borderRadius: size / 2 },
        animStyle,
      ]}
    >
      <Image source={pieceImage(piece)} style={{ width: size, height: size }} resizeMode="contain" />
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
    shadowRadius: 8,
    shadowOpacity: 0.35,
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
          zIndex: 20,
        },
        style,
      ]}
    >
      <Image source={pieceImage(piece)} style={{ width: size, height: size }} resizeMode="contain" />
    </Animated.View>
  );
}

/** 走子时长：短而干脆 */
export const MOVE_MS = 160;

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#1A1208',
    shadowOffset: { width: 0, height: 2 },
  },
});
