export type PieceColor = 'r' | 'b';
export type PieceType = 'k' | 'a' | 'b' | 'n' | 'r' | 'c' | 'p';

export type BoardPiece = {
  type: PieceType;
  color: PieceColor;
};

const RED_LABELS: Record<PieceType, string> = {
  k: '帅',
  a: '仕',
  b: '相',
  n: '马',
  r: '车',
  c: '炮',
  p: '兵',
};

const BLACK_LABELS: Record<PieceType, string> = {
  k: '将',
  a: '士',
  b: '象',
  n: '馬',
  r: '车',
  c: '炮',
  p: '卒',
};

export function pieceLabel(piece: BoardPiece): string {
  return piece.color === 'r' ? RED_LABELS[piece.type] : BLACK_LABELS[piece.type];
}

export function pieceAssetId(piece: BoardPiece): string {
  return `${piece.color}${piece.type.toUpperCase()}`;
}
