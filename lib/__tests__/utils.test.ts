import { describe, expect, it } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('merges conditional classes and resolves tailwind conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('a', undefined, { b: true, c: false })).toBe('a b');
  });
});
