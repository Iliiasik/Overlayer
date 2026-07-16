const NOTES_PREFIX = 'notes:';
const QUICK_PREFIX = 'quick:';

export function hashPath(path: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < path.length; i++) {
    hash ^= path.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function pageKeyForUrl(url: string): string {
  const { origin, pathname, search } = new URL(url);
  return `${NOTES_PREFIX}${origin}:${hashPath(pathname + search)}`;
}

export function boardDomainForUrl(url: string): string {
  const { protocol, hostname, pathname } = new URL(url);
  if (protocol === 'file:') return `file:${pathname}`;
  return hostname.replace(/^www\./, '') || hostname;
}

export function quickKeyForUrl(url: string): string {
  return `${QUICK_PREFIX}${boardDomainForUrl(url)}`;
}

export function isNotesKey(key: string): boolean {
  return key.startsWith(NOTES_PREFIX);
}

export function isQuickKey(key: string): boolean {
  return key.startsWith(QUICK_PREFIX);
}

export function isAnnotatableUrl(url: string | undefined): url is string {
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:' || protocol === 'file:';
  } catch {
    return false;
  }
}
