import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { wood } from '../lib/theme';

export type BoardAction = {
  key: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
};

/** 棋盘页底栏：字重操作，主操作略提亮 */
export function BoardActionBar({
  actions,
  style,
}: {
  actions: BoardAction[];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.bar, style]}>
      {actions.map((a, i) => (
        <View key={a.key} style={styles.item}>
          {i > 0 ? <Text style={styles.sep}>·</Text> : null}
          <Pressable
            onPress={a.onPress}
            disabled={a.disabled}
            hitSlop={10}
            style={[styles.hit, a.disabled && styles.hitDisabled]}
          >
            <Text style={[styles.label, a.primary && styles.labelPrimary]}>{a.label}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sep: {
    color: wood.creamFaint,
    fontSize: 14,
    marginHorizontal: 10,
  },
  hit: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  hitDisabled: {
    opacity: 0.32,
  },
  label: {
    color: wood.creamSoft,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 2,
  },
  labelPrimary: {
    color: wood.gold,
    fontWeight: '600',
  },
});
