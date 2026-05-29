import { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '../lib/utils';
import { Trophy, Star } from 'lucide-react';

export interface PlayerCardProps {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
    number: number;
    position: string;
    ppg: number;
    rpg: number;
    apg: number;
    isStarter?: boolean;
    onClick?: (id: string) => void;
}

export default function PlayerCard({
    id,
    firstName,
    lastName,
    photoUrl,
    number,
    position,
    ppg,
    rpg,
    apg,
    isStarter,
    onClick
}: PlayerCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState(false);
    const [canHover, setCanHover] = useState(false);

    useEffect(() => {
        const media = window.matchMedia('(hover: hover)');
        setCanHover(media.matches);
        const listener = (e: MediaQueryListEvent) => setCanHover(e.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, []);

    // Mouse tilt values
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        setHovered(false);
        x.set(0);
        y.set(0);
    };

    const getPhotoUrl = (f: string, l: string) => {
        const normalize = (str: string) => str.toLowerCase()
            .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
            .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
            .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
            .replace(/\s+/g, '-');
        const localPhoto = `/photos/${normalize(f)}-${normalize(l)}.png`;
        const hasValidRemotePhoto = Boolean(photoUrl) && !photoUrl.toLowerCase().includes('empty.jpg');
        return hasValidRemotePhoto ? photoUrl : localPhoto;
    };

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={handleMouseLeave}
            onClick={() => onClick?.(id)}
            style={{
                rotateX: canHover ? rotateX : 0,
                rotateY: canHover ? rotateY : 0,
                transformStyle: canHover ? "preserve-3d" : "flat",
            }}
            className="relative w-full aspect-[3/4] cursor-pointer group select-none"
        >
            {/* 3D Container */}
            <div
                style={{ transform: "translateZ(50px)" }}
                className="w-full h-full rounded-bkpk-lg overflow-hidden border border-bkpk-border-strong bg-bkpk-glass backdrop-blur-3xl shadow-2xl transition-all duration-300 group-hover:border-bkpk-primary/50 group-hover:shadow-bkpk-glow"
            >
                {/* Holographic Glare */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-50 transition-opacity opacity-0 group-hover:opacity-100"
                    style={{
                        background: useTransform(
                            [mouseXSpring, mouseYSpring],
                            ([mx, my]: any[]) => `radial-gradient(circle at ${(mx + 0.5) * 100}% ${(my + 0.5) * 100}%, rgba(255,255,255,0.1) 0%, transparent 80%)`
                        )
                    }}
                />

                {/* Player Image & Backdrop */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bkpk-bg/20 to-bkpk-bg z-10" />
                    <motion.img
                        src={getPhotoUrl(firstName, lastName)}
                        onError={(e) => (e.currentTarget.src = '/photos/default.png')}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                        style={{ transform: "translateZ(-20px) scale(1.1)" }}
                    />
                </div>

                {/* Number Badge */}
                <div className="absolute top-4 left-4 z-20 flex flex-col items-center">
                    <span className="text-4xl font-black font-outfit text-bkpk-primary/30 tabular-nums group-hover:text-bkpk-primary transition-colors">
                        {number}
                    </span>
                    {isStarter && (
                        <div className="p-1 bg-bkpk-warning-fill rounded-full shadow-lg">
                            <Star className="w-2.5 h-2.5 text-white fill-current" />
                        </div>
                    )}
                </div>

                {/* Info Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-6 z-20 space-y-4">
                    <div className="space-y-0.5">
                        <h3 className="text-2xl font-black font-outfit text-bkpk-text-primary leading-none">
                            <span className="block text-sm text-bkpk-primary/80 mb-1">{firstName}</span>
                            {lastName}
                        </h3>
                        <span className="text-xs font-bold uppercase tracking-widest text-bkpk-text-muted">
                            {position === 'G' ? 'Obrońca' :
                                position === 'F' ? 'Skrzydłowy' :
                                    position === 'C' ? 'Środkowy' :
                                        position === 'PG' ? 'Rozgrywający' :
                                            position === 'SG' ? 'Rzucający Obrońca' :
                                                position === 'SF' ? 'Niski Skrzydłowy' :
                                                    position === 'PF' ? 'Silny Skrzydłowy' : position}
                        </span>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-bkpk-border-strong bg-bkpk-overlay-weak -mx-6 px-6">
                        <div className="text-center">
                            <div className="text-xs font-bold text-bkpk-text-muted uppercase">PPG</div>
                            <div className="text-sm font-bold text-bkpk-text-primary">{ppg.toFixed(1)}</div>
                        </div>
                        <div className="text-center border-x border-bkpk-border-strong">
                            <div className="text-xs font-bold text-bkpk-text-muted uppercase">RPG</div>
                            <div className="text-sm font-bold text-bkpk-text-primary">{rpg.toFixed(1)}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs font-bold text-bkpk-text-muted uppercase">APG</div>
                            <div className="text-sm font-bold text-bkpk-text-primary">{apg.toFixed(1)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Shadow/Glow */}
            <div className="absolute inset-4 -z-10 bg-bkpk-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );
}
