import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Board } from '../../components/Board';
import { TABLE_WOOD } from '../../lib/pieceAssets';
import {
  AI_DIFFICULTIES,
  findBestMove,
  shutdownEngine,
  type AiDifficulty,
} from '../../lib/pikafish';
import {
  applyAiMove,
  beginAiThink,
  initialPlayState,
  isHumanTurn,
  resign,
  selectPlaySquare,
  type PlaySide,
  type PlayState,
} from '../../lib/playMachine';
import type { Square } from '../../lib/squares';
import { turnFromFen } from '../../lib/engine';

const AI_MOVE_DELAY_MS = 300;

function parseSide(raw: string | string[] | undefined): PlaySide {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === 'black' ? 'black' : 'red';
}

function parseDifficulty(raw: string | string[] | undefined): AiDifficulty {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v && (AI_DIFFICULTIES as string[]).includes(v)) return v as AiDifficulty;
  return '中级';
}

export default function PlayGameScreen() {
  const params = useLocalSearchParams<{ side?: string; difficulty?: string }>();
  const side = parseSide(params.side);
  const difficulty = parseDifficulty(params.difficulty);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [state, setState] = useState<PlayState>(() => initialPlayState(side));
  const [engineError, setEngineError] = useState<string | null>(null);
  const aiBusy = useRef(false);
  const genRef = useRef(0);
  const mounted = useRef(true);

  const flipped = side === 'black';

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      void shutdownEngine();
    };
  }, []);

  // 轮到 AI：思考并走子
  useEffect(() => {
    if (state.status !== 'playing') return;
    if (engineError) return;
    if (isHumanTurn(state)) return;
    if (aiBusy.current) return;

    const requestFen = state.fen;
    let cancelled = false;
    aiBusy.current = true;
    const gen = ++genRef.current;

    (async () => {
      setState((prev) => (prev.fen === requestFen ? beginAiThink(prev) : prev));
      try {
        const uci = await findBestMove(requestFen, difficulty);
        if (cancelled || !mounted.current || genRef.current !== gen) return;
        await new Promise((r) => setTimeout(r, AI_MOVE_DELAY_MS));
        if (cancelled || !mounted.current || genRef.current !== gen) return;
        setState((prev) => (prev.fen === requestFen ? applyAiMove(prev, uci) : prev));
      } catch (e) {
        if (cancelled || !mounted.current || genRef.current !== gen) return;
        const msg = e instanceof Error ? e.message : '引擎错误';
        setEngineError(msg);
        setState((prev) =>
          prev.fen === requestFen
            ? { ...prev, thinking: false, feedback: msg }
            : prev,
        );
      } finally {
        if (genRef.current === gen) aiBusy.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.fen, state.status, state.humanSide, difficulty, engineError]);

  const restart = () => {
    aiBusy.current = false;
    genRef.current += 1;
    setEngineError(null);
    setState(initialPlayState(side));
  };

  const statusColor =
    state.status === 'won' ? '#2D6A4F' : state.status === 'lost' ? '#9B2226' : '#F3E2C4';

  return (
    <>
      <Stack.Screen
        options={{
          title: `对弈 · ${difficulty}`,
          headerStyle: { backgroundColor: '#2C1A0E' },
          headerTintColor: '#F3E2C4',
          headerTitleStyle: { fontWeight: '600', fontSize: 16 },
          headerShadowVisible: false,
        }}
      />
      <ImageBackground source={TABLE_WOOD} style={styles.root} resizeMode="cover">
        <View style={styles.dim} />

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {side === 'red' ? '你执红' : '你执黑'} ·{' '}
            {state.status === 'playing'
              ? turnFromFen(state.fen) === side
                ? '你的回合'
                : '引擎回合'
              : state.status === 'won'
                ? '胜利'
                : state.status === 'lost'
                  ? '失败'
                  : '和棋'}
          </Text>
        </View>

        <Text style={[styles.feedback, { color: statusColor }]} numberOfLines={2}>
          {state.feedback ?? ' '}
        </Text>

        <View style={styles.boardStage}>
          <Board
            fen={state.fen}
            flipped={flipped}
            selected={state.selected}
            legalTargets={state.legalTargets}
            lastMove={state.lastMove}
            onSquarePress={(sq: Square) => {
              if (!isHumanTurn(state)) return;
              setState((prev) => selectPlaySquare(prev, sq));
            }}
          />
        </View>

        <View style={[styles.actions, { marginBottom: Math.max(insets.bottom, 10) }]}>
          {state.status === 'playing' && !engineError ? (
            <Pressable
              onPress={() => setState((prev) => resign(prev))}
              style={styles.btnGhost}
            >
              <Text style={styles.btnGhostText}>认输</Text>
            </Pressable>
          ) : (
            <Pressable onPress={restart} style={styles.btnPrimary}>
              <Text style={styles.btnPrimaryText}>再来一局</Text>
            </Pressable>
          )}
          <Pressable onPress={() => router.back()} style={styles.btnGhost}>
            <Text style={styles.btnGhostText}>返回</Text>
          </Pressable>
        </View>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 10, 4, 0.35)',
  },
  metaRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    color: '#F3E2C4',
    fontSize: 14,
    fontWeight: '600',
  },
  feedback: {
    minHeight: 22,
    marginTop: 6,
    marginHorizontal: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  boardStage: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  btnPrimary: {
    backgroundColor: '#F3E2C4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  btnPrimaryText: {
    color: '#2C1A0E',
    fontWeight: '700',
  },
  btnGhost: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  btnGhostText: {
    color: '#D4B896',
    fontWeight: '600',
  },
});
