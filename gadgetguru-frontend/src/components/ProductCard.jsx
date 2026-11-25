import { BatteryCharging, Bookmark, ExternalLink, Gauge, HardDrive, MemoryStick, Star } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGadgetUI } from "../context/GadgetContext";
import { formatPrice, getGadgetPriceUrl } from "../lib/gadgetData";

function ImageFallback() {
  return <div className="h-full w-full bg-[linear-gradient(135deg,#dbeafe,#e2e8f0,#f8fafc)]" />;
}

function ProductImage({ src, alt, compact = false, category }) {
  const [failed, setFailed] = useState(false);
  const isPhone = category === "Phones";

  if (!src || failed) {
    return (
      <div className={compact ? "h-full w-full overflow-hidden" : "aspect-[4/3] w-full"}>
        <ImageFallback />
      </div>
    );
  }

  if (!compact && isPhone) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-[radial-gradient(circle_at_top,#eff6ff,transparent_55%),linear-gradient(180deg,#f8fbff_0%,#eef2f7_100%)] px-6 py-5">
        <div className="flex h-full max-h-[245px] w-full max-w-[165px] items-center justify-center rounded-[1.75rem] border border-slate-200 bg-white p-2.5 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={compact ? "h-full w-full object-cover" : "aspect-[4/3] w-full object-cover"}
    />
  );
}

function SpecsLine({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
      <Icon className="h-4 w-4 text-blue-600" />
      <span className="font-semibold text-slate-900">{value}</span>
      <span className="text-slate-500">{label}</span>
    </div>
  );
}

function ProductCard({ gadget, layout = "grid" }) {
  const navigate = useNavigate();
  const {
    addToCompare,
    addToWatchlist,
    compareList,
    isInCompare,
    isInWatchlist,
    openDrawer,
    removeFromWatchlist,
  } = useGadgetUI();
  const listLayout = layout === "list";
  const priceUrl = getGadgetPriceUrl(gadget);

  return (
    <article
      className={[
        "classic-card group h-full overflow-hidden border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md",
        listLayout ? "grid grid-cols-[320px_1fr]" : "flex flex-col",
      ].join(" ")}
    >
      <div className="relative overflow-hidden bg-slate-100">
        <ProductImage src={gadget.image} alt={gadget.name} compact={listLayout} category={gadget.category} />
        {gadget.reason ? (
          <p className="mt-2 text-xs italic text-blue-700">{gadget.reason}</p>
        ) : null}
        <button
          type="button"
          onClick={() => (isInWatchlist(gadget.id) ? removeFromWatchlist(gadget.id) : addToWatchlist(gadget))}
          className={[
            "absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition",
            isInWatchlist(gadget.id)
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-white/80 bg-white/90 text-slate-600 hover:border-blue-500 hover:text-blue-600",
          ].join(" ")}
          aria-label="Toggle watchlist"
        >
          <Bookmark className={`h-4 w-4 ${isInWatchlist(gadget.id) ? "fill-current" : ""}`} />
        </button>
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 transition group-hover:bg-slate-950/35">
          <button
            type="button"
            onClick={() => openDrawer(gadget)}
            className="translate-y-3 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 opacity-0 shadow-sm transition group-hover:translate-y-0 group-hover:opacity-100"
          >
            Quick View
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {gadget.brand}
            {gadget.stretch ? (
              <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                Stretch pick
              </div>
            ) : null}
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${gadget.valueRank.tone}`}>
            {gadget.valueRank.label}
          </div>
        </div>

        <div className="text-lg font-semibold leading-7 text-slate-900">{gadget.name}</div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {gadget.ram}GB RAM
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {gadget.storage}GB
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {gadget.category}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SpecsLine icon={BatteryCharging} value={gadget.battery || "--"} label={gadget.category === "Phones" ? "mAh" : "Wh"} />
          <SpecsLine icon={MemoryStick} value={`${gadget.ram}GB`} label="RAM" />
          <SpecsLine icon={Gauge} value={`${gadget.trustScore}%`} label="Rank" />
        </div>

        {listLayout ? (
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-slate-600">
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <div className="font-semibold text-slate-900">Chipset</div>
              <div className="mt-1 line-clamp-2">{gadget.chipset}</div>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <div className="font-semibold text-slate-900">Display</div>
              <div className="mt-1">
                {gadget.display}" · {gadget.refreshRate}Hz
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <div className="font-semibold text-slate-900">Storage</div>
              <div className="mt-1 flex items-center gap-1">
                <HardDrive className="h-4 w-4 text-blue-600" />
                {gadget.storage}GB
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex items-end gap-3">
          <div className="text-2xl font-extrabold text-blue-600">{formatPrice(gadget.price)}</div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <button
            type="button"
            onClick={() => {
              if (priceUrl) window.open(priceUrl, "_blank", "noopener,noreferrer");
            }}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
          >
            View Price
            <ExternalLink className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openDrawer(gadget)}
            className="h-11 rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            View Details
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
