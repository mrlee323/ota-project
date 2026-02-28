export function MainSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-20">
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[268px] shrink-0">
              <div className="h-[176px] bg-gray-200 rounded-2xl mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
