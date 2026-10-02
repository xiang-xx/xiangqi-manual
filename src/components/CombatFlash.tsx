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
 * 将军：只出大字，不闪屏。
 * 绝杀：大字 + 轻红晕（终局强调）。
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

    const hold = mate ? 780 : 560;
    const fade = mate ? 420 : 300;

    if (mate) {
      wash.value = withSequence(
        withTiming(0.85, { duration: 100, easing: Easing.out(Easing.quad) }),
        withTiming(0.4, { duration: 180 }),
        withDelay(hold, withTiming(0, { duration: fade })),
      );
    }

    progress.value = withSequence(
      withTiming(1, {
        duration: mate ? 240 : 180,
        easing: mate ? Easing.out(Easing.back(1.5)) : Easing.out(Easing.cubic),
      }),
      withDelay(
        hold,
        withTiming(2, { duration: fade, easing: Easing.in(Easing.quad) }, (finished) => {
          if (finished) runOnJS(setBurst)(null);
        }),
      ),
    );
  }, [burst, intensity, progress, wash]);

  const washStyle = useAnimatedStyle(() => ({
    opacity: wash.value * 0.42,
    backgroundColor: 'rgba(110, 12, 10, 1)',
  }));

  const labelStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const appear = Math.min(p, 1);
    const fadeOut = p > 1 ? p - 1 : 0;
    const mate = intensity.value > 0.5;
    return {
      opacity: interpolate(appear, [0, 0.15, 1], [0, 1, 1]) * (1 - fadeOut),
      transform: [
        {
          scale:
            interpolate(appear, [0, 1], [mate ? 1.75 : 1.35, 1]) *
            interpolate(fadeOut, [0, 1], [1, 1.04]),
        },
        { translateY: interpolate(appear, [0, 1], [mate ? 16 : 8, 0]) },
      ],
    };
  });

  if (!burst) return null;

  const mate = burst.kind === 'checkmate';
  const label = mate ? '绝杀' : '将军';

  return (
    <View style={styles.root} pointerEvents="none">
      {mate ? <Animated.View style={[styles.wash, washStyle]} /> : null}
      <View style={styles.center}>
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
  label: {
    fontSize: 72,
    fontWeight: '800',
    letterSpacing: 12,
    textAlign: 'center',
  },
  labelCheck: {
    color: '#FFF1D0',
    textShadowColor: 'rgba(40, 18, 8, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  labelMate: {
    color: '#FFE7A0',
    textShadowColor: 'rgba(40, 4, 2, 0.95)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
});
