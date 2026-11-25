import { Bookmark, Trash2 } from "lucide-react";
import { useState } from "react";
import { useGadgetUI } from "../context/GadgetContext";
import { formatPrice, watchlistOffers } from "../lib/gadgetData";

function WatchImage({ src, alt }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className="h-14 w-14 rounded-xl bg-[linear-gradient(135deg,#dbeafe,#e2e8f0,#f8fafc)]" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-14 w-14 rounded-xl object-cover"
    />
  );
}

function WatchlistSidebar() {
  const { watchlist, removeFromWatchlist } = useGadgetUI();

  return (
    <aside className="classic-card sticky top-20 w-[240px] self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Watchlist</h3>
        <Bookmark className="h-4 w-4 text-blue-600" />
      </div>

      {watchlist.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <svg viewBox="0 0 120 120" className="mx-auto h-20 w-20 text-slate-300" fill="none" aria-hidden="true">
            <path d="M38 24C38 19.6 41.6 16 46 16H74C78.4 16 82 19.6 82 24V98L60 83L38 98V24Z" stroke="currentColor" strokeWidth="8" strokeLinejoin="round" />
          </svg>
          <div className="mt-4 text-sm font-semibold text-slate-700">Save gadgets to compare later</div>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {watchlist.map((gadget) => (
            <div key={gadget.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex gap-3">
                <WatchImage src={gadget.image} alt={gadget.name} />
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm font-semibold text-slate-900">{gadget.name}</div>
                  <div className="mt-1 text-sm font-bold text-blue-600">{formatPrice(gadget.price)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromWatchlist(gadget.id)}
                  className="h-8 w-8 rounded-lg text-slate-400 transition hover:bg-white hover:text-rose-500"
                  aria-label="Remove gadget"
                >
                  <Trash2 className="mx-auto h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-7">
        <div className="text-sm font-bold text-slate-900">Current Offers</div>
        <div className="mt-3 space-y-3">
          {watchlistOffers.map((offer) => (
            <div key={offer.title} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">{offer.title}</div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  {offer.status}
                </span>
              </div>
              <div className="mt-1 text-xs leading-5 text-slate-500">{offer.description}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default WatchlistSidebar;
