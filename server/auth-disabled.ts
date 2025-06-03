// 認証システムを完全に無効化 - ゲストアクセスのみ
export function setupNoAuth() {
  // 何も設定しない - 認証なし
}

export const isGuestOnly = (req: any, res: any, next: any) => {
  // すべてのリクエストを許可
  next();
};