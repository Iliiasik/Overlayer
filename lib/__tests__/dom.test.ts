// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { isEditableElement, isEditableEventTarget } from '../dom';

describe('editable detection', () => {
  it('recognises inputs and textareas', () => {
    expect(isEditableElement(document.createElement('input'))).toBe(true);
    expect(isEditableElement(document.createElement('textarea'))).toBe(true);
    expect(isEditableElement(document.createElement('div'))).toBe(false);
    expect(isEditableElement(null)).toBe(false);
  });

  it('checks the first element of the composed event path', () => {
    const input = document.createElement('input');
    expect(isEditableEventTarget({ composedPath: () => [input] } as unknown as Event)).toBe(true);
    expect(isEditableEventTarget({ composedPath: () => [] } as unknown as Event)).toBe(false);
  });
});
