import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
};

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-4xl' }: ModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    // Tylko przy otwarciu/zamknięciu — NIE przy każdym re-renderze rodzica (inaczej input traci focus)
    useEffect(() => {
        if (!isOpen) return;

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCloseRef.current();
        };

        previousFocusRef.current = document.activeElement as HTMLElement;
        document.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
            if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
                previousFocusRef.current.focus();
            }
            previousFocusRef.current = null;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const frame = requestAnimationFrame(() => {
            const dialog = dialogRef.current;
            if (!dialog) return;
            const firstField = dialog.querySelector<HTMLElement>(
                'input:not([type="hidden"]), select, textarea'
            );
            if (firstField) {
                firstField.focus();
            } else {
                dialog.focus();
            }
        });

        return () => cancelAnimationFrame(frame);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== 'Tab' || !dialogRef.current) return;

            const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleTab);
        return () => document.removeEventListener('keydown', handleTab);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-bkpk-overlay-strong flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => onCloseRef.current()}
            role="presentation"
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
                className={`bg-bkpk-surface border border-bkpk-border-strong rounded-xl w-full ${maxWidth} max-h-[95vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-5 duration-300 outline-none`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-bkpk-border-strong">
                    <h2 className="text-xl font-bold text-bkpk-text-primary font-outfit">{title}</h2>
                    <button
                        type="button"
                        className="p-1 -mr-1 text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2 rounded-lg transition-colors"
                        onClick={() => onCloseRef.current()}
                        aria-label="Zamknij"
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
