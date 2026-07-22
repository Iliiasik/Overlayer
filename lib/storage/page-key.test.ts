import { describe, expect, it } from 'vitest';
import {
  baseUrlForDomain,
  boardDomainForUrl,
  hashPath,
  isAnnotatableUrl,
  isNotesKey,
  isQuickKey,
  pageKeyForUrl,
  pagePath,
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

  it('ignores plain anchor fragments', () => {
    expect(pageKeyForUrl('https://example.com/a#section')).toBe(
      pageKeyForUrl('https://example.com/a'),
    );
  });

  it('keeps a route-like hash so hash-routed pages are distinct', () => {
    const base = 'https://mail.google.com/mail/u/0/?tab=rm&ogbl';
    expect(pageKeyForUrl(`${base}#inbox/AAA`)).not.toBe(pageKeyForUrl(`${base}#inbox/BBB`));
    expect(pageKeyForUrl(`${base}#inbox/AAA`)).not.toBe(pageKeyForUrl(base));
    expect(pagePath(`${base}#inbox/AAA`)).toBe('/mail/u/0/?tab=rm&ogbl#inbox/AAA');
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

  it('adds the first path segment for project hosting domains', () => {
    expect(boardDomainForUrl('https://iliiasik.github.io/MThoughts-Wiki/page')).toBe(
      'iliiasik.github.io/MThoughts-Wiki',
    );
    expect(quickKeyForUrl('https://iliiasik.github.io/MThoughts-Wiki/a')).toBe(
      quickKeyForUrl('https://iliiasik.github.io/MThoughts-Wiki/b'),
    );
    expect(quickKeyForUrl('https://iliiasik.github.io/MThoughts-Wiki/')).not.toBe(
      quickKeyForUrl('https://iliiasik.github.io/OtherProject/'),
    );
  });

  it('keeps the user root page of a project host without a segment', () => {
    expect(boardDomainForUrl('https://iliiasik.github.io/')).toBe('iliiasik.github.io');
  });

  it('does not split paths for ordinary domains', () => {
    expect(boardDomainForUrl('https://example.com/some/deep/path')).toBe('example.com');
  });

  it('is recognized by isQuickKey', () => {
    expect(isQuickKey(quickKeyForUrl('https://example.com/a'))).toBe(true);
    expect(isQuickKey(pageKeyForUrl('https://example.com/a'))).toBe(false);
    expect(isNotesKey(quickKeyForUrl('https://example.com/a'))).toBe(false);
  });
});

describe('baseUrlForDomain', () => {
  it('rebuilds a plain domain url from its origin', () => {
    expect(baseUrlForDomain('example.com', 'https://www.example.com')).toBe(
      'https://www.example.com/',
    );
    expect(baseUrlForDomain('example.com')).toBe('https://example.com/');
  });

  it('rebuilds a project host url including the segment', () => {
    expect(
      baseUrlForDomain('iliiasik.github.io/MThoughts-Wiki', 'https://iliiasik.github.io'),
    ).toBe('https://iliiasik.github.io/MThoughts-Wiki/');
    expect(baseUrlForDomain('iliiasik.github.io/MThoughts-Wiki')).toBe(
      'https://iliiasik.github.io/MThoughts-Wiki/',
    );
  });

  it('rebuilds file urls', () => {
    expect(baseUrlForDomain('file:/C:/notes/page.html')).toBe('file:///C:/notes/page.html');
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
