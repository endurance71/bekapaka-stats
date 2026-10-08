import { useEffect, useRef, type RefObject } from 'react';
import { focusWithoutScroll } from '@bekapaka/safari-overlay';

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Okno / menu pełnoekranowe: fokus wchodzi do środka, Tab krąży w obrębie, Esc zamyka,
 * po zamknięciu fokus wraca tam, skąd otwarto (wzorzec z `components/Modal.tsx`).
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, open: boolean, onClose?: () => void) {
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!open) return;
        const previous = document.activeElement as HTMLElement | null;

        const frame = requestAnimationFrame(() => {
            const root = ref.current;
            if (!root) return;
            const first = root.querySelector<HTMLElement>(FOCUSABLE);
            (first ?? root).focus();
        });

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onCloseRef.current) {
                onCloseRef.current();
                return;
            }
            if (e.key !== 'Tab' || !ref.current) return;
            const items = ref.current.querySelectorAll<HTMLElement>(FOCUSABLE);
            if (items.length === 0) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKey);

        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener('keydown', onKey);
            if (previous) focusWithoutScroll(previous);
        };
    }, [open, ref]);
}
