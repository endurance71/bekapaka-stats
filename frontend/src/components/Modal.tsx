import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
};

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-bkpk-overlay-strong flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-bkpk-surface border border-bkpk-border-strong rounded-xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-5 duration-300" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-bkpk-border-strong">
                    <h2 className="text-xl font-bold text-bkpk-text-primary font-outfit">{title}</h2>
                    <button
                        className="p-1 -mr-1 text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2 rounded-lg transition-colors"
                        onClick={onClose}
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto text-bkpk-text-secondary">
                    {children}
                </div>
            </div>
        </div>
    );
}
