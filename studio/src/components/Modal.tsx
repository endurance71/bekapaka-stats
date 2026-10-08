import { useEffect, useId, useRef, type ReactNode } from 'react';

const focusable =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Props = {
  title: ReactNode;
  eyebrow?: string;
  onClose?: () => void;
  // Backdrop clicks close only dismissible dialogs; confirmations require an explicit choice.
  dismissible?: boolean;
  className?: string;
  children: ReactNode;
};

export default function Modal({ title, eyebrow, onClose, dismissible = true, className = '', children }: Props) {
  const ref = useRef<HTMLElement>(null);
  const titleId = useId();
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    (
      node?.querySelector<HTMLElement>('[data-autofocus]') ||
      node?.querySelector<HTMLElement>(focusable) ||
      node
    )?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && close.current) {
        event.stopPropagation();
        close.current();
        return;
      }
      if (event.key !== 'Tab' || !node) return;
      const items = [...node.querySelectorAll<HTMLElement>(focusable)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, []);

  return (
    <div className="modal-backdrop" onClick={() => dismissible && onClose?.()}>
      <section
        ref={ref}
        tabIndex={-1}
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2 id={titleId}>{title}</h2>
          </div>
          {onClose && (
            <button className="icon-button" aria-label="Zamknij" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        {children}
      </section>
    </div>
  );
}
