import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  settingsRepository,
  type Settings,
} from '@/lib/storage/settings-repository';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void settingsRepository.get().then((value) => {
      setSettings(value);
      setLoaded(true);
    });
    return settingsRepository.onChanged(setSettings);
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    setSettings(await settingsRepository.update(patch));
  }, []);

  return { settings, loaded, update };
}
