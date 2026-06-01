import { useState } from 'react';
import { AlertCircle, Upload, X, Save } from 'lucide-react';
import type { Game } from './types';

interface ImportModalProps {
  onClose: () => void;
  onImportParse: (content?: string, format?: 'markdown' | 'json') => Promise<void>;
  onImportSave: () => Promise<void>;
  importFormat: 'markdown' | 'json';
  setImportFormat: (format: 'markdown' | 'json') => void;
  importContent: string;
  setImportContent: (content: string) => void;
  importPreview: Game | null;
  importError: string;
  importMeta: { date: string; opponent: string };
  setImportMeta: (meta: { date: string; opponent: string }) => void;
  fileName: string;
  onFileUpload: (file: File) => Promise<void>;
}

export default function ImportModal({
  onClose,
  onImportParse,
  onImportSave,
  importFormat,
  setImportFormat,
  importContent,
  setImportContent,
  importPreview,
  importError,
  importMeta,
  setImportMeta,
  fileName,
  onFileUpload,
}: ImportModalProps) {
  return (
    <div className="fixed inset-0 bg-bkpk-overlay-strong flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-bkpk-surface-elevated border border-bkpk-border-strong rounded-2xl w-[600px] max-w-full overflow-hidden shadow-xl animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-bkpk-border-strong bg-bkpk-surface-tint-1">
          <h3 className="text-xl font-bold font-outfit text-bkpk-text-primary">Dodaj / importuj protokół</h3>
          <button
            className="text-bkpk-text-muted hover:text-bkpk-text-primary transition-colors p-1"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
              Format danych
              <select
                className="w-full bg-bkpk-bg border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors"
                value={importFormat}
                onChange={(e) => setImportFormat(e.target.value as 'markdown' | 'json')}
              >
                <option value="markdown">Markdown</option>
                <option value="json">JSON (Baza danych)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
              Data meczu
              <input
                className="w-full bg-bkpk-bg border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors"
                value={importMeta.date}
                onChange={(e) => setImportMeta({ ...importMeta, date: e.target.value })}
                placeholder="YYYY-MM-DD"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-xs text-bkpk-text-muted font-bold uppercase tracking-wider">
            Rywal
            <input
              className="w-full bg-bkpk-bg border border-bkpk-border-strong rounded-lg px-3 py-2 text-bkpk-text-primary text-sm font-normal normal-case focus:border-bkpk-primary outline-none transition-colors"
              value={importMeta.opponent}
              onChange={(e) => setImportMeta({ ...importMeta, opponent: e.target.value })}
              placeholder="Nazwa Drużyny"
            />
          </label>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-bkpk-text-primary uppercase tracking-wider">Wgraj plik (opcjonalnie)</span>
            <label className="block p-8 border-2 border-dashed border-bkpk-border-strong rounded-xl text-center cursor-pointer hover:bg-bkpk-surface-tint-2 hover:border-bkpk-primary transition-all group">
              <div className="flex flex-col items-center gap-3 text-bkpk-text-muted group-hover:text-bkpk-text-primary transition-colors">
                <Upload size={32} />
                <span className="font-medium text-sm">Kliknij, aby wybrać plik .json / .md</span>
              </div>
              <input
                type="file"
                accept=".json,.md,text/markdown"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFileUpload(file);
                }}
                className="hidden"
              />
            </label>
            {fileName && <span className="text-sm font-medium text-bkpk-primary mt-1 text-center bg-bkpk-primary/10 py-1 px-3 rounded-full self-center">{fileName}</span>}
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-bkpk-text-primary uppercase tracking-wider">Treść protokołu</span>
            <textarea
              placeholder='Wklej tutaj zawartość...'
              value={importContent}
              onChange={(e) => setImportContent(e.target.value)}
              className="w-full h-32 bg-bkpk-bg border border-bkpk-border-strong rounded-xl p-3 text-xs font-mono resize-none focus:border-bkpk-primary focus:ring-1 focus:ring-bkpk-primary outline-none transition-all"
            />
          </div>
        </div>

        {importError && (
          <div className="mx-6 mb-4 p-3 bg-bkpk-danger/10 border border-bkpk-danger/20 rounded-lg text-bkpk-danger text-sm font-medium flex items-center gap-2">
            <AlertCircle size={16} />
            {importError}
          </div>
        )}

        {importPreview && (
          <div className="mx-6 mb-6">
            <span className="block text-xs font-bold text-bkpk-text-muted uppercase tracking-wider mb-2">Podgląd danych</span>
            <pre className="bg-bkpk-surface-tint-2 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-bkpk-border-subtle max-h-60 text-bkpk-text-secondary">
              {JSON.stringify(importPreview, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex justify-end gap-3 p-6 border-t border-bkpk-border-strong bg-bkpk-surface-tint-1">
          {/* Parse button if content but no preview */}
          {!importPreview && importContent && (
            <button
              className="px-4 py-2 bg-bkpk-accent text-white text-sm font-bold rounded-xl hover:bg-bkpk-accent-hover transition-colors shadow-sm"
              onClick={() => onImportParse()}
            >
              Sprawdź poprawność
            </button>
          )}

          <button
            className="px-4 py-2 bg-transparent border border-bkpk-border-strong text-bkpk-text-secondary text-sm font-bold rounded-xl hover:bg-bkpk-surface-tint-2 hover:text-bkpk-text-primary transition-colors"
            onClick={onClose}
          >
            Anuluj
          </button>
          <button
            className="px-4 py-2 bg-bkpk-primary text-white text-sm font-bold rounded-xl hover:bg-bkpk-primary-hover transition-colors shadow-bkpk-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={onImportSave}
            disabled={!importPreview && importFormat === 'markdown'}
          >
            <Save size={16} />
            {importPreview ? 'Zapisz protokół' : 'Dodaj'}
          </button>
        </div>
      </div>
    </div>
  );
}
