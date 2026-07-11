import { browser, type PublicPath } from 'wxt/browser';

const FONT_STYLE_ID = 'overlayer-font';

const FACES: { file: string; weight: number; style: 'normal' | 'italic' }[] = [
  { file: 'Raleway-Regular.woff2', weight: 400, style: 'normal' },
  { file: 'Raleway-Italic.woff2', weight: 400, style: 'italic' },
  { file: 'Raleway-Medium.woff2', weight: 500, style: 'normal' },
  { file: 'Raleway-SemiBold.woff2', weight: 600, style: 'normal' },
  { file: 'Raleway-Bold.woff2', weight: 700, style: 'normal' },
  { file: 'Raleway-BoldItalic.woff2', weight: 700, style: 'italic' },
];

function fontFaceCss(): string {
  return FACES.map(({ file, weight, style }) => {
    const url = browser.runtime.getURL(`/fonts/${file}` as PublicPath);
    return `@font-face{font-family:'Raleway';src:url('${url}') format('woff2');font-weight:${weight};font-style:${style};font-display:swap;}`;
  }).join('\n');
}

export function ensureFontFace(): void {
  if (document.getElementById(FONT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = FONT_STYLE_ID;
  style.textContent = fontFaceCss();
  document.head.append(style);
}
