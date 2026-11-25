function LoadingState({ count = 6, caption = "Loading gadgets..." }) {
  return (
    <div>
      <div className="mb-4 text-sm text-slate-500">{caption}</div>
      <div className="grid grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="h-[430px] animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

export default LoadingState;
