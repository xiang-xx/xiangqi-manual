import 'react-native-gesture-handler';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#F7F3E8' },
          headerTintColor: '#1B4332',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#F7F3E8' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="manual/[id]" options={{ title: '棋谱' }} />
        <Stack.Screen
          name="puzzle/[id]"
          options={{
            title: '残棋',
            headerStyle: { backgroundColor: '#2C1A0E' },
            headerTintColor: '#F3E2C4',
            contentStyle: { backgroundColor: '#24140C' },
          }}
        />
        <Stack.Screen name="puzzle/solved" options={{ title: '已解残棋' }} />
        <Stack.Screen
          name="play/game"
          options={{
            title: '对弈',
            headerStyle: { backgroundColor: '#2C1A0E' },
            headerTintColor: '#F3E2C4',
            contentStyle: { backgroundColor: '#24140C' },
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
