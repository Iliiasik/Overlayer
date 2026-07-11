import { describe, expect, it } from 'vitest';
import { isRichTextEmpty } from '../rich-text';

describe('isRichTextEmpty', () => {
  it('treats empty paragraphs and whitespace as empty', () => {
    expect(isRichTextEmpty('')).toBe(true);
    expect(isRichTextEmpty('<p></p>')).toBe(true);
    expect(isRichTextEmpty('<p>   </p><p></p>')).toBe(true);
    expect(isRichTextEmpty('<p>&nbsp;</p>')).toBe(true);
  });

  it('keeps content with visible text', () => {
    expect(isRichTextEmpty('<p>hi</p>')).toBe(false);
    expect(isRichTextEmpty('<ul><li>item</li></ul>')).toBe(false);
  });
});
