/** 全 App 共用色板：宣纸列表 + 蜜黄棋盘 / 绒毡台面 */

export const ink = {
  deep: '#1C2B22',
  soft: '#5F6B62',
  faint: '#8E978F',
  rule: 'rgba(28, 43, 34, 0.12)',
  wash: '#F1E9DA',
  chip: 'rgba(28, 43, 34, 0.06)',
} as const;

export const wood = {
  /**
   * 棋盘页台面与顶栏：干净绒毡绿（参考天天象棋桌面），
   * 不用深色木纹图。
   */
  stage: '#456355',
  header: '#456355',
  lacquer: '#456355',
  cream: '#F3E6C8',
  creamSoft: 'rgba(243, 230, 200, 0.78)',
  creamFaint: 'rgba(243, 230, 200, 0.48)',
  gold: '#E0C080',
  goldSoft: 'rgba(224, 192, 128, 0.45)',
  /** 盘面：天天象棋式蜜黄，提亮不压暗 */
  boardWash: 'rgba(255, 226, 170, 0.22)',
  /** 底边厚度：单色略压暗 */
  edgeWash: 'rgba(120, 78, 36, 0.16)',
  danger: '#E8B4A0',
} as const;
