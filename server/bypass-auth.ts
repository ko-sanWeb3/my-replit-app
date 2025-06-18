import type { Express, RequestHandler } from "express";

// Replit認証を完全にバイパスするミドルウェア
export function createAuthBypass(): RequestHandler {
  return (req: any, res: any, next: any) => {
    // すべてのリクエストを認証済みとして扱う
    req.isAuthenticated = () => true;
    req.user = {
      claims: {
        sub: "guest_user",
        email: "guest@example.com",
        first_name: "Guest",
        last_name: "User",
        profile_image_url: null
      },
      access_token: "guest_token",
      refresh_token: null,
      expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24時間後
    };
    
    // セッションオブジェクトを作成
    req.session = {
      save: (cb: any) => cb && cb(),
      regenerate: (cb: any) => cb && cb(),
      destroy: (cb: any) => cb && cb(),
      reload: (cb: any) => cb && cb(),
      resetMaxAge: () => {},
      touch: () => {},
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false
      },
      id: "guest_session",
      passport: {
        user: req.user
      }
    };
    
    next();
  };
}

// 認証関連のHTTPヘッダーをクリア
export function clearAuthHeaders(): RequestHandler {
  return (req: any, res: any, next: any) => {
    // Replit認証ヘッダーを削除
    if (req.headers) {
      delete req.headers['x-replit-user-id'];
      delete req.headers['x-replit-user-name'];
      delete req.headers['x-replit-user-email'];
      delete req.headers['replit-authed'];
      delete req.headers['authorization'];
      
      // 認証Cookieをクリア
      if (req.headers.cookie) {
        req.headers.cookie = req.headers.cookie
          .split(';')
          .filter((cookie: string) => !cookie.trim().toLowerCase().includes('auth'))
          .join(';');
      }
    }
    
    // レスポンスヘッダーで認証をオーバーライド
    res.setHeader('X-Auth-Bypass', 'true');
    res.setHeader('X-Guest-Mode', 'enabled');
    
    next();
  };
}