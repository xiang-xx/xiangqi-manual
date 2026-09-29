import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import {
  Easing,
  runOnJS,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { boardFromFen } from '../lib/engine';
import { BOARD_WOOD } from '../lib/pieceAssets';
import type { BoardPiece } from '../lib/pieces';
import { indicesFromSquare, squareFromIndices, type Square } from '../lib/squares';
import { wood } from '../lib/theme';
import { FlyingPiece, LIFT_UP_MS, MOVE_EASING, MOVE_MS, PieceView, SLAM_MS } from './PieceView';

type Props = {
  fen: string;
  /** true = 黑方在下（背黑视角） */
  flipped?: boolean;
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

/** 红方纵线：己方右→左 一…九；逻辑 file 8=i 为一路 */
const RED_FILE_LABELS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'] as const;

type Flight = {
  piece: BoardPiece;
  from: Square;
  to: Square;
};

export function Board({
  fen,
  flipped = false,
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

  // 尽量满宽：窄外框 + 够用的盘缘（棋子不贴边），立体底边不占格宽
  const padX = width * 0.062;
  const boardW = width > 0 ? width - padX * 2 : 0;
  const cell = boardW / 8;
  const pieceSize = cell * 0.9;
  const coordSize = Math.max(10, cell * 0.22);
  const padY = pieceSize * 0.5 + coordSize * 1.4 + Math.max(10, width * 0.02);
  const plateH = cell * 9 + padY * 2;
  const radius = Math.max(12, width * 0.032);
  const thickness = Math.max(9, width * 0.026);
  const shadowH = Math.max(10, width * 0.026);
  const height = plateH + thickness + shadowH * 0.45;

  // 逻辑坐标 → 屏幕坐标（翻转时 180° 旋转盘面，汉字朝向不变）
  const displayFile = (file: number) => (flipped ? 8 - file : file);
  const displayRank = (rankIndex: number) => (flipped ? 9 - rankIndex : rankIndex);
  const xAt = (file: number) => padX + displayFile(file) * cell;
  const yAt = (rankIndex: number) => padY + displayRank(rankIndex) * cell;

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
  const flyLift = useSharedValue(0);

  const clearFlight = () => setFlight(null);

  // 翻转时中断飞子，避免落点错位
  useEffect(() => {
    setFlight(null);
  }, [flipped]);

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
    flyScale.value = 1;
    flyLift.value = 0;
    setFlight({ piece: moving, from: lastMove.from, to: lastMove.to });

    // 1) 提起
    flyLift.value = withTiming(1, {
      duration: LIFT_UP_MS,
      easing: Easing.out(Easing.cubic),
    });
    flyScale.value = withTiming(1.12, {
      duration: LIFT_UP_MS,
      easing: Easing.out(Easing.cubic),
    });

    // 2) 空中平移（提起稍后再动）
    const travel = { duration: MOVE_MS, easing: MOVE_EASING };
    flyX.value = withDelay(LIFT_UP_MS * 0.55, withTiming(toPos.x, travel));
    flyY.value = withDelay(
      LIFT_UP_MS * 0.55,
      withTiming(toPos.y, travel, (finished) => {
        if (!finished) return;
        // 3) 拍下：快速落下 + 挤压回弹
        flyLift.value = withTiming(0, {
          duration: SLAM_MS,
          easing: Easing.in(Easing.cubic),
        });
        flyScale.value = withSequence(
          withTiming(0.86, {
            duration: SLAM_MS * 0.55,
            easing: Easing.in(Easing.quad),
          }),
          withTiming(1.06, {
            duration: 48,
            easing: Easing.out(Easing.cubic),
          }),
          withTiming(1, { duration: 40, easing: Easing.inOut(Easing.quad) }, (done) => {
            if (done) runOnJS(clearFlight)();
          }),
        );
      }),
    );
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
          {/* 落桌投影 */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: width * 0.06,
              right: width * 0.06,
              top: plateH + thickness * 0.45,
              height: shadowH,
              borderRadius: radius,
              backgroundColor: 'rgba(18, 8, 2, 0.22)',
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: width * 0.14,
              right: width * 0.14,
              top: plateH + thickness * 0.7,
              height: shadowH * 0.5,
              borderRadius: radius,
              backgroundColor: 'rgba(18, 8, 2, 0.1)',
            }}
          />

          {/* 浅色实木盘体：盘面 + 底边厚度 */}
          <View
            style={{
              width,
              borderRadius: radius,
              overflow: 'hidden',
            }}
          >
            <View style={{ width, height: plateH }}>
              <ImageBackground
                source={BOARD_WOOD}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              >
                <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.faceWash]} />
                <Svg width={width} height={plateH}>
                  {Array.from({ length: COLS }, (_, f) => {
                    const x = padX + f * cell;
                    return f === 0 || f === 8 ? (
                      <Line
                        key={`v-${f}`}
                        x1={x}
                        y1={padY}
                        x2={x}
                        y2={padY + cell * 9}
                        stroke="#5A3A20"
                        strokeWidth={1.8}
                        strokeOpacity={0.88}
                      />
                    ) : (
                      <G key={`v-${f}`}>
                        <Line
                          x1={x}
                          y1={padY}
                          x2={x}
                          y2={padY + cell * 4}
                          stroke="#6B4A2A"
                          strokeWidth={1.1}
                          strokeOpacity={0.8}
                        />
                        <Line
                          x1={x}
                          y1={padY + cell * 5}
                          x2={x}
                          y2={padY + cell * 9}
                          stroke="#6B4A2A"
                          strokeWidth={1.1}
                          strokeOpacity={0.8}
                        />
                      </G>
                    );
                  })}

                  {Array.from({ length: ROWS }, (_, r) => (
                    <Line
                      key={`h-${r}`}
                      x1={padX}
                      y1={padY + r * cell}
                      x2={padX + cell * 8}
                      y2={padY + r * cell}
                      stroke="#6B4A2A"
                      strokeWidth={r === 0 || r === 9 ? 1.8 : 1.1}
                      strokeOpacity={r === 0 || r === 9 ? 0.88 : 0.8}
                    />
                  ))}

                  <Line
                    x1={padX + cell * 3}
                    y1={padY}
                    x2={padX + cell * 5}
                    y2={padY + cell * 2}
                    stroke="#6B4A2A"
                    strokeWidth={1.1}
                    strokeOpacity={0.8}
                  />
                  <Line
                    x1={padX + cell * 5}
                    y1={padY}
                    x2={padX + cell * 3}
                    y2={padY + cell * 2}
                    stroke="#6B4A2A"
                    strokeWidth={1.1}
                    strokeOpacity={0.8}
                  />
                  <Line
                    x1={padX + cell * 3}
                    y1={padY + cell * 7}
                    x2={padX + cell * 5}
                    y2={padY + cell * 9}
                    stroke="#6B4A2A"
                    strokeWidth={1.1}
                    strokeOpacity={0.8}
                  />
                  <Line
                    x1={padX + cell * 5}
                    y1={padY + cell * 7}
                    x2={padX + cell * 3}
                    y2={padY + cell * 9}
                    stroke="#6B4A2A"
                    strokeWidth={1.1}
                    strokeOpacity={0.8}
                  />

                  <SvgText
                    x={width / 2 - cell * 1.5}
                    y={padY + cell * 4.52}
                    textAnchor="middle"
                    fill="#5C3D22"
                    opacity={0.36}
                    fontSize={Math.max(13, cell * 0.34)}
                    fontWeight="600"
                  >
                    楚 河
                  </SvgText>
                  <SvgText
                    x={width / 2 + cell * 1.5}
                    y={padY + cell * 4.52}
                    textAnchor="middle"
                    fill="#5C3D22"
                    opacity={0.36}
                    fontSize={Math.max(13, cell * 0.34)}
                    fontWeight="600"
                  >
                    汉 界
                  </SvgText>
                </Svg>
              </ImageBackground>

              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius: radius,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: 'rgba(90, 55, 25, 0.18)',
                  },
                ]}
              />

              {/* 落点标记：绝对定位在交叉点中心，避免被布局挤偏 */}
              {Array.from({ length: ROWS }, (_, rankIndex) =>
                Array.from({ length: COLS }, (_, file) => {
                  const square = squareFromIndices(file, rankIndex);
                  const piece = grid[rankIndex][file];
                  const isTarget = targetSet.has(square);
                  const isHint = hintFrom === square || hintTo === square;
                  const isLastFrom = lastMove != null && lastMove.from === square;
                  const isLastTo = lastMove != null && lastMove.to === square;
                  if (!isTarget && !isHint && !isLastFrom && !isLastTo) return null;

                  const cx = xAt(file);
                  const cy = yAt(rankIndex);
                  const dot = cell * 0.18;
                  const toHalo = pieceSize * 1.12;
                  const fromRing = cell * 0.4;
                  const fromCore = cell * 0.13;
                  const markBox = Math.max(markSize, toHalo, fromRing * 1.4);

                  return (
                    <View
                      key={`mark-${square}`}
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        left: cx - markBox / 2,
                        top: cy - markBox / 2,
                        width: markBox,
                        height: markBox,
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                      }}
                    >
                      {isLastTo && (
                        <Svg width={toHalo} height={toHalo} style={{ position: 'absolute' }}>
                          <Defs>
                            <RadialGradient id={`lastTo-${square}`} cx="50%" cy="50%" r="50%">
                              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.08} />
                              <Stop offset="70%" stopColor="#FFFFFF" stopOpacity={0.12} />
                              <Stop offset="88%" stopColor="#FFFFFF" stopOpacity={0.35} />
                              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                            </RadialGradient>
                          </Defs>
                          <Circle
                            cx={toHalo / 2}
                            cy={toHalo / 2}
                            r={toHalo / 2}
                            fill={`url(#lastTo-${square})`}
                          />
                          <Circle
                            cx={toHalo / 2}
                            cy={toHalo / 2}
                            r={toHalo * 0.47}
                            fill="none"
                            stroke="rgba(255,255,255,0.78)"
                            strokeWidth={Math.max(1, cell * 0.014)}
                          />
                        </Svg>
                      )}
                      {isLastFrom && (
                        <View
                          style={{
                            position: 'absolute',
                            width: fromRing,
                            height: fromRing,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Svg width={fromRing} height={fromRing}>
                            <Defs>
                              <RadialGradient id={`lastFrom-${square}`} cx="50%" cy="50%" r="50%">
                                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
                                <Stop offset="35%" stopColor="#FFFFFF" stopOpacity={0.95} />
                                <Stop offset="70%" stopColor="#FFFFFF" stopOpacity={0.25} />
                                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                              </RadialGradient>
                            </Defs>
                            <Circle
                              cx={fromRing / 2}
                              cy={fromRing / 2}
                              r={fromRing * 0.48}
                              fill="none"
                              stroke="rgba(255,255,255,0.55)"
                              strokeWidth={Math.max(1.2, cell * 0.022)}
                            />
                            <Circle
                              cx={fromRing / 2}
                              cy={fromRing / 2}
                              r={fromCore}
                              fill={`url(#lastFrom-${square})`}
                            />
                          </Svg>
                        </View>
                      )}
                      {isHint && (
                        <View
                          style={{
                            position: 'absolute',
                            width: markSize,
                            height: markSize,
                            borderRadius: markSize / 2,
                            backgroundColor: 'rgba(180, 120, 50, 0.3)',
                          }}
                        />
                      )}
                      {isTarget && !piece && (
                        <View
                          style={{
                            width: dot,
                            height: dot,
                            borderRadius: dot,
                            backgroundColor: 'rgba(120, 70, 30, 0.45)',
                          }}
                        />
                      )}
                      {isTarget && piece ? (
                        <View
                          style={{
                            position: 'absolute',
                            width: pieceSize * 1.02,
                            height: pieceSize * 1.02,
                            borderRadius: pieceSize,
                            borderWidth: 2,
                            borderColor: 'rgba(140, 80, 35, 0.55)',
                          }}
                        />
                      ) : null}
                    </View>
                  );
                }),
              )}

              {Array.from({ length: ROWS }, (_, rankIndex) =>
                Array.from({ length: COLS }, (_, file) => {
                  const square = squareFromIndices(file, rankIndex);
                  const piece = grid[rankIndex][file];
                  const isSelected = selected === square;
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
                        zIndex: isSelected ? 5 : 3,
                      }}
                    >
                      {piece && !hidePiece ? (
                        <PieceView piece={piece} size={pieceSize} lifted={isSelected} />
                      ) : null}
                    </Pressable>
                  );
                }),
              )}

              {/* 路数：钳在盘面内边，避开棋子与盘外溢出 */}
              <Svg
                pointerEvents="none"
                width={width}
                height={plateH}
                style={{ position: 'absolute', left: 0, top: 0, zIndex: 6 }}
              >
                {Array.from({ length: COLS }, (_, file) => {
                  const x = xAt(file);
                  const outsideTop = coordSize * 0.88;
                  const outsideBottom = plateH - Math.max(3, coordSize * 0.28);
                  const redY = flipped ? outsideTop : outsideBottom;
                  const blackY = flipped ? outsideBottom : outsideTop;
                  return (
                    <G key={`coord-${file}`}>
                      <SvgText
                        x={x}
                        y={redY}
                        textAnchor="middle"
                        fill="#5C3D22"
                        opacity={0.32}
                        fontSize={coordSize}
                        fontWeight="500"
                      >
                        {RED_FILE_LABELS[8 - file]}
                      </SvgText>
                      <SvgText
                        x={x}
                        y={blackY}
                        textAnchor="middle"
                        fill="#5C3D22"
                        opacity={0.32}
                        fontSize={coordSize}
                        fontWeight="500"
                      >
                        {String(file + 1)}
                      </SvgText>
                    </G>
                  );
                })}
              </Svg>

              {flight ? (
                <FlyingPiece
                  piece={flight.piece}
                  size={pieceSize}
                  translateX={flyX}
                  translateY={flyY}
                  scale={flyScale}
                  lift={flyLift}
                />
              ) : null}
            </View>

            {/* 底边厚度：同色浅木，单层略压暗 */}
            <View style={{ height: thickness, overflow: 'hidden' }}>
              <Image
                source={BOARD_WOOD}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.edgeWash]} />
            </View>
          </View>
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
    aspectRatio: 8 / 10.2,
  },
  faceWash: {
    backgroundColor: wood.boardWash,
  },
  edgeWash: {
    backgroundColor: wood.edgeWash,
  },
});
