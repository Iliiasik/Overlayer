const NOTES_PREFIX = 'notes:';
const QUICK_PREFIX = 'quick:';

const PROJECT_PATH_HOSTS = ['github.io', 'gitlab.io', 'gitee.io'];

export function hashPath(path: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < path.length; i++) {
    hash ^= path.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function routeHash(hash: string): string {
  const value = hash.startsWith('#') ? hash.slice(1) : hash;
  return value.includes('/') ? hash : '';
}

export function pagePath(url: string): string {
  const { pathname, search, hash } = new URL(url);
  return pathname + search + routeHash(hash);
}

export function pageKeyForUrl(url: string): string {
  const { origin } = new URL(url);
  return `${NOTES_PREFIX}${origin}:${hashPath(pagePath(url))}`;
}

function firstPathSegment(pathname: string): string {
  const segment = pathname.split('/').find((part) => part.length > 0);
  return segment ? `/${segment}` : '';
}

export function boardDomainForUrl(url: string): string {
  const { protocol, hostname, pathname } = new URL(url);
  if (protocol === 'file:') return `file:${pathname}`;
  const host = hostname.replace(/^www\./, '') || hostname;
  if (PROJECT_PATH_HOSTS.some((suffix) => host.endsWith(`.${suffix}`))) {
    return `${host}${firstPathSegment(pathname)}`;
  }
  return host;
}

export function baseUrlForDomain(domain: string, origin?: string): string {
  if (domain.startsWith('file:')) return `file://${domain.slice('file:'.length)}`;
  const slash = domain.indexOf('/');
  if (slash === -1) return origin ? `${origin}/` : `https://${domain}/`;
  const base = origin ?? `https://${domain.slice(0, slash)}`;
  return `${base}/${domain.slice(slash + 1)}/`;
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
