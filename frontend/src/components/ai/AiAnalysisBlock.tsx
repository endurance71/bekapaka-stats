import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Loader2, RefreshCw } from 'lucide-react';
import BkpkButton from '../../shared/ui/BkpkButton';
import BkpkCard from '../../shared/ui/BkpkCard';

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
  return (
    <BkpkCard variant="glass" className="border-bkpk-primary/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-bkpk-primary/10 border border-bkpk-primary/20">
            <Bot className="w-5 h-5 text-bkpk-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-bkpk-text-primary font-outfit">{title}</h3>
            {generatedAt && (
              <p className="text-xs text-bkpk-text-muted">
                {new Date(generatedAt).toLocaleString('pl-PL')}
                {model ? ` · ${model}` : ''}
              </p>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <BkpkButton
              variant="primary"
              size="sm"
              onClick={() => onGenerate(false)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Bot className="w-4 h-4 mr-2" />
              )}
              {content ? 'Odśwież' : 'Generuj'}
            </BkpkButton>
            {content && (
              <BkpkButton variant="ghost" size="sm" onClick={() => onGenerate(true)} disabled={loading}>
                <RefreshCw className="w-4 h-4" />
              </BkpkButton>
            )}
          </div>
        )}
      </div>

      {content ? (
        <div className="prose prose-invert max-w-none prose-headings:text-bkpk-text-primary prose-p:text-bkpk-text-secondary prose-li:text-bkpk-text-secondary prose-strong:text-bkpk-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-sm text-bkpk-text-muted">{emptyHint}</p>
      )}
    </BkpkCard>
  );
}
