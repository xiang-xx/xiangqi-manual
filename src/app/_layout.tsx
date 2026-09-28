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
        <Stack.Screen name="index" options={{ title: '象棋背谱' }} />
        <Stack.Screen name="manual/[id]" options={{ title: '棋谱' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
