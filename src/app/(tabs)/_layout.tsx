import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';

import { ink } from '../../lib/theme';

function TabLabel({ label, color }: { label: string; color: ColorValue }) {
  return (
    <Text style={{ color, fontSize: 11, fontWeight: '500', letterSpacing: 1, marginTop: 2 }}>
      {label}
    </Text>
  );
}

function TabGlyph({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ color, fontSize: 18, fontWeight: '600' }}>{glyph}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: ink.wash },
        headerTintColor: ink.deep,
        headerTitleStyle: { fontWeight: '500', fontSize: 17, letterSpacing: 2 },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: ink.wash },
        tabBarActiveTintColor: ink.deep,
        tabBarInactiveTintColor: ink.faint,
        tabBarStyle: {
          backgroundColor: ink.wash,
          borderTopColor: ink.rule,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '背谱',
          tabBarLabel: ({ color }) => <TabLabel label="背谱" color={color} />,
          tabBarIcon: ({ color }) => <TabGlyph glyph="谱" color={color} />,
        }}
      />
      <Tabs.Screen
        name="puzzles"
        options={{
          title: '残棋',
          tabBarLabel: ({ color }) => <TabLabel label="残棋" color={color} />,
          tabBarIcon: ({ color }) => <TabGlyph glyph="残" color={color} />,
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: '对弈',
          tabBarLabel: ({ color }) => <TabLabel label="对弈" color={color} />,
          tabBarIcon: ({ color }) => <TabGlyph glyph="弈" color={color} />,
        }}
      />
    </Tabs>
  );
}
