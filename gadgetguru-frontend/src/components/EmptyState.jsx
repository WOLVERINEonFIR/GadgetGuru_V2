function EmptyState({ title = "Nothing here yet", message = "Try adjusting your filters or browsing the live catalog." }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <div className="text-lg font-semibold text-slate-900">{title}</div>
      <div className="mt-2 text-sm text-slate-500">{message}</div>
    </div>
  );
}

export default EmptyState;
