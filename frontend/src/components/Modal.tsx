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
            className="fixed left-0 right-0 z-50 flex items-center justify-center bg-bkpk-overlay-strong backdrop-blur-sm p-4 animate-in fade-in duration-200 overlay-viewport-fill pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
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
                className={`bg-bkpk-surface border border-bkpk-border-strong rounded-xl w-full ${maxWidth} flex flex-col shadow-2xl animate-in slide-in-from-bottom-5 duration-300 outline-none overscroll-contain`}
                style={{
                    maxHeight:
                        'calc(var(--overlay-vh, 100dvh) - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 2rem)',
                    paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-bkpk-border-strong shrink-0 safe-area-top">
                    <h2 id={titleId} className="text-xl font-bold text-bkpk-text-primary font-outfit">{title}</h2>
                    <button
                        type="button"
                        style={{ touchAction: 'manipulation' }}
                        className="p-1 -mr-1 text-bkpk-text-muted hover:text-bkpk-text-primary hover:bg-bkpk-surface-tint-2 rounded-lg transition-colors"
                        onClick={() => onCloseRef.current()}
                        aria-label="Zamknij"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div
                    className="p-6 overflow-y-auto text-bkpk-text-secondary"
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
