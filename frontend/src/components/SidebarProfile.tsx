import { motion } from 'framer-motion';
import { getPhotoUrl, getPositionLabel } from '../shared/lib/playerUtils';

interface User {
    firstName: string;
    lastName: string;
    number?: number;
    position?: string;
    username: string;
}

interface SidebarProfileProps {
    user: User;
}

export default function SidebarProfile({ user }: SidebarProfileProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative mb-8 group"
        >
            <div className="relative overflow-hidden rounded-2xl border border-bkpk-border-strong bg-bkpk-surface-tint-1 shadow-bkpk-glow transition-all duration-300 group-hover:border-bkpk-primary/50">

                {/* Profile Card Header with Number */}
                <div className="absolute top-2 left-2 z-20">
                    <div className="w-8 h-8 rounded-lg bg-bkpk-bg/60 backdrop-blur-md border border-bkpk-border-subtle flex items-center justify-center">
                        <span className="text-sm font-black font-outfit text-bkpk-primary">
                            {user.number || '--'}
                        </span>
                    </div>
                </div>

                {/* Player Photo Background */}
                <div className="h-48 w-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-bkpk-surface-tint-1 via-transparent to-transparent z-10" />
                    <img
                        src={getPhotoUrl(user.firstName, user.lastName)}
                        onError={(e) => (e.currentTarget.src = '/photos/default.png')}
                        alt={user.lastName}
                        className="w-full h-full object-cover object-top grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-70 transition-all duration-700"
                    />
                </div>

                {/* Content */}
                <div className="px-4 pb-4 pt-1 relative z-20">
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-bkpk-primary uppercase tracking-widest leading-none">
                            {getPositionLabel(user.position)}
                        </p>
                        <h3 className="text-base font-black font-outfit text-bkpk-text-primary leading-tight truncate">
                            {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-[10px] font-bold text-bkpk-text-muted truncate">
                            @{user.username}
                        </p>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="absolute top-2 right-2 z-20">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-bkpk-success/10 border border-bkpk-success/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-bkpk-success animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-tighter text-bkpk-success">Online</span>
                    </div>
                </div>
            </div>

            {/* Hover Ambient Glow */}
            <div className="absolute inset-0 -z-10 bg-bkpk-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>
    );
}
