// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { isEditableElement } from '../dom';

describe('editable detection', () => {
  it('recognises inputs and textareas', () => {
    expect(isEditableElement(document.createElement('input'))).toBe(true);
    expect(isEditableElement(document.createElement('textarea'))).toBe(true);
    expect(isEditableElement(document.createElement('div'))).toBe(false);
    expect(isEditableElement(null)).toBe(false);
  });
});
