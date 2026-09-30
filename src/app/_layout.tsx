import 'react-native-gesture-handler';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { initSfx } from '../lib/sfx';
import { ink, wood } from '../lib/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
    void initSfx();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: ink.wash },
          headerTintColor: ink.deep,
          headerTitleStyle: { fontWeight: '500' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: ink.wash },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="manual/[id]" options={{ title: '棋谱' }} />
        <Stack.Screen
          name="puzzle/[id]"
          options={{
            title: '残棋',
            headerStyle: { backgroundColor: wood.header },
            headerTintColor: wood.cream,
            contentStyle: { backgroundColor: wood.stage },
            statusBarStyle: 'light',
          }}
        />
        <Stack.Screen name="puzzle/solved" options={{ title: '已解' }} />
        <Stack.Screen
          name="play/game"
          options={{
            title: '对弈',
            headerStyle: { backgroundColor: wood.header },
            headerTintColor: wood.cream,
            contentStyle: { backgroundColor: wood.stage },
            statusBarStyle: 'light',
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
