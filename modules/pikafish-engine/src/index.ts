import {
  requireOptionalNativeModule,
  type EventSubscription,
} from 'expo-modules-core';
import { Platform } from 'react-native';

type PikafishEvents = {
  onLine: (event: { line: string }) => void;
  onError: (event: { message: string }) => void;
  onExit: (event: { code: number }) => void;
};

type NativeModule = {
  start(): Promise<boolean>;
  send(command: string): Promise<boolean>;
  stop(): Promise<boolean>;
  addListener<EventName extends keyof PikafishEvents>(
    eventName: EventName,
    listener: PikafishEvents[EventName],
  ): EventSubscription;
};

const NativePikafish: NativeModule | null =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<NativeModule>('PikafishEngine')
    : null;

export function isPikafishAvailable(): boolean {
  return Platform.OS === 'android' && NativePikafish != null;
}

export async function startPikafish(): Promise<void> {
  if (!NativePikafish) throw new Error('Pikafish 仅支持 Android 开发构建');
  await NativePikafish.start();
}

export async function sendPikafish(command: string): Promise<void> {
  if (!NativePikafish) throw new Error('Pikafish 未就绪');
  await NativePikafish.send(command);
}

export async function stopPikafish(): Promise<void> {
  if (!NativePikafish) return;
  await NativePikafish.stop();
}

export function addPikafishLineListener(
  listener: (line: string) => void,
): EventSubscription {
  if (!NativePikafish) {
    return { remove() {} };
  }
  return NativePikafish.addListener('onLine', (event) => {
    listener(event.line);
  });
}

export function addPikafishErrorListener(
  listener: (message: string) => void,
): EventSubscription {
  if (!NativePikafish) {
    return { remove() {} };
  }
  return NativePikafish.addListener('onError', (event) => {
    listener(event.message);
  });
}
