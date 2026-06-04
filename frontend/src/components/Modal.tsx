import { ReactNode, useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useOverlayViewportHeight, usePageScrollLock } from '@bekapaka/safari-overlay';

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

    const titleId = useId();

    useOverlayViewportHeight(isOpen);
    usePageScrollLock(isOpen, { htmlClass: 'is-overlay-open' });

    useEffect(() => {
        if (!isOpen) return;

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCloseRef.current();
        };

        previousFocusRef.current = document.activeElement as HTMLElement;
        document.addEventListener('keydown', handleEsc);

        return () => {
            document.removeEventListener('keydown', handleEsc);

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
                'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
                'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="fixed left-0 right-0 z-[200] flex bg-bkpk-overlay-strong backdrop-blur-sm animate-in fade-in duration-200 overlay-viewport-fill max-sm:items-stretch max-sm:justify-stretch sm:items-center sm:justify-center sm:p-4"
            style={{ touchAction: 'none' }}
            onClick={() => onCloseRef.current()}
            role="presentation"
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`bg-bkpk-surface w-full ${maxWidth} flex flex-col outline-none overscroll-contain animate-in slide-in-from-bottom-5 duration-300 max-sm:absolute max-sm:inset-0 max-sm:h-[var(--overlay-vh)] max-sm:min-h-[var(--overlay-vh)] max-sm:max-h-[var(--overlay-vh)] max-sm:border-0 max-sm:rounded-none max-sm:shadow-none sm:max-h-[min(85dvh,calc(var(--overlay-vh,100dvh)-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2rem))] sm:rounded-xl sm:border sm:border-bkpk-border-strong sm:shadow-2xl`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center gap-3 border-b border-bkpk-border-strong bg-bkpk-surface/95 shrink-0 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:p-6">
                    <h2 id={titleId} className="min-w-0 text-lg sm:text-xl font-bold text-bkpk-text-primary font-outfit leading-tight">{title}</h2>
                    <button
                        type="button"
                        style={{ touchAction: 'manipulation' }}
                        className="flex h-11 w-11 shrink-0 items-center justify-center text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bkpk-primary"
                        onClick={() => onCloseRef.current()}
                        aria-label="Zamknij"
                    >
                        <X size={24} aria-hidden />
                    </button>
                </div>

                <div
                    className="flex-1 min-h-0 overflow-y-auto overscroll-contain text-bkpk-text-secondary p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:p-6"
                    style={{
                        touchAction: 'pan-y',
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehaviorY: 'contain'
                    }}
                >
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
