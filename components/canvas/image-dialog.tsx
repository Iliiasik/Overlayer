import { ImagePlus, X } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  loadDroppedImage,
  loadImageFile,
  payloadFromDataTransfer,
  type ImageLoadResult,
} from '@/lib/images';
import { cn } from '@/lib/utils';

interface ImageDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (dataUrl: string, width: number, height: number) => void;
}

const DEFAULT_RENDER_WIDTH = 280;

export function ImageDialog({ open, onClose, onInsert }: ImageDialogProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(false);

  if (!open) return null;

  const insert = (result: ImageLoadResult) => {
    if (!result.ok) {
      setError(true);
      return;
    }
    const { image } = result;
    const renderScale = Math.min(1, DEFAULT_RENDER_WIDTH / image.width);
    onInsert(
      image.dataUrl,
      Math.round(image.width * renderScale),
      Math.round(image.height * renderScale),
    );
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    setError(false);
    const payload = payloadFromDataTransfer(event.dataTransfer);
    void loadDroppedImage(payload).then(insert);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      style={{ pointerEvents: 'auto' }}
      onClick={onClose}
    >
      <div
        className="flex w-96 max-w-[calc(100vw-32px)] flex-col gap-3 rounded-xl border bg-card p-5 text-card-foreground shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{t('image.title')}</h2>
          <Button variant="ghost" size="icon" aria-label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 transition-colors',
            dragOver
              ? 'border-ring bg-accent'
              : 'border-border hover:border-ring hover:bg-accent/50',
          )}
        >
          <ImagePlus className="h-7 w-7 text-muted-foreground" />
          <span className="text-center text-sm text-muted-foreground">{t('image.dropHint')}</span>
        </button>
        {error && <p className="text-sm text-destructive">{t('image.invalid')}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            setError(false);
            void loadImageFile(event.target.files?.[0] ?? null).then(insert);
            event.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
