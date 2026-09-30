import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  subscribeCombatFlash,
  type CombatFlashKind,
} from '../lib/combatFlash';

type Burst = {
  id: number;
  kind: CombatFlashKind;
};

let nextId = 1;

/**
 * 将军 / 绝杀全屏字效（冲入大字 + 红晕闪）。
 * 挂在棋盘 stage 上，pointerEvents none。
 */
export function CombatFlash() {
  const [burst, setBurst] = useState<Burst | null>(null);
  const progress = useSharedValue(0);
  const wash = useSharedValue(0);
  /** 0 = 将军，1 = 绝杀 */
  const intensity = useSharedValue(0);

  useEffect(() => {
    return subscribeCombatFlash((kind) => {
      setBurst({ id: nextId++, kind });
    });
  }, []);

  useEffect(() => {
    if (!burst) return;

    const mate = burst.kind === 'checkmate';
    intensity.value = mate ? 1 : 0;
    progress.value = 0;
    wash.value = 0;

    const hold = mate ? 780 : 520;
    const fade = mate ? 460 : 340;

    wash.value = withSequence(
      withTiming(1, { duration: 80, easing: Easing.out(Easing.quad) }),
      withTiming(mate ? 0.62 : 0.34, { duration: 160 }),
      withDelay(hold, withTiming(0, { duration: fade })),
    );

    progress.value = withSequence(
      withTiming(1, { duration: 240, easing: Easing.out(Easing.back(1.7)) }),
      withDelay(
        hold,
        withTiming(2, { duration: fade, easing: Easing.in(Easing.quad) }, (finished) => {
          if (finished) runOnJS(setBurst)(null);
        }),
      ),
    );
  }, [burst, intensity, progress, wash]);

  const washStyle = useAnimatedStyle(() => ({
    opacity: wash.value * interpolate(intensity.value, [0, 1], [0.3, 0.58]),
    backgroundColor:
      intensity.value > 0.5 ? 'rgba(110, 12, 10, 1)' : 'rgba(150, 32, 24, 1)',
  }));

  const labelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const appear = Math.min(p, 1);
    const fadeOut = p > 1 ? p - 1 : 0;
    return {
      opacity: interpolate(appear, [0, 0.12, 1], [0, 1, 1]) * (1 - fadeOut),
      transform: [
        {
          scale:
            interpolate(appear, [0, 1], [1.9, 1]) *
            interpolate(fadeOut, [0, 1], [1, 1.08]),
        },
        { translateY: interpolate(appear, [0, 1], [22, 0]) },
      ],
    };
  });

  const ringStyle = useAnimatedStyle(() => {
    const p = Math.min(progress.value, 1);
    const fadeOut = Math.max(0, progress.value - 1);
    return {
      opacity: interpolate(p, [0, 0.18, 1], [0, 0.75, 0.15]) * (1 - fadeOut),
      transform: [{ scale: interpolate(p, [0, 1], [0.5, 1.5]) }],
      borderColor:
        intensity.value > 0.5
          ? 'rgba(255, 200, 100, 0.8)'
          : 'rgba(255, 214, 150, 0.55)',
    };
  });

  if (!burst) return null;

  const mate = burst.kind === 'checkmate';
  const label = mate ? '绝杀' : '将军';

  return (
    <View style={styles.root} pointerEvents="none">
      <Animated.View style={[styles.wash, washStyle]} />
      <View style={styles.center}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={labelStyle}>
          <Text
            style={[styles.label, mate ? styles.labelMate : styles.labelCheck]}
            allowFontScaling={false}
          >
            {label}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wash: {
    ...StyleSheet.absoluteFill,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 3,
  },
  label: {
    fontSize: 76,
    fontWeight: '800',
    letterSpacing: 12,
    textAlign: 'center',
  },
  labelCheck: {
    color: '#F6E6C4',
    textShadowColor: 'rgba(70, 8, 6, 0.85)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  labelMate: {
    color: '#FFE7A0',
    textShadowColor: 'rgba(40, 4, 2, 0.95)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
});
