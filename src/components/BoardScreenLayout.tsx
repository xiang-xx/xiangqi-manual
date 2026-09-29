import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { BoardActionBar, type BoardAction } from './BoardActionBar';

type Props = {
  /** 顶栏（进度 / 模式），占固定流式高度 */
  header?: ReactNode;
  /** 叠在棋盘上方的说明等，不挤占棋盘垂直位置 */
  overlay?: ReactNode;
  board: ReactNode;
  actions: BoardAction[];
  bottomInset: number;
};

/**
 * 三页棋盘共用：棋盘在剩余区域垂直居中（对齐对弈页），
 * 说明层绝对定位，避免顶栏内容高低不一导致棋盘上下跳。
 */
export function BoardScreenLayout({
  header,
  overlay,
  board,
  actions,
  bottomInset,
}: Props) {
  return (
    <View style={styles.root}>
      {header ? <View style={styles.header}>{header}</View> : null}
      <View style={styles.stage}>
        <View style={styles.boardCenter}>{board}</View>
        {overlay ? (
          <View style={styles.overlay} pointerEvents="box-none">
            {overlay}
          </View>
        ) : null}
      </View>
      <BoardActionBar
        actions={actions}
        style={{
          paddingTop: 6,
          marginBottom: Math.max(bottomInset, 10) + 20,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 6,
    minHeight: 40,
    justifyContent: 'flex-end',
  },
  stage: {
    flex: 1,
    position: 'relative',
  },
  boardCenter: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    paddingHorizontal: 18,
    paddingTop: 4,
  },
});
