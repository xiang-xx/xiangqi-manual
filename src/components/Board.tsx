import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import {
  Easing,
  runOnJS,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Line, Text as SvgText } from 'react-native-svg';

import { boardFromFen } from '../lib/engine';
import { BOARD_WOOD, TABLE_WOOD } from '../lib/pieceAssets';
import type { BoardPiece } from '../lib/pieces';
import { indicesFromSquare, squareFromIndices, type Square } from '../lib/squares';
import { FlyingPiece, MOVE_MS, PieceView } from './PieceView';

type Props = {
  fen: string;
  selected?: Square | null;
  legalTargets?: Square[];
  hintFrom?: Square | null;
  hintTo?: Square | null;
  lastMove?: { from: Square; to: Square } | null;
  onSquarePress?: (square: Square) => void;
  width?: number;
};

const ROWS = 10;
const COLS = 9;

type Flight = {
  piece: BoardPiece;
  from: Square;
  to: Square;
};

export function Board({
  fen,
  selected = null,
  legalTargets = [],
  hintFrom = null,
  hintTo = null,
  lastMove = null,
  onSquarePress,
  width: widthProp,
}: Props) {
  const [measured, setMeasured] = useState(0);
  const width = widthProp ?? measured;
  const grid = useMemo(() => boardFromFen(fen), [fen]);
  const targetSet = useMemo(() => new Set(legalTargets), [legalTargets]);

  // 窄边框，棋盘尽量撑满，棋子更大好点
  const pad = width * 0.038;
  const boardW = width > 0 ? width - pad * 2 : 0;
  const cell = boardW / 8;
  const boardH = cell * 9;
  const height = boardH + pad * 2;
  const pieceSize = cell * 0.94;
  const faceInset = pad * 0.35;

  const xAt = (file: number) => pad + file * cell;
  const yAt = (rankIndex: number) => pad + rankIndex * cell;

  const pieceOrigin = (square: Square) => {
    const { file, rankIndex } = indicesFromSquare(square);
    return {
      x: xAt(file) - pieceSize / 2,
      y: yAt(rankIndex) - pieceSize / 2,
    };
  };

  const [flight, setFlight] = useState<Flight | null>(null);
  const prevFenRef = useRef(fen);
  const flyX = useSharedValue(0);
  const flyY = useSharedValue(0);
  const flyScale = useSharedValue(1);

  const clearFlight = () => setFlight(null);

  useEffect(() => {
    if (width <= 0) return;
    if (!lastMove || prevFenRef.current === fen) {
      prevFenRef.current = fen;
      return;
    }

    const prevGrid = boardFromFen(prevFenRef.current);
    const { file, rankIndex } = indicesFromSquare(lastMove.from);
    const moving = prevGrid[rankIndex]?.[file];
    prevFenRef.current = fen;
    if (!moving) return;

    const fromPos = pieceOrigin(lastMove.from);
    const toPos = pieceOrigin(lastMove.to);
    flyX.value = fromPos.x;
    flyY.value = fromPos.y;
    flyScale.value = 1.06;
    setFlight({ piece: moving, from: lastMove.from, to: lastMove.to });

    const ease = { duration: MOVE_MS, easing: Easing.out(Easing.cubic) };
    flyX.value = withTiming(toPos.x, ease);
    flyY.value = withTiming(toPos.y, ease, (finished) => {
      if (!finished) return;
      flyScale.value = withSequence(
        withTiming(0.97, { duration: 45 }),
        withTiming(1, { duration: 60 }, (done) => {
          if (done) runOnJS(clearFlight)();
        }),
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, lastMove, width, cell, pieceSize]);

  const hideSquare =
    flight != null ? new Set<Square>([flight.from, flight.to]) : new Set<Square>();

  const markSize = pieceSize * 0.98;

  return (
    <View
      style={[styles.wrap, width > 0 ? { width, height } : styles.flex]}
      onLayout={(e) => {
        if (widthProp == null) setMeasured(e.nativeEvent.layout.width);
      }}
    >
      {width > 0 && (
        <>
          <Image
            source={TABLE_WOOD}
            style={[StyleSheet.absoluteFill, { borderRadius: 8 }]}
            resizeMode="cover"
          />

          <ImageBackground
            source={BOARD_WOOD}
            style={{
              position: 'absolute',
              left: faceInset,
              top: faceInset,
              width: width - faceInset * 2,
              height: height - faceInset * 2,
              borderRadius: 3,
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: '#4A3018',
            }}
            resizeMode="cover"
          >
            <Svg width={width - faceInset * 2} height={height - faceInset * 2}>
              {Array.from({ length: COLS }, (_, f) => {
                const x = pad - faceInset + f * cell;
                return f === 0 || f === 8 ? (
                  <Line
                    key={`v-${f}`}
                    x1={x}
                    y1={pad - faceInset}
                    x2={x}
                    y2={pad - faceInset + cell * 9}
                    stroke="#4A2F18"
                    strokeWidth={1.8}
                  />
                ) : (
                  <G key={`v-${f}`}>
                    <Line
                      x1={x}
                      y1={pad - faceInset}
                      x2={x}
                      y2={pad - faceInset + cell * 4}
                      stroke="#5C3D22"
                      strokeWidth={1.1}
                    />
                    <Line
                      x1={x}
                      y1={pad - faceInset + cell * 5}
                      x2={x}
                      y2={pad - faceInset + cell * 9}
                      stroke="#5C3D22"
                      strokeWidth={1.1}
                    />
                  </G>
                );
              })}

              {Array.from({ length: ROWS }, (_, r) => (
                <Line
                  key={`h-${r}`}
                  x1={pad - faceInset}
                  y1={pad - faceInset + r * cell}
                  x2={pad - faceInset + cell * 8}
                  y2={pad - faceInset + r * cell}
                  stroke="#5C3D22"
                  strokeWidth={r === 0 || r === 9 ? 1.8 : 1.1}
                />
              ))}

              <Line
                x1={pad - faceInset + cell * 3}
                y1={pad - faceInset}
                x2={pad - faceInset + cell * 5}
                y2={pad - faceInset + cell * 2}
                stroke="#5C3D22"
                strokeWidth={1.1}
              />
              <Line
                x1={pad - faceInset + cell * 5}
                y1={pad - faceInset}
                x2={pad - faceInset + cell * 3}
                y2={pad - faceInset + cell * 2}
                stroke="#5C3D22"
                strokeWidth={1.1}
              />
              <Line
                x1={pad - faceInset + cell * 3}
                y1={pad - faceInset + cell * 7}
                x2={pad - faceInset + cell * 5}
                y2={pad - faceInset + cell * 9}
                stroke="#5C3D22"
                strokeWidth={1.1}
              />
              <Line
                x1={pad - faceInset + cell * 5}
                y1={pad - faceInset + cell * 7}
                x2={pad - faceInset + cell * 3}
                y2={pad - faceInset + cell * 9}
                stroke="#5C3D22"
                strokeWidth={1.1}
              />

              <SvgText
                x={(width - faceInset * 2) / 2 - cell * 1.5}
                y={pad - faceInset + cell * 4.52}
                textAnchor="middle"
                fill="#6B4A2A"
                opacity={0.42}
                fontSize={Math.max(13, cell * 0.34)}
                fontWeight="600"
              >
                楚 河
              </SvgText>
              <SvgText
                x={(width - faceInset * 2) / 2 + cell * 1.5}
                y={pad - faceInset + cell * 4.52}
                textAnchor="middle"
                fill="#6B4A2A"
                opacity={0.42}
                fontSize={Math.max(13, cell * 0.34)}
                fontWeight="600"
              >
                汉 界
              </SvgText>
            </Svg>
          </ImageBackground>

          {Array.from({ length: ROWS }, (_, rankIndex) =>
            Array.from({ length: COLS }, (_, file) => {
              const square = squareFromIndices(file, rankIndex);
              const piece = grid[rankIndex][file];
              const isSelected = selected === square;
              const isTarget = targetSet.has(square);
              const isHint = hintFrom === square || hintTo === square;
              const isLast =
                lastMove != null && (lastMove.from === square || lastMove.to === square);
              const hidePiece = piece != null && hideSquare.has(square);

              return (
                <Pressable
                  key={square}
                  onPress={() => onSquarePress?.(square)}
                  style={{
                    position: 'absolute',
                    left: xAt(file) - cell / 2,
                    top: yAt(rankIndex) - cell / 2,
                    width: cell,
                    height: cell,
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: isSelected ? 5 : 1,
                  }}
                >
                  {isLast && !isSelected && (
                    <View
                      style={{
                        position: 'absolute',
                        width: markSize,
                        height: markSize,
                        borderRadius: markSize / 2,
                        backgroundColor: 'rgba(201, 146, 60, 0.28)',
                      }}
                    />
                  )}
                  {isHint && (
                    <View
                      style={{
                        position: 'absolute',
                        width: markSize,
                        height: markSize,
                        borderRadius: markSize / 2,
                        backgroundColor: 'rgba(56, 142, 60, 0.28)',
                      }}
                    />
                  )}
                  {isSelected && (
                    <View
                      style={{
                        position: 'absolute',
                        width: pieceSize * 1.06,
                        height: pieceSize * 1.06,
                        borderRadius: pieceSize,
                        borderWidth: 2.5,
                        borderColor: 'rgba(46, 125, 50, 0.95)',
                        backgroundColor: 'rgba(76, 175, 80, 0.12)',
                      }}
                    />
                  )}
                  {isTarget && !piece && (
                    <View
                      style={{
                        width: cell * 0.22,
                        height: cell * 0.22,
                        borderRadius: cell,
                        backgroundColor: 'rgba(56, 142, 60, 0.5)',
                      }}
                    />
                  )}
                  {isTarget && piece ? (
                    <View
                      style={{
                        position: 'absolute',
                        width: pieceSize * 1.04,
                        height: pieceSize * 1.04,
                        borderRadius: pieceSize,
                        borderWidth: 2.5,
                        borderColor: 'rgba(56, 142, 60, 0.85)',
                      }}
                    />
                  ) : null}
                  {piece && !hidePiece ? (
                    <PieceView piece={piece} size={pieceSize} lifted={isSelected} />
                  ) : null}
                </Pressable>
              );
            }),
          )}

          {flight ? (
            <FlyingPiece
              piece={flight.piece}
              size={pieceSize}
              translateX={flyX}
              translateY={flyY}
              scale={flyScale}
            />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    overflow: 'visible',
  },
  flex: {
    width: '100%',
    aspectRatio: 0.9,
  },
});
