declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id?: number;
            username?: string;
            first_name?: string;
            last_name?: string;
            language_code?: string;
          };
        };
      };
    };
  }
}

export function getTelegramUser() {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

  return {
    telegramId: user?.id ? String(user.id) : "",
    telegramUsername: user?.username ?? "",
    firstName: user?.first_name ?? "",
    lastName: user?.last_name ?? "",
  };
}

export function getTelegramInitData() {
  return window.Telegram?.WebApp?.initData ?? "";
}

export function initTelegramApp() {
  window.Telegram?.WebApp?.ready?.();
  window.Telegram?.WebApp?.expand?.();
}