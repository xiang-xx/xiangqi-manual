import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Pattern,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { boardFromFen } from '../lib/engine';
import { squareFromIndices, type Square } from '../lib/squares';
import { PieceView } from './PieceView';

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

  const pad = width * 0.055;
  const boardW = width > 0 ? width - pad * 2 : 0;
  const cell = boardW / 8;
  const boardH = cell * 9;
  const height = boardH + pad * 2;
  const pieceSize = cell * 0.86;

  const xAt = (file: number) => pad + file * cell;
  const yAt = (rankIndex: number) => pad + rankIndex * cell;

  return (
    <View
      style={[styles.wrap, width > 0 ? { width, height } : styles.flex]}
      onLayout={(e) => {
        if (widthProp == null) {
          setMeasured(e.nativeEvent.layout.width);
        }
      }}
    >
      {width > 0 && (
        <>
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="woodbg" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#E8C99A" />
                <Stop offset="45%" stopColor="#D4A574" />
                <Stop offset="100%" stopColor="#C4956A" />
              </LinearGradient>
              <Pattern id="grain" width="36" height="36" patternUnits="userSpaceOnUse">
                <Path
                  d="M0 18 Q9 16 18 20 T36 18"
                  stroke="#B8845A"
                  strokeWidth="0.8"
                  fill="none"
                  opacity="0.35"
                />
              </Pattern>
            </Defs>
            <Rect width={width} height={height} rx={12} fill="url(#woodbg)" />
            <Rect width={width} height={height} rx={12} fill="url(#grain)" />
            <Rect
              x={pad * 0.45}
              y={pad * 0.45}
              width={width - pad * 0.9}
              height={height - pad * 0.9}
              rx={6}
              fill="#E8D5B0"
              stroke="#5D4037"
              strokeWidth={3}
            />

            {Array.from({ length: COLS }, (_, f) =>
              f === 0 || f === 8 ? (
                <Line
                  key={`v-${f}`}
                  x1={xAt(f)}
                  y1={yAt(0)}
                  x2={xAt(f)}
                  y2={yAt(9)}
                  stroke="#3E2723"
                  strokeWidth={2.5}
                />
              ) : (
                <G key={`v-${f}`}>
                  <Line
                    x1={xAt(f)}
                    y1={yAt(0)}
                    x2={xAt(f)}
                    y2={yAt(4)}
                    stroke="#4E342E"
                    strokeWidth={1.5}
                  />
                  <Line
                    x1={xAt(f)}
                    y1={yAt(5)}
                    x2={xAt(f)}
                    y2={yAt(9)}
                    stroke="#4E342E"
                    strokeWidth={1.5}
                  />
                </G>
              ),
            )}

            {Array.from({ length: ROWS }, (_, r) => (
              <Line
                key={`h-${r}`}
                x1={xAt(0)}
                y1={yAt(r)}
                x2={xAt(8)}
                y2={yAt(r)}
                stroke="#4E342E"
                strokeWidth={r === 0 || r === 9 ? 2.5 : 1.5}
              />
            ))}

            <Line x1={xAt(3)} y1={yAt(0)} x2={xAt(5)} y2={yAt(2)} stroke="#4E342E" strokeWidth={1.5} />
            <Line x1={xAt(5)} y1={yAt(0)} x2={xAt(3)} y2={yAt(2)} stroke="#4E342E" strokeWidth={1.5} />
            <Line x1={xAt(3)} y1={yAt(7)} x2={xAt(5)} y2={yAt(9)} stroke="#4E342E" strokeWidth={1.5} />
            <Line x1={xAt(5)} y1={yAt(7)} x2={xAt(3)} y2={yAt(9)} stroke="#4E342E" strokeWidth={1.5} />

            <SvgText
              x={width / 2}
              y={(yAt(4) + yAt(5)) / 2 + 5}
              textAnchor="middle"
              fill="#5D4037"
              opacity={0.5}
              fontSize={Math.max(12, cell * 0.32)}
              fontWeight="600"
            >
              楚 河　　汉 界
            </SvgText>
          </Svg>

          {Array.from({ length: ROWS }, (_, rankIndex) =>
            Array.from({ length: COLS }, (_, file) => {
              const square = squareFromIndices(file, rankIndex);
              const piece = grid[rankIndex][file];
              const isSelected = selected === square;
              const isTarget = targetSet.has(square);
              const isHint = hintFrom === square || hintTo === square;
              const isLast =
                lastMove != null && (lastMove.from === square || lastMove.to === square);

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
                  }}
                >
                  {(isSelected || isLast || isHint) && (
                    <View
                      style={[
                        styles.highlight,
                        {
                          width: cell * 0.92,
                          height: cell * 0.92,
                          borderRadius: 6,
                          backgroundColor: isHint
                            ? 'rgba(46, 125, 50, 0.35)'
                            : isSelected
                              ? 'rgba(255, 193, 7, 0.45)'
                              : 'rgba(121, 85, 72, 0.28)',
                        },
                      ]}
                    />
                  )}
                  {isTarget && !piece && (
                    <View
                      style={{
                        width: cell * 0.22,
                        height: cell * 0.22,
                        borderRadius: cell,
                        backgroundColor: 'rgba(46, 125, 50, 0.55)',
                      }}
                    />
                  )}
                  {isTarget && piece ? (
                    <View
                      style={{
                        position: 'absolute',
                        width: pieceSize,
                        height: pieceSize,
                        borderRadius: pieceSize / 2,
                        borderWidth: 3,
                        borderColor: 'rgba(46, 125, 50, 0.7)',
                      }}
                    />
                  ) : null}
                  {piece ? <PieceView piece={piece} size={pieceSize} /> : null}
                </Pressable>
              );
            }),
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  flex: {
    width: '100%',
    aspectRatio: 0.9,
  },
  highlight: {
    position: 'absolute',
  },
});
