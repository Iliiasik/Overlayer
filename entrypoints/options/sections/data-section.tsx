import { Download, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { clearAllData, exportData, importData } from '@/lib/storage/backup';
import { toast } from '@/lib/toast';
import { Section } from './section';

function downloadJson(content: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function DataSection() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleExport = async () => {
    const json = await exportData();
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(json, `overlayer-backup-${date}.json`);
    toast(t('options.exported'));
  };

  const handleImport = async (file: File) => {
    setImportError(false);
    try {
      await importData(await file.text());
      window.location.reload();
    } catch {
      setImportError(true);
      toast(t('options.importError'));
    }
  };

  const handleClearAll = async () => {
    await clearAllData();
    window.location.reload();
  };

  return (
    <Section title={t('options.data')} description={t('options.dataHint')}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void handleExport()}>
            <Download className="h-4 w-4" />
            {t('options.export')}
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            {t('options.import')}
          </Button>
        </div>
        {importError && <p className="text-sm text-destructive">{t('options.importError')}</p>}
        <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-muted-foreground">{t('options.clearAllText')}</p>
          <Button variant="destructive" className="shrink-0" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-4 w-4" />
            {t('options.clearAll')}
          </Button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleImport(file);
          event.target.value = '';
        }}
      />
      <ConfirmDialog
        open={confirmOpen}
        title={t('options.clearAllTitle')}
        description={t('options.clearAllText')}
        confirmLabel={t('options.clearAll')}
        cancelLabel={t('common.cancel')}
        destructive
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void handleClearAll()}
      />
    </Section>
  );
}
