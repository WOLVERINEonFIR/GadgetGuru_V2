function RetryErrorCard({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-5">
      <div className="text-sm font-semibold text-rose-700">Could not load data</div>
      <div className="mt-2 text-sm text-rose-600">{message}</div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:-translate-y-0.5"
      >
        Retry
      </button>
    </div>
  );
}

export default RetryErrorCard;
