import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';

function TabLabel({ label, color }: { label: string; color: ColorValue }) {
  return (
    <Text style={{ color, fontSize: 12, fontWeight: '600', marginTop: 2 }}>{label}</Text>
  );
}

function TabGlyph({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ color, fontSize: 20, fontWeight: '700' }}>{glyph}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#F7F3E8' },
        headerTintColor: '#1B4332',
        headerTitleStyle: { fontWeight: '600' },
        sceneStyle: { backgroundColor: '#F7F3E8' },
        tabBarActiveTintColor: '#1B4332',
        tabBarInactiveTintColor: '#7A8A78',
        tabBarStyle: {
          backgroundColor: '#F7F3E8',
          borderTopColor: '#E4DDCF',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '象棋背谱',
          tabBarLabel: ({ color }) => <TabLabel label="背谱" color={color} />,
          tabBarIcon: ({ color }) => <TabGlyph glyph="谱" color={color} />,
        }}
      />
      <Tabs.Screen
        name="puzzles"
        options={{
          title: '解残棋',
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
