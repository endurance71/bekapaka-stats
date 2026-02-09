import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface BkpkTooltipProps {
    content: string;
    children?: React.ReactNode;
    className?: string;
}

export default function BkpkTooltip({ content, children, className }: BkpkTooltipProps) {
    // DEBUG: Verify component version
    useEffect(() => { console.log("BkpkTooltip MOUNTED - Portal Version Active"); }, []);

    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                x: rect.left + rect.width / 2,
                y: rect.top
            });
        }
    };

    const handleMouseEnter = () => {
        updatePosition();
        setIsVisible(true);
    };

    // Update position on scroll/resize to keep tooltip attached
    useEffect(() => {
        if (isVisible) {
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isVisible]);

    return (
        <>
            <div
                ref={triggerRef}
                className={cn("inline-flex items-center cursor-help", className)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setIsVisible(false)}
            >
                {children || <Info className="w-4 h-4 text-bkpk-primary hover:text-bkpk-primary-hover transition-colors" />}
            </div>

            {createPortal(
                <AnimatePresence>
                    {isVisible && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-90%" }}
                            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-100%" }}
                            exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-90%" }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            style={{
                                position: 'fixed',
                                top: coords.y - 12, // Increased gap
                                left: coords.x,
                                zIndex: 99999, // Super high z-index
                                pointerEvents: 'none',
                                maxWidth: '300px' // Ensure it doesn't get too wide
                            }}
                            className="w-64 p-3 bg-bkpk-surface-elevated border border-bkpk-border-strong rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                        >
                            <div className="relative z-10">
                                <p className="text-xs font-medium text-bkpk-text-secondary leading-relaxed text-center">
                                    {content}
                                </p>
                            </div>
                            <div className="absolute top-0 left-0 w-full h-full bg-bkpk-primary/5 pointer-events-none" />
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
