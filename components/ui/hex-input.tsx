import { useState } from 'react';
import { ColorPicker } from '@/components/ui/color-picker';
import { cn } from '@/lib/utils';

interface HexInputProps {
  value: string;
  onChange: (color: string) => void;
  pickerSide?: 'bottom' | 'top';
  'aria-label'?: string;
}

const HEX_PATTERN = /^[0-9a-f]{6}$/i;

export function HexInput({ value, onChange, pickerSide, ...props }: HexInputProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const commit = (input: HTMLInputElement) => {
    if (HEX_PATTERN.test(input.value)) {
      onChange(`#${input.value.toLowerCase()}`);
    } else {
      input.value = value.replace('#', '');
    }
  };

  return (
    <div
      className={cn(
        'relative flex h-7 items-center gap-1.5 rounded-md border border-input bg-background px-2',
        'focus-within:ring-2 focus-within:ring-ring',
      )}
    >
      <button
        type="button"
        aria-label={props['aria-label']}
        aria-expanded={pickerOpen}
        onClick={() => setPickerOpen((open) => !open)}
        className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded-full border transition-transform hover:scale-110"
        style={{ backgroundColor: value }}
      />
      <span className="text-xs text-muted-foreground">#</span>
      <input
        key={value}
        defaultValue={value.replace('#', '')}
        maxLength={6}
        spellCheck={false}
        onInput={(event) => {
          const input = event.currentTarget;
          input.value = input.value.replace(/[^0-9a-f]/gi, '');
        }}
        onBlur={(event) => commit(event.currentTarget)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit(event.currentTarget);
        }}
        className="w-14 bg-transparent font-mono text-xs uppercase outline-none"
        {...props}
      />
      {pickerOpen && (
        <ColorPicker
          color={value}
          onChange={onChange}
          onClose={() => setPickerOpen(false)}
          side={pickerSide}
        />
      )}
    </div>
  );
}
