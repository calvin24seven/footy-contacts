export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Sticky header skeleton */}
      <div className="sticky top-14 z-20 bg-navy-dark/95 backdrop-blur-sm border-b border-navy-light/40 px-4 sm:px-6 pt-4 pb-3">
        {/* Title + count row */}
        <div className="flex items-center justify-between mb-3">
          <div className="h-6 w-36 bg-navy-light rounded animate-pulse" />
          <div className="h-4 w-24 bg-navy-light rounded animate-pulse" />
        </div>
        {/* Search bar skeleton */}
        <div className="h-10 bg-navy-light rounded-xl animate-pulse mb-3" />
        {/* Filter chips skeleton */}
        <div className="flex gap-2">
          <div className="h-7 w-20 bg-navy-light rounded-lg animate-pulse" />
          <div className="h-7 w-24 bg-navy-light rounded-lg animate-pulse" />
          <div className="h-7 w-20 bg-navy-light rounded-lg animate-pulse" />
          <div className="h-7 w-22 bg-navy-light rounded-lg animate-pulse" />
          <div className="ml-auto h-7 w-28 bg-navy-light rounded-lg animate-pulse hidden sm:block" />
        </div>
      </div>

      {/* Results meta skeleton */}
      <div className="px-4 sm:px-6 py-3 border-b border-navy-light/30">
        <div className="h-4 w-32 bg-navy-light rounded animate-pulse" />
      </div>

      {/* Row skeletons */}
      <div className="flex flex-col gap-1 px-4 sm:px-6 pt-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 bg-navy-light rounded-xl animate-pulse"
          >
            {/* Org avatar circle */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-navy shrink-0" />

            {/* Text lines */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 bg-navy rounded w-36 sm:w-48" />
                <div className="h-4 bg-navy rounded w-16 hidden sm:block" />
              </div>
              <div className="h-3 bg-navy rounded w-48 sm:w-72" />
              <div className="flex gap-1.5 mt-1">
                <div className="h-5 w-20 bg-navy rounded-full" />
                <div className="h-5 w-20 bg-navy rounded-full" />
              </div>
            </div>

            {/* CTA area */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 bg-navy rounded-lg" />
              <div className="h-8 w-24 bg-navy rounded-lg hidden sm:block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
