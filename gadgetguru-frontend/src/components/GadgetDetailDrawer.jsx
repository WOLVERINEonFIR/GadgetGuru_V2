import { BadgePercent, BatteryCharging, ExternalLink, Monitor, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGadgetUI } from "../context/GadgetContext";
import { useGadget } from "../hooks/useGadget";
import { formatPrice, getGadgetPriceUrl } from "../lib/gadgetData";
import { specConfig } from "../lib/specs";
import ProductCardSkeleton from "./ProductCardSkeleton";
import RetryErrorCard from "./RetryErrorCard";
import SpecSection from "./SpecSection";

const tabs = ["Overview", "Specs", "Variants", "Offers"];

function DrawerImage({ src, alt, category }) {
  const [failed, setFailed] = useState(false);
  const isPhone = category === "Phones";

  if (!src || failed) {
    return (
      <div
        className={[
          "w-full rounded-2xl bg-[linear-gradient(135deg,#dbeafe,#e2e8f0,#f8fafc)]",
          isPhone ? "aspect-[4/5]" : "aspect-video",
        ].join(" ")}
      />
    );
  }

  if (isPhone) {
    return (
      <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top,#eff6ff,transparent_55%),linear-gradient(180deg,#f8fbff_0%,#eef2f7_100%)] px-8 py-5">
        <div className="absolute inset-x-10 top-5 h-8 rounded-full bg-white/50 blur-2xl" />
        <div className="relative flex h-full max-h-[460px] w-full max-w-[250px] items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
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
      className="aspect-video w-full rounded-2xl object-cover"
    />
  );
}

function GadgetDetailDrawer() {
  const navigate = useNavigate();
  const { activeDrawerGadget, closeDrawer, addToCompare } = useGadgetUI();
  const [activeTab, setActiveTab] = useState("Overview");
  const { data, loading, error, retry } = useGadget(activeDrawerGadget?.id);

  useEffect(() => {
    setActiveTab("Overview");
  }, [activeDrawerGadget?.id]);

  const open = Boolean(activeDrawerGadget);
  const gadget = useMemo(() => data || activeDrawerGadget, [activeDrawerGadget, data]);
  const priceUrl = getGadgetPriceUrl(gadget);
  const specSections = useMemo(() => specConfig, []);

  return (
    <div className={`pointer-events-none fixed inset-0 z-[60] ${open ? "" : "hidden"}`}>
      <button
        type="button"
        className={`pointer-events-auto absolute inset-0 bg-white/70 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={closeDrawer}
        aria-label="Close product details"
      />

      <aside
        className={[
          "pointer-events-auto absolute right-0 top-0 flex h-full w-[560px] flex-col bg-white shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {activeDrawerGadget ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                  {activeDrawerGadget.brand}
                </div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {activeDrawerGadget.name}
                </div>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-500 hover:text-blue-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {loading ? (
                <div className="space-y-4">
                  <div className="aspect-video animate-pulse rounded-2xl bg-slate-200" />
                  <ProductCardSkeleton />
                </div>
              ) : error ? (
                <RetryErrorCard message={error} onRetry={retry} />
              ) : gadget ? (
                <>
                  <DrawerImage src={gadget.image} alt={gadget.name} category={gadget.category} />

                  <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-extrabold text-blue-600">{formatPrice(gadget.price)}</div>
                      <div className="pt-1 text-sm text-slate-400 line-through">
                        {formatPrice(gadget.originalPrice)}
                      </div>
                      <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {gadget.discountPercent}% off
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <BatteryCharging className="h-4 w-4 text-blue-600" />
                        {gadget.battery?.capacity_mah}
                        {gadget.category === "Phones" ? "mAh" : "Wh"} battery
                      </div>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-blue-600" />
                        {gadget.display?.size_inches}" display
                      </div>
                      <div className="flex items-center gap-2">
                        <BadgePercent className="h-4 w-4 text-blue-600" />
                        {gadget.trustScore}% trust score
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2 border-b border-slate-200 pb-3">
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={[
                          "rounded-full px-4 py-2 text-sm font-semibold transition",
                          activeTab === tab
                            ? "bg-blue-600 text-white"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                        ].join(" ")}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {activeTab === "Overview" ? (
                    <div className="mt-6 space-y-3">
                      {[
                        {
                          label: "Price",
                          value: gadget?.variants?.[0]?.price_inr,
                        },
                        {
                          label: "RAM",
                          value: gadget?.variants?.[0]?.ram_gb,
                        },
                        {
                          label: "Storage",
                          value: gadget?.variants?.[0]?.storage_gb,
                        },
                        {
                          label: "Battery",
                          value: gadget?.battery?.capacity_mah,
                        },
                        {
                          label: "Display",
                          value: gadget?.display?.size_inches,
                        },
                        {
                          label: "Processor",
                          value: gadget?.performance?.chipset,
                        },
                      ].map((item) => {
                        if (!item.value) return null;

                        return (
                          <div
                            key={item.label}
                            className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                          >
                            <span className="text-slate-500">{item.label}</span>
                            <span className="font-semibold text-slate-900">
                              {item.label === "Price"
                                ? formatPrice(item.value)
                                : item.label === "Battery"
                                  ? `${item.value} mAh`
                                  : item.label === "Display"
                                    ? `${item.value}"`
                                    : typeof item.value === "object"
                                      ? item.value?.model ?? item.value?.name ?? JSON.stringify(item.value)
                                      : item.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {activeTab === "Specs" ? (
                    <div className="mt-6 grid grid-cols-1 gap-4">
                      {specSections.map((section) => (
                        <SpecSection
                          key={section.section}
                          section={section}
                          device={gadget}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        />
                      ))}
                    </div>
                  ) : null}

                  {activeTab === "Variants" ? (
                    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3">RAM</th>
                            <th className="px-4 py-3">Storage</th>
                            <th className="px-4 py-3">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(gadget.variants || []).map((variant, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-4 py-3">{variant.ram_gb} GB</td>
                              <td className="px-4 py-3">{variant.storage_gb} GB</td>
                              <td className="px-4 py-3 text-blue-600">
                                {formatPrice(variant.price_inr)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  {activeTab === "Offers" ? (
                    <div className="mt-6 space-y-3">
                      {(gadget.offers || []).map((offer) => (
                        <div key={offer.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold text-slate-900">{offer.title}</div>
                            <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              {offer.status}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-slate-500">{offer.description}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="sticky bottom-0 grid grid-cols-2 gap-3 border-t border-slate-200 bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  addToCompare(gadget);
                  navigate("/compare");
                }}
                className="h-12 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-700"
              >
                Compare
              </button>
              <button
                type="button"
                onClick={() => {
                  if (priceUrl) {
                    window.open(priceUrl, "_blank", "noopener,noreferrer");
                  }
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                View Price
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : null}
      </aside>
    </div>
  );
}

export default GadgetDetailDrawer;
