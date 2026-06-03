import { cn } from '../lib/utils'

type SkeletonVariant = 'line' | 'card' | 'avatar' | 'chart'

type SkeletonProps = {
  variant?: SkeletonVariant
  className?: string
}

const variantClasses: Record<SkeletonVariant, string> = {
  line: 'h-4 w-full rounded-md',
  card: 'h-32 w-full rounded-xl',
  avatar: 'h-12 w-12 rounded-full shrink-0',
  chart: 'h-[160px] sm:h-[220px] w-full rounded-xl',
}

export function Skeleton({ variant = 'line', className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-bkpk-surface-tint-2',
        variantClasses[variant],
        className
      )}
      aria-hidden
    />
  )
}

export function SkeletonCardGrid({ count = 4 }: { count?: number }) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className='rounded-xl p-4 border border-bkpk-border-subtle bg-bkpk-surface space-y-3'>
          <Skeleton variant='line' className='h-3 w-1/2' />
          <Skeleton variant='line' className='h-8 w-2/3' />
        </div>
      ))}
    </div>
  )
}
