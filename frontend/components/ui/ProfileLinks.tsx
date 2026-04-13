interface TelegramLinkProps {
  username: string;
  className?: string;
}

/**
 * Кликабельная ссылка на Telegram пользователя (@username).
 * Если username пустой — ничего не рендерит.
 */
export function TelegramLink({ username, className = '' }: TelegramLinkProps) {
  if (!username) return null;

  const clean = username.startsWith('@') ? username.slice(1) : username;

  return (
    <a
      href={`https://t.me/${clean}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-foreground hover:underline transition-colors ${className}`}
    >
      @{clean}
    </a>
  );
}

interface VKProfileLinkProps {
  url: string;
  name: string;
  className?: string;
}

/**
 * Кликабельная ссылка на профиль VK пользователя (Имя Фамилия).
 * Если url пустой — просто выводит имя без ссылки.
 */
export function VKProfileLink({ url, name, className = '' }: VKProfileLinkProps) {
  if (!name) return null;

  if (!url) {
    return <span className={className}>{name}</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-foreground hover:underline transition-colors ${className}`}
    >
      {name}
    </a>
  );
}
