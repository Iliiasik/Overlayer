import { browser } from 'wxt/browser';

export type LanguageSetting = 'auto' | 'en' | 'ru' | 'es' | 'de' | 'fr' | 'pt' | 'ja' | 'zh';

export type ThemeSetting = 'green' | 'blue' | 'space';

export interface Settings {
  language: LanguageSetting;
  theme: ThemeSetting;
  highlighterBadge: boolean;
  selectionButton: boolean;
  notesEdgeButton: boolean;
  notesContextMenu: boolean;
  edgeOffset: number;
}

const SETTINGS_KEY = 'settings';

export const DEFAULT_SETTINGS: Settings = {
  language: 'auto',
  theme: 'space',
  highlighterBadge: true,
  selectionButton: true,
  notesEdgeButton: true,
  notesContextMenu: true,
  edgeOffset: 0.5,
};

function normalize(stored: Partial<Settings> | undefined): Settings {
  const merged = { ...DEFAULT_SETTINGS, ...stored };
  if ((merged.theme as string) === 'teal') merged.theme = 'blue';
  if ((merged.theme as string) === 'dark') merged.theme = 'space';
  if (!['green', 'blue', 'space'].includes(merged.theme)) merged.theme = 'space';
  if (!Number.isFinite(merged.edgeOffset)) merged.edgeOffset = DEFAULT_SETTINGS.edgeOffset;
  merged.edgeOffset = Math.min(0.95, Math.max(0.05, merged.edgeOffset));
  return merged;
}

export const settingsRepository = {
  async get(): Promise<Settings> {
    const stored = await browser.storage.local.get(SETTINGS_KEY);
    return normalize(stored[SETTINGS_KEY] as Partial<Settings> | undefined);
  },

  async update(patch: Partial<Settings>): Promise<Settings> {
    const current = await this.get();
    const next = { ...current, ...patch };
    await browser.storage.local.set({ [SETTINGS_KEY]: next });
    return next;
  },

  onChanged(callback: (settings: Settings) => void): () => void {
    const listener = (changes: Record<string, { newValue?: unknown }>, area: string): void => {
      if (area !== 'local' || !(SETTINGS_KEY in changes)) return;
      callback(normalize(changes[SETTINGS_KEY].newValue as Partial<Settings> | undefined));
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  },
};
