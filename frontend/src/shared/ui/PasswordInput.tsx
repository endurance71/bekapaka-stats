import { useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

export interface PasswordInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  showPassword: boolean;
  onToggleShow: () => void;
  className?: string;
}

export function PasswordInput({
  id: idProp,
  label,
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
  showPassword,
  onToggleShow,
  className
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = idProp ?? generatedId;

  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={inputId} className="text-xs font-bold text-bkpk-text-muted uppercase flex items-center gap-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          required={required}
          className="w-full bg-bkpk-surface border border-bkpk-border-subtle rounded-xl px-4 py-2.5 pr-11 text-sm text-bkpk-text-primary focus:outline-none focus:border-bkpk-primary/50"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-bkpk-text-muted hover:text-bkpk-primary transition-colors"
          tabIndex={-1}
          aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
