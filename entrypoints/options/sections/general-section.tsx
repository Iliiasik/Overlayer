import { Leaf, Rocket, Waves } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Segmented } from '@/components/ui/segmented';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/hooks/use-settings';
import { LANGUAGE_NAMES } from '@/lib/i18n';
import type { LanguageSetting, ThemeSetting } from '@/lib/storage/settings-repository';
import { Section, SettingRow } from './section';

export function GeneralSection() {
  const { t } = useTranslation();
  const { settings, update } = useSettings();

  return (
    <Section title={t('options.settings')}>
      <div className="divide-y">
        <SettingRow title={t('options.language')}>
          <Select
            value={settings.language}
            onValueChange={(language) => void update({ language: language as LanguageSetting })}
          >
            <SelectTrigger className="w-44" aria-label={t('options.language')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">{t('options.languageAuto')}</SelectItem>
              {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                <SelectItem key={code} value={code}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title={t('options.theme')}>
          <Segmented<ThemeSetting>
            aria-label={t('options.theme')}
            value={settings.theme}
            onChange={(theme) => void update({ theme })}
            options={[
              { value: 'green', label: t('options.themeGreen'), icon: Leaf },
              { value: 'blue', label: t('options.themeBlue'), icon: Waves },
              { value: 'space', label: t('options.themeSpace'), icon: Rocket },
            ]}
          />
        </SettingRow>
        <SettingRow
          title={t('options.selectionButton')}
          description={t('options.selectionButtonHint')}
        >
          <Switch
            aria-label={t('options.selectionButton')}
            checked={settings.selectionButton}
            onCheckedChange={(selectionButton) => void update({ selectionButton })}
          />
        </SettingRow>
        <SettingRow
          title={t('options.highlighterBadge')}
          description={t('options.highlighterBadgeHint')}
        >
          <Switch
            aria-label={t('options.highlighterBadge')}
            checked={settings.highlighterBadge}
            onCheckedChange={(highlighterBadge) => void update({ highlighterBadge })}
          />
        </SettingRow>
      </div>
    </Section>
  );
}
