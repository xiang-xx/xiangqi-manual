import { useEffect, useRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { pieceImage } from '../lib/pieceAssets';
import type { BoardPiece } from '../lib/pieces';

type Props = {
  piece: BoardPiece;
  size: number;
  lifted?: boolean;
};

const LIFT_MS = 100;

/** Sharp ease-out for travel; slam uses separate in-curve. */
export const MOVE_EASING = Easing.bezier(0.22, 0.85, 0.28, 1);
export const MOVE_MS = 125;
export const LIFT_UP_MS = 55;
export const SLAM_MS = 70;

function SoftGroundShadow({
  size,
  opacity,
  gradId,
}: {
  size: number;
  opacity: number;
  gradId: string;
}) {
  const s = size;
  return (
    <Svg width={s} height={s} style={{ position: 'absolute' }}>
      <Defs>
        <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#1A1008" stopOpacity={opacity} />
          <Stop offset="45%" stopColor="#1A1008" stopOpacity={opacity * 0.55} />
          <Stop offset="75%" stopColor="#1A1008" stopOpacity={opacity * 0.18} />
          <Stop offset="100%" stopColor="#1A1008" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={s / 2} cy={s / 2} r={s / 2} fill={`url(#${gradId})`} />
    </Svg>
  );
}

export function PieceView({ piece, size, lifted = false }: Props) {
  const lift = useSharedValue(lifted ? 1 : 0);
  const gradId = useRef(`gs-${Math.random().toString(36).slice(2, 9)}`).current;

  useEffect(() => {
    lift.value = withTiming(lifted ? 1 : 0, {
      duration: LIFT_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [lifted, lift]);

  // 盘面接触影：提起后变大、变淡、更虚（参考天天象棋）
  const groundStyle = useAnimatedStyle(() => {
    const t = lift.value;
    return {
      transform: [
        { translateX: interpolate(t, [0, 1], [size * 0.03, size * 0.06]) },
        { translateY: interpolate(t, [0, 1], [size * 0.04, size * 0.08]) },
        { scale: interpolate(t, [0, 1], [0.9, 1.38]) },
      ],
      opacity: interpolate(t, [0, 1], [1, 0.38]),
    };
  });

  const pieceStyle = useAnimatedStyle(() => {
    const t = lift.value;
    return {
      transform: [
        { translateY: -size * 0.12 * t },
        { scale: 1 + 0.07 * t },
      ],
      shadowRadius: interpolate(t, [0, 1], [3.5, 2]),
      shadowOpacity: interpolate(t, [0, 1], [0.38, 0.12]),
      shadowOffset: {
        width: interpolate(t, [0, 1], [1.5, 0.5]),
        height: interpolate(t, [0, 1], [3, 1]),
      },
      elevation: interpolate(t, [0, 1], [7, 12]),
    };
  });

  const groundSize = size * 1.05;

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: (size - groundSize) / 2,
            top: (size - groundSize) / 2,
            width: groundSize,
            height: groundSize,
          },
          groundStyle,
        ]}
      >
        <SoftGroundShadow size={groundSize} opacity={0.5} gradId={gradId} />
      </Animated.View>
      <Animated.View
        style={[
          styles.pieceHost,
          { width: size, height: size, borderRadius: size / 2 },
          pieceStyle,
        ]}
      >
        <View style={[styles.clip, { width: size, height: size, borderRadius: size / 2 }]}>
          <Image
            source={pieceImage(piece)}
            style={{ width: size, height: size }}
            resizeMode="cover"
          />
        </View>
      </Animated.View>
    </View>
  );
}

export function FlyingPiece({
  piece,
  size,
  translateX,
  translateY,
  scale,
  lift,
}: {
  piece: BoardPiece;
  size: number;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scale: SharedValue<number>;
  /** 0 on board → 1 fully raised */
  lift: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const t = lift.value;
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value - size * 0.18 * t },
        { scale: scale.value },
      ],
      shadowRadius: interpolate(t, [0, 1], [3.5, 2]),
      shadowOpacity: interpolate(t, [0, 1], [0.35, 0.12]),
      shadowOffset: {
        width: interpolate(t, [0, 1], [1.5, 0.5]),
        height: interpolate(t, [0, 1], [3, 1]),
      },
      elevation: interpolate(t, [0, 1], [8, 16]),
    };
  });

  const groundSize = size * 1.15;
  const shadowStyle = useAnimatedStyle(() => {
    const t = lift.value;
    return {
      transform: [
        {
          translateX:
            translateX.value + interpolate(t, [0, 1], [size * 0.04, size * 0.08]),
        },
        {
          translateY:
            translateY.value + interpolate(t, [0, 1], [size * 0.05, size * 0.1]),
        },
        { scale: interpolate(t, [0, 1], [0.92, 1.4]) },
      ],
      // 提起时盘面影变大变淡
      opacity: interpolate(t, [0, 1], [0.9, 0.32]),
    };
  });

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: (size - groundSize) / 2,
            top: (size - groundSize) / 2,
            width: groundSize,
            height: groundSize,
            zIndex: 19,
          },
          shadowStyle,
        ]}
      >
        <SoftGroundShadow size={groundSize} opacity={0.45} gradId="gs-fly" />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pieceHost,
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
        <View style={[styles.clip, { width: size, height: size, borderRadius: size / 2 }]}>
          <Image
            source={pieceImage(piece)}
            style={{ width: size, height: size }}
            resizeMode="cover"
          />
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  pieceHost: {
    shadowColor: '#0A0603',
    shadowOffset: { width: 1.5, height: 3 },
    shadowRadius: 3.5,
    shadowOpacity: 0.38,
    elevation: 7,
    backgroundColor: 'rgba(40, 28, 14, 0.16)',
  },
  clip: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
});
