import { useKeepAwake } from 'expo-keep-awake';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Board } from '../../components/Board';
import { BoardScreenLayout } from '../../components/BoardScreenLayout';
import { fenAfterMoves, turnFromFen } from '../../lib/engine';
import {
  AI_DIFFICULTIES,
  findBestMove,
  isPikafishAvailable,
  shutdownEngine,
  type AiDifficulty,
} from '../../lib/pikafish';
import {
  applyAiMove,
  beginAiThink,
  canUndo,
  initialPlayState,
  isHumanTurn,
  resign,
  restorePlayState,
  selectPlaySquare,
  undoPlay,
  type PlaySide,
  type PlayState,
} from '../../lib/playMachine';
import { createPlayGame, getPlayGame, savePlayGame } from '../../lib/playProgress';
import {
  analyzeHumanPlies,
  hintFromNote,
  noteAtPly,
  reviewSummary,
  type ReviewNote,
} from '../../lib/playReview';
import { playMoveSfx, playSfxIfMoved } from '../../lib/sfx';
import { parseUci, type Square } from '../../lib/squares';
import { wood } from '../../lib/theme';

const AI_MOVE_DELAY_MS = 300;
/** 记谱/背谱切入演变时的默认难度（较强） */
const EXPLORE_DIFFICULTY: AiDifficulty = '高级';

function parseSide(raw: string | string[] | undefined): PlaySide {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === 'black' ? 'black' : 'red';
}

function parseDifficulty(
  raw: string | string[] | undefined,
  fallback: AiDifficulty = '中级',
): AiDifficulty {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v && (AI_DIFFICULTIES as string[]).includes(v)) return v as AiDifficulty;
  return fallback;
}

function parseParam(raw: string | string[] | undefined): string | undefined {
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

function AiPulseDot({ active }: { active: boolean }) {
  const pulse = useSharedValue(0.25);
  useEffect(() => {
    if (!active) {
      pulse.value = 0.25;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [active, pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: active ? pulse.value : 0,
  }));

  return <Animated.View pointerEvents="none" style={[styles.pulseDot, style]} />;
}

export default function PlayGameScreen() {
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });
  const params = useLocalSearchParams<{
    id?: string;
    side?: string;
    difficulty?: string;
    fen?: string;
    ephemeral?: string;
  }>();
  const paramId = parseParam(params.id);
  const paramFen = parseParam(params.fen);
  const ephemeral = parseParam(params.ephemeral) === '1';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [gameId, setGameId] = useState<string | null>(paramId ?? null);
  const [side, setSide] = useState<PlaySide>(parseSide(params.side));
  const [difficulty, setDifficulty] = useState<AiDifficulty>(
    parseDifficulty(params.difficulty, ephemeral ? EXPLORE_DIFFICULTY : '中级'),
  );
  const [state, setState] = useState<PlayState | null>(null);
  const [ready, setReady] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewProgress, setReviewProgress] = useState('');
  const [reviewNotes, setReviewNotes] = useState<ReviewNote[] | null>(null);
  const [reviewPly, setReviewPly] = useState(0);
  const aiBusy = useRef(false);
  const genRef = useRef(0);
  const mounted = useRef(true);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flipped = side === 'black';
  const inReview = reviewNotes != null;
  const aiThinking =
    !inReview &&
    !!state &&
    state.status === 'playing' &&
    !engineError &&
    (state.thinking || turnFromFen(state.fen) !== state.humanSide);

  const endLabel =
    !state || state.status === 'playing' || inReview
      ? null
      : state.status === 'won'
        ? '胜'
        : state.status === 'draw'
          ? '和'
          : state.note === '认负'
            ? '认负'
            : '负';

  const reviewFen = useMemo(() => {
    if (!state || !inReview) return null;
    if (reviewPly <= 0) return state.startFen;
    try {
      return fenAfterMoves(state.startFen, state.moves.slice(0, reviewPly));
    } catch {
      return state.fen;
    }
  }, [state, inReview, reviewPly]);

  const reviewLastMove = useMemo(() => {
    if (!state || !inReview || reviewPly <= 0) return null;
    return parseUci(state.moves[reviewPly - 1]);
  }, [state, inReview, reviewPly]);

  const activeNote = useMemo(() => {
    if (!reviewNotes || reviewPly <= 0) return null;
    return noteAtPly(reviewNotes, reviewPly - 1);
  }, [reviewNotes, reviewPly]);

  const reviewHint = hintFromNote(activeNote);

  useEffect(() => {
    let alive = true;
    (async () => {
      setReady(false);
      setEngineError(null);
      setReviewNotes(null);
      setReviewing(false);
      aiBusy.current = false;
      genRef.current += 1;

      if (paramId) {
        const record = await getPlayGame(paramId);
        if (!alive) return;
        if (!record) {
          setGameId(null);
          setState(null);
          setReady(true);
          return;
        }
        setGameId(record.id);
        setSide(record.humanSide);
        setDifficulty(record.difficulty);
        setState(
          restorePlayState(record.humanSide, record.moves, { resigned: record.resigned }),
        );
        setReady(true);
        return;
      }

      // 记谱/背谱切入：不落盘，从当前 FEN 开局
      if (ephemeral && paramFen) {
        const humanSide = parseSide(params.side);
        const diff = parseDifficulty(params.difficulty, EXPLORE_DIFFICULTY);
        setGameId(null);
        setSide(humanSide);
        setDifficulty(diff);
        setState(initialPlayState(humanSide, paramFen));
        setReady(true);
        return;
      }

      const record = await createPlayGame({
        humanSide: parseSide(params.side),
        difficulty: parseDifficulty(params.difficulty),
      });
      if (!alive) return;
      setGameId(record.id);
      setSide(record.humanSide);
      setDifficulty(record.difficulty);
      setState(initialPlayState(record.humanSide));
      setReady(true);
      router.replace({ pathname: '/play/game', params: { id: record.id } });
    })();

    return () => {
      alive = false;
    };
  }, [paramId, ephemeral, paramFen]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      void shutdownEngine();
    };
  }, []);

  useEffect(() => {
    if (!ready || ephemeral || !gameId || !state) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      void savePlayGame(gameId, {
        moves: state.moves,
        status: state.status,
        resigned: state.note === '认负' && state.status === 'lost',
      });
    }, 200);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [ready, ephemeral, gameId, state?.moves, state?.status, state?.note]);

  useEffect(() => {
    if (!ready || !state || inReview) return;
    if (state.status !== 'playing') return;
    if (engineError) return;
    if (isHumanTurn(state)) return;
    if (aiBusy.current) return;

    const requestFen = state.fen;
    let cancelled = false;
    aiBusy.current = true;
    const gen = ++genRef.current;

    (async () => {
      setState((prev) => (prev && prev.fen === requestFen ? beginAiThink(prev) : prev));
      try {
        const uci = await findBestMove(requestFen, difficulty);
        if (cancelled || !mounted.current || genRef.current !== gen) return;
        await new Promise((r) => setTimeout(r, AI_MOVE_DELAY_MS));
        if (cancelled || !mounted.current || genRef.current !== gen) return;
        setState((prev) => {
          if (!prev || prev.fen !== requestFen) return prev;
          const next = applyAiMove(prev, uci);
          playMoveSfx(prev.fen, uci);
          return next;
        });
      } catch (e) {
        if (cancelled || !mounted.current || genRef.current !== gen) return;
        const msg = e instanceof Error ? e.message : '引擎错误';
        setEngineError(msg);
        setState((prev) =>
          prev && prev.fen === requestFen ? { ...prev, thinking: false, note: msg } : prev,
        );
      } finally {
        if (genRef.current === gen) aiBusy.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, state?.fen, state?.status, state?.humanSide, difficulty, engineError, inReview]);

  const restart = async () => {
    aiBusy.current = false;
    genRef.current += 1;
    setEngineError(null);
    setReviewNotes(null);
    setReviewing(false);
    if (ephemeral) {
      const start = state?.startFen ?? paramFen;
      if (!start) return;
      setState(initialPlayState(side, start));
      return;
    }
    const record = await createPlayGame({ humanSide: side, difficulty });
    router.replace({ pathname: '/play/game', params: { id: record.id } });
  };

  const onUndo = () => {
    if (!state || !canUndo(state) || inReview) return;
    genRef.current += 1;
    aiBusy.current = false;
    setEngineError(null);
    setState((prev) => (prev ? undoPlay(prev) : prev));
  };

  const goBack = () => router.back();

  const startReview = async () => {
    if (!state || reviewing) return;
    if (!isPikafishAvailable()) {
      setEngineError('当前环境无法复盘');
      return;
    }
    setReviewing(true);
    setReviewProgress('复盘中…');
    try {
      const notes = await analyzeHumanPlies(
        state.moves,
        state.humanSide,
        (done, total) => {
          setReviewProgress(`复盘中 ${done}/${total}`);
        },
        state.startFen,
      );
      if (!mounted.current) return;
      setReviewNotes(notes);
      setReviewPly(state.moves.length);
      setReviewProgress(reviewSummary(notes));
    } catch (e) {
      if (!mounted.current) return;
      setEngineError(e instanceof Error ? e.message : '复盘失败');
    } finally {
      if (mounted.current) setReviewing(false);
    }
  };

  if (!ready || !state) {
    return (
      <>
        <Stack.Screen
          options={{
            title: ephemeral ? '演变' : '对弈',
            headerStyle: { backgroundColor: wood.header },
            headerTintColor: wood.cream,
            headerShadowVisible: false,
            statusBarStyle: 'light',
          }}
        />
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>{ready && !state ? '未找到对局' : '载入中…'}</Text>
        </View>
      </>
    );
  }

  const playing = state.status === 'playing' && !engineError && !inReview;
  const boardFen = reviewFen ?? state.fen;
  const boardLastMove = inReview ? reviewLastMove : state.lastMove;
  const overlayText = reviewing
    ? reviewProgress
    : inReview
      ? (activeNote?.text ?? reviewProgress)
      : engineError ?? endLabel;
  const backLabel = ephemeral ? '回原局' : '返回';
  const screenTitle = inReview
    ? '复盘'
    : ephemeral
      ? `演变 · ${difficulty}`
      : `对弈 · ${difficulty}`;

  return (
    <>
      <Stack.Screen
        options={{
          title: screenTitle,
          headerStyle: { backgroundColor: wood.header },
          headerTintColor: wood.cream,
          headerTitleStyle: { fontWeight: '500', fontSize: 16 },
          headerShadowVisible: false,
          statusBarStyle: 'light',
        }}
      />
      <View style={styles.root}>
        <BoardScreenLayout
          bottomInset={insets.bottom}
          header={
            <View style={styles.metaRow}>
              <Text style={styles.metaSide}>
                {ephemeral ? '试走' : side === 'red' ? '执红' : '执黑'}
                {ephemeral ? ` · ${side === 'red' ? '红' : '黑'}` : ''}
              </Text>
              <Text style={styles.metaDiff}>{inReview ? '引擎建议' : difficulty}</Text>
            </View>
          }
          overlay={
            overlayText ? (
              <Text
                style={[styles.endLabel, inReview && styles.reviewLabel]}
                numberOfLines={inReview ? 2 : 1}
              >
                {overlayText}
              </Text>
            ) : null
          }
          board={
            <View style={styles.boardWrap}>
              <AiPulseDot active={aiThinking || reviewing} />
              <Board
                fen={boardFen}
                flipped={flipped}
                selected={inReview ? null : state.selected}
                legalTargets={inReview ? [] : state.legalTargets}
                hintFrom={inReview ? reviewHint.hintFrom : null}
                hintTo={inReview ? reviewHint.hintTo : null}
                lastMove={boardLastMove}
                onSquarePress={(sq: Square) => {
                  if (inReview || !isHumanTurn(state)) return;
                  setState((prev) => {
                    if (!prev) return prev;
                    const next = selectPlaySquare(prev, sq);
                    playSfxIfMoved(prev.fen, next.fen, next.lastMove);
                    return next;
                  });
                }}
              />
            </View>
          }
          actions={
            inReview
              ? [
                  {
                    key: 'prev',
                    label: '上一步',
                    disabled: reviewPly <= 0,
                    onPress: () => setReviewPly((p) => Math.max(0, p - 1)),
                  },
                  {
                    key: 'next',
                    label: '下一步',
                    disabled: reviewPly >= state.moves.length,
                    onPress: () => {
                      const uci = state.moves[reviewPly];
                      if (uci && reviewFen) playMoveSfx(reviewFen, uci);
                      setReviewPly((p) => Math.min(state.moves.length, p + 1));
                    },
                  },
                  {
                    key: 'exit-review',
                    label: '退出',
                    onPress: () => {
                      setReviewNotes(null);
                      setReviewProgress('');
                    },
                  },
                ]
              : playing
                ? [
                    {
                      key: 'undo',
                      label: '悔棋',
                      disabled: !canUndo(state),
                      onPress: onUndo,
                    },
                    {
                      key: 'resign',
                      label: '认负',
                      onPress: () => setState((prev) => (prev ? resign(prev) : prev)),
                    },
                    {
                      key: 'back',
                      label: backLabel,
                      onPress: goBack,
                    },
                  ]
                : [
                    ...(canUndo(state)
                      ? [{ key: 'undo', label: '悔棋', onPress: onUndo }]
                      : []),
                    {
                      key: 'review',
                      label: reviewing ? '复盘中' : '复盘',
                      primary: true,
                      disabled: reviewing || state.moves.length === 0,
                      onPress: () => void startReview(),
                    },
                    {
                      key: 'again',
                      label: '再来',
                      onPress: () => void restart(),
                    },
                    {
                      key: 'back',
                      label: backLabel,
                      onPress: goBack,
                    },
                  ]
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: wood.stage,
  },
  fallback: {
    flex: 1,
    backgroundColor: wood.stage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: wood.creamSoft,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  metaSide: {
    color: wood.creamSoft,
    fontSize: 12,
    letterSpacing: 4,
  },
  metaDiff: {
    color: wood.creamFaint,
    fontSize: 12,
    letterSpacing: 1,
  },
  endLabel: {
    textAlign: 'center',
    marginTop: 8,
    color: wood.cream,
    fontSize: 20,
    fontWeight: '200',
    letterSpacing: 8,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 1,
    lineHeight: 20,
    opacity: 0.92,
  },
  boardWrap: {
    position: 'relative',
  },
  pulseDot: {
    position: 'absolute',
    top: -6,
    right: 12,
    zIndex: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: wood.cream,
  },
});
