interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />;
}

export function NoteCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-20 h-5 rounded-full" />
      </div>
      <Skeleton className="w-3/4 h-4" />
      <div className="space-y-2">
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-5/6 h-3" />
        <Skeleton className="w-2/3 h-3" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="w-12 h-4 rounded-full" />
        <Skeleton className="w-14 h-4 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <Skeleton className="w-16 h-3" />
        <Skeleton className="w-4 h-4 rounded" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="w-12 h-12 rounded-xl" />
      </div>
      <Skeleton className="w-20 h-3" />
      <Skeleton className="w-14 h-8" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Skeleton className="w-full h-24 rounded-2xl" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <Skeleton className="w-full h-72 rounded-2xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
