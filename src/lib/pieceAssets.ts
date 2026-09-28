import type { ImageSourcePropType } from 'react-native';

import type { BoardPiece } from './pieces';
import { pieceAssetId } from './pieces';

const PIECE_IMAGES: Record<string, ImageSourcePropType> = {
  rK: require('../../assets/pieces/rK.png'),
  rA: require('../../assets/pieces/rA.png'),
  rB: require('../../assets/pieces/rB.png'),
  rN: require('../../assets/pieces/rN.png'),
  rR: require('../../assets/pieces/rR.png'),
  rC: require('../../assets/pieces/rC.png'),
  rP: require('../../assets/pieces/rP.png'),
  bK: require('../../assets/pieces/bK.png'),
  bA: require('../../assets/pieces/bA.png'),
  bB: require('../../assets/pieces/bB.png'),
  bN: require('../../assets/pieces/bN.png'),
  bR: require('../../assets/pieces/bR.png'),
  bC: require('../../assets/pieces/bC.png'),
  bP: require('../../assets/pieces/bP.png'),
};

export function pieceImage(piece: BoardPiece): ImageSourcePropType {
  return PIECE_IMAGES[pieceAssetId(piece)];
}

export const BOARD_WOOD = require('../../assets/board/board-wood.jpg');
export const TABLE_WOOD = require('../../assets/board/table-wood.jpg');
