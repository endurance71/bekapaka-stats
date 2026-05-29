import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Loader2, RefreshCw, X, ChevronRight } from 'lucide-react';
import BkpkButton from '../../shared/ui/BkpkButton';
import BkpkCard from '../../shared/ui/BkpkCard';
import { motion, AnimatePresence } from 'framer-motion';

interface AiAnalysisBlockProps {
  title: string;
  content: string | null | undefined;
  generatedAt?: string | null;
  model?: string | null;
  isAdmin: boolean;
  loading: boolean;
  onGenerate: (force?: boolean) => void;
  emptyHint?: string;
}

export default function AiAnalysisBlock({
  title,
  content,
  generatedAt,
  model,
  isAdmin,
  loading,
  onGenerate,
  emptyHint = 'Brak analizy AI. Administrator może ją wygenerować.'
}: AiAnalysisBlockProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <BkpkCard variant="glass" className="border-bkpk-primary/20 hover:border-bkpk-primary/40 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-bkpk-primary/10 border border-bkpk-primary/20 shadow-bkpk-glow flex items-center justify-center">
              <Bot className="w-6 h-6 text-bkpk-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black text-bkpk-text-primary font-outfit tracking-tight leading-none mb-1">{title}</h3>
              {generatedAt ? (
                <p className="text-xs font-bold text-bkpk-text-muted uppercase tracking-wider">
                  Raport dostępny · {new Date(generatedAt).toLocaleDateString('pl-PL')}
                </p>
              ) : (
                <p className="text-xs font-bold text-bkpk-text-muted uppercase tracking-wider">
                  Brak wygenerowanego raportu
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-bkpk-border-strong/30 pt-3 md:pt-0">
            {/* Admin Panel Actions */}
            {isAdmin && (
              <div className="flex gap-2">
                <BkpkButton
                  variant="primary"
                  size="sm"
                  onClick={() => onGenerate(false)}
                  disabled={loading}
                  className="!py-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Bot className="w-4 h-4 mr-2" />
                  )}
                  {content ? 'Odśwież' : 'Generuj'}
                </BkpkButton>
                {content && (
                  <BkpkButton variant="ghost" size="sm" onClick={() => onGenerate(true)} disabled={loading} className="!p-2">
                    <RefreshCw className="w-4 h-4" />
                  </BkpkButton>
                )}
              </div>
            )}

            {/* Read Button */}
            {content ? (
              <BkpkButton
                variant="primary"
                onClick={() => setIsOpen(true)}
                className="shadow-bkpk-primary/20 font-black text-xs uppercase tracking-widest px-5 py-2.5"
              >
                Zobacz analizę <ChevronRight className="w-4 h-4 ml-1 animate-pulse" />
              </BkpkButton>
            ) : (
              <span className="text-xs font-bold text-bkpk-text-muted uppercase tracking-widest py-2 italic">{emptyHint}</span>
            )}
          </div>
        </div>
      </BkpkCard>

      {/* Modern Pop-up Modal */}
      <AnimatePresence>
        {isOpen && content && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ y: '100%', scale: 1 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: '100%', scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full max-h-[90vh] md:max-h-[85vh] md:max-w-3xl bg-bkpk-surface-elevated/95 border-t md:border border-bkpk-border-strong rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col z-[101] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-bkpk-border-strong bg-bkpk-surface/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-bkpk-primary/10 border border-bkpk-primary/20">
                    <Bot className="w-5 h-5 text-bkpk-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-bkpk-text-primary font-outfit uppercase tracking-tight">{title}</h3>
                    {generatedAt && (
                      <p className="text-xs text-bkpk-text-muted">
                        Generowano: {new Date(generatedAt).toLocaleString('pl-PL')} {model ? `(${model})` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-bkpk-surface-tint-3 rounded-full transition-colors text-bkpk-text-muted hover:text-bkpk-text-primary border border-bkpk-border-strong/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar scroll-smooth">
                <div className="prose prose-invert max-w-none prose-headings:font-outfit prose-headings:font-black prose-headings:text-bkpk-text-primary prose-p:text-bkpk-text-secondary prose-li:text-bkpk-text-secondary prose-strong:text-bkpk-primary prose-headings:mt-6 prose-headings:mb-4 prose-p:leading-relaxed prose-li:my-1 pb-10">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </div>
              </div>

              {/* Bottom Footer bar */}
              <div className="p-4 border-t border-bkpk-border-strong bg-bkpk-surface/40 flex justify-end">
                <BkpkButton variant="ghost" onClick={() => setIsOpen(false)} className="font-bold text-xs uppercase tracking-widest">
                  Zamknij okno
                </BkpkButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
