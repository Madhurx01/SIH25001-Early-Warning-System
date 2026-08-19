function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6 px-5 py-7 lg:px-8" role="status" aria-label="Loading dashboard data">
      <div className="h-8 w-72 rounded bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => <div className="h-36 rounded-2xl bg-white" key={index} />)}
      </div>
      <div className="h-96 rounded-2xl bg-white" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export default DashboardSkeleton;
