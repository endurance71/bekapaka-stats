import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { InfoIcon as Info } from './BrandIcon';
import { cn } from '../lib/utils';

interface BkpkTooltipProps {
    content: string;
    /** Własny wyzwalacz (zamiast ikony „i”), np. skrót statystyki */
    children?: React.ReactNode;
    className?: string;
    /** Czytnik ekranu: co wyjaśnia dymek (domyślnie „Wyjaśnienie”) */
    label?: string;
}

const POPUP_WIDTH = 256;
const EDGE = 8;

/**
 * Dymek z wyjaśnieniem: stuknięcie / klik przełącza (telefon), najechanie myszą otwiera (komputer),
 * Enter/Spacja z klawiatury, Esc lub stuknięcie poza dymkiem zamyka. Pozycja przycięta do szerokości ekranu.
 */
export default function BkpkTooltip({ content, children, className, label = 'Wyjaśnienie' }: BkpkTooltipProps) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<{ left: number; top?: number; bottom?: number }>({ left: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    // Jak otwarto: najechanie myszą zamyka zjazd myszy; klik/stuknięcie „przypina” do kolejnego kliknięcia
    const openedBy = useRef<'hover' | 'focus' | 'click' | null>(null);
    const lastPointer = useRef<string>('mouse');

    const updatePosition = useCallback(() => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const center = rect.left + rect.width / 2;
        const left = Math.min(Math.max(center - POPUP_WIDTH / 2, EDGE), window.innerWidth - POPUP_WIDTH - EDGE);
        // Nad ikoną (kotwica od dołu — bez transformacji, którą nadpisuje animacja); przy górnej krawędzi pod ikoną
        if (rect.top < 140) setCoords({ left, top: rect.bottom + 10 });
        else setCoords({ left, bottom: window.innerHeight - rect.top + 10 });
    }, []);

    const show = useCallback((by: 'hover' | 'focus' | 'click') => {
        openedBy.current = by;
        updatePosition();
        setOpen(true);
    }, [updatePosition]);
    const hide = useCallback(() => {
        openedBy.current = null;
        setOpen(false);
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide();
        const onPointer = (e: PointerEvent) => {
            const t = e.target as Node;
            if (!triggerRef.current?.contains(t) && !popupRef.current?.contains(t)) hide();
        };
        window.addEventListener('scroll', updatePosition, { capture: true, passive: true });
        window.addEventListener('resize', updatePosition);
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onPointer);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onPointer);
        };
    }, [open, updatePosition, hide]);

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                aria-label={children ? undefined : label}
                aria-expanded={open}
                aria-describedby={open ? id : undefined}
                className={cn(
                    'inline-flex items-center justify-center cursor-help bg-transparent border-0 p-0',
                    // obszar dotyku 44×44 wokół małej ikony, bez przesuwania układu
                    !children && 'relative before:absolute before:-inset-3.5 before:content-[""]',
                    // skrót w nagłówku tabeli: wyższa strefa dotyku (~40 px), wąsko w poziomie — sąsiednie kolumny zostają osobno
                    children && 'relative before:absolute before:-inset-y-3 before:-inset-x-1 before:content-[""]',
                    className
                )}
                onPointerDown={(e) => {
                    lastPointer.current = e.pointerType;
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    // mysz: dymek już otwarty najechaniem → klik go przypina; stuknięcie / klawiatura → przełącza
                    if (open && openedBy.current === 'hover' && lastPointer.current === 'mouse') openedBy.current = 'click';
                    else if (open) hide();
                    else show('click');
                }}
                onPointerEnter={(e) => e.pointerType === 'mouse' && !open && show('hover')}
                onPointerLeave={(e) => e.pointerType === 'mouse' && openedBy.current === 'hover' && hide()}
                onKeyUp={(e) => e.key === 'Tab' && !open && show('focus')}
                onBlur={() => openedBy.current === 'focus' && hide()}
            >
                {children || <Info className="w-4 h-4 text-bkpk-primary hover:text-bkpk-primary-hover transition-colors" />}
            </button>

            {createPortal(
                <AnimatePresence>
                    {open && (
                        <motion.div
                            ref={popupRef}
                            id={id}
                            role="tooltip"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.12 }}
                            style={{
                                position: 'fixed',
                                left: coords.left,
                                top: coords.top,
                                bottom: coords.bottom,
                                width: POPUP_WIDTH,
                                zIndex: 99999
                            }}
                            className="p-3 bg-bkpk-surface-elevated border border-bkpk-border-strong border-t-2 border-t-bkpk-primary shadow-xl"
                        >
                            <p className="text-[13px] text-bkpk-text-secondary leading-relaxed text-left">{content}</p>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
