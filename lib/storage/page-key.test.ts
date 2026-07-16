import { describe, expect, it } from 'vitest';
import {
  boardDomainForUrl,
  hashPath,
  isAnnotatableUrl,
  isNotesKey,
  isQuickKey,
  pageKeyForUrl,
  quickKeyForUrl,
} from './page-key';

describe('hashPath', () => {
  it('returns a stable 8-char hex hash', () => {
    expect(hashPath('/docs/intro')).toBe(hashPath('/docs/intro'));
    expect(hashPath('/docs/intro')).toMatch(/^[0-9a-f]{8}$/);
  });

  it('differs for different paths', () => {
    expect(hashPath('/a')).not.toBe(hashPath('/b'));
  });
});

describe('pageKeyForUrl', () => {
  it('builds a key from origin and path hash', () => {
    const key = pageKeyForUrl('https://example.com/docs/intro?tab=1');
    expect(key).toBe(`notes:https://example.com:${hashPath('/docs/intro?tab=1')}`);
  });

  it('ignores fragments', () => {
    expect(pageKeyForUrl('https://example.com/a#x')).toBe(pageKeyForUrl('https://example.com/a'));
  });
});

describe('quickKeyForUrl', () => {
  it('is shared across paths of the same domain', () => {
    expect(quickKeyForUrl('https://example.com/a')).toBe(quickKeyForUrl('https://example.com/b'));
  });

  it('ignores the www prefix and the protocol', () => {
    expect(quickKeyForUrl('https://www.example.com/a')).toBe(
      quickKeyForUrl('http://example.com/b'),
    );
  });

  it('separates subdomains', () => {
    expect(quickKeyForUrl('https://docs.example.com/')).not.toBe(
      quickKeyForUrl('https://example.com/'),
    );
  });

  it('uses the file path for file urls', () => {
    expect(boardDomainForUrl('file:///C:/notes/page.html')).toBe('file:/C:/notes/page.html');
    expect(quickKeyForUrl('file:///C:/notes/page.html')).not.toBe(
      quickKeyForUrl('file:///C:/notes/other.html'),
    );
  });

  it('is recognized by isQuickKey', () => {
    expect(isQuickKey(quickKeyForUrl('https://example.com/a'))).toBe(true);
    expect(isQuickKey(pageKeyForUrl('https://example.com/a'))).toBe(false);
    expect(isNotesKey(quickKeyForUrl('https://example.com/a'))).toBe(false);
  });
});

describe('isNotesKey', () => {
  it('matches only notes keys', () => {
    expect(isNotesKey(pageKeyForUrl('https://example.com/'))).toBe(true);
    expect(isNotesKey('settings')).toBe(false);
  });
});

describe('isAnnotatableUrl', () => {
  it('accepts http, https and file urls', () => {
    expect(isAnnotatableUrl('https://example.com/')).toBe(true);
    expect(isAnnotatableUrl('http://example.com/')).toBe(true);
    expect(isAnnotatableUrl('file:///C:/page.html')).toBe(true);
  });

  it('rejects browser and invalid urls', () => {
    expect(isAnnotatableUrl('chrome://extensions')).toBe(false);
    expect(isAnnotatableUrl('about:blank')).toBe(false);
    expect(isAnnotatableUrl(undefined)).toBe(false);
    expect(isAnnotatableUrl('not a url')).toBe(false);
  });
});
