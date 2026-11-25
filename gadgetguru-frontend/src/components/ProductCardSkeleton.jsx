function ProductCardSkeleton({ count = 1, layout = "grid" }) {
  return Array.from({ length: count }).map((_, index) => (
    <div
      key={`${layout}-${index}`}
      className={[
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        layout === "list" ? "grid grid-cols-[280px_1fr]" : "",
      ].join(" ")}
    >
      <div className={layout === "list" ? "h-full min-h-[320px] animate-pulse bg-slate-200" : "aspect-[4/3] animate-pulse bg-slate-200"} />
      <div className="space-y-4 p-5">
        <div className="flex justify-between gap-3">
          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="h-6 w-3/4 animate-pulse rounded-lg bg-slate-200" />
        <div className="flex gap-2">
          <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
        </div>
        <div className="h-5 w-1/2 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-8 w-1/3 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-11 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-11 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-11 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </div>
    </div>
  ));
}

export default ProductCardSkeleton;
