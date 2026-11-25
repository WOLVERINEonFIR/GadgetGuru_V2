import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGadgetUI } from "../context/GadgetContext";
import FiltersSidebar from "../components/FiltersSidebar";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import RetryErrorCard from "../components/RetryErrorCard";
import { getCatalogCounts } from "../lib/gadgetData";
import { getRecommendations } from "../services/api";

const initialFilters = {
  categories: ["Phones"],
  brands: [],
  minPrice: 0,
  maxPrice: 200000,
  sortBy: "value",
  priority: "balanced",
  minRam: 0,
  minStorage: 0,
  userText: "",
};

const topOptions = [5, 10, 15, 20, "all"];
const allPageSize = 10;

function Recommend() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { compareList, removeFromCompare, clearCompare } = useGadgetUI();
  const initialBrands = searchParams.getAll("brand");
  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    brands: initialBrands.length ? initialBrands : [],
    minPrice: Number(searchParams.get("minPrice") || 0),
    maxPrice: Number(searchParams.get("maxPrice") || 200000),
    priority: searchParams.get("priority") || "balanced",
    minRam: Number(searchParams.get("ram") || 0),
    minStorage: Number(searchParams.get("storage") || 0),
    userText: searchParams.get("q") || "",
  }));
  const [viewMode, setViewMode] = useState("grid");
  const [visibleCount, setVisibleCount] = useState(10);
  const [allPage, setAllPage] = useState(1);
  const [submittedFilters, setSubmittedFilters] = useState(null);

  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(0);

  const counts = useMemo(() => ({ categoryCounts: {}, brandCounts: {} }), []);

  const runRecommend = async () => {
    setLoading(true);
    setError("");
    setHasSubmitted(true);
    setSubmittedAt(Date.now());
    try {
      const results = await getRecommendations(filters);
      setFiltered(results || []);
    } catch (err) {
      setError(err.message || "Failed to get recommendations.");
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };
  const allPageCount = visibleCount === "all" ? Math.max(1, Math.ceil(filtered.length / allPageSize)) : 1;
  const visibleResults = useMemo(() => {
    if (visibleCount !== "all") return filtered.slice(0, visibleCount);
    const start = (allPage - 1) * allPageSize;
    return filtered.slice(start, start + allPageSize);
  }, [allPage, filtered, visibleCount]);

  useEffect(() => {
    const next = new URLSearchParams();
    filters.brands.forEach((brand) => next.append("brand", brand));
    if (filters.minPrice) next.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice !== 200000) next.set("maxPrice", String(filters.maxPrice));
    if (filters.priority && filters.priority !== "balanced") next.set("priority", filters.priority);
    if (filters.minRam) next.set("ram", String(filters.minRam));
    if (filters.minStorage) next.set("storage", String(filters.minStorage));
    setSearchParams(next, { replace: true });
  }, [filters, setSearchParams]);

  useEffect(() => {
    setAllPage(1);
  }, [submittedAt, visibleCount]);

  useEffect(() => {
    setAllPage((current) => Math.min(current, allPageCount));
  }, [allPageCount]);

  return (
    <div className="mx-auto grid max-w-[1600px] grid-cols-[280px_minmax(0,1fr)] gap-6">
      <FiltersSidebar
        filters={filters}
        setFilters={setFilters}
        categoryCounts={counts.categoryCounts}
        brandCounts={counts.brandCounts}
      />

      <section className="rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Recommend</h1>
          <p className="mt-2 text-sm text-slate-500">
            {hasSubmitted
              ? loading
                ? "Asking the AI…"
                : `Showing ${visibleResults.length} of ${filtered.length} recommendations`
              : "Set your filters and click Recommend"}
          </p>
        </div>
          <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={runRecommend}
            disabled={loading}
            className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Thinking…" : "Recommend"}
          </button>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              Show top
              <select
                value={String(visibleCount)}
                onChange={(event) => setVisibleCount(event.target.value === "all" ? "all" : Number(event.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                {topOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "All" : option}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>


        {error ? <div className="mt-6"><RetryErrorCard message={error} onRetry={runRecommend} /></div> : null}
        

        {filtered[0]?.summary ? (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">AI summary: </span>
            {filtered[0].summary}
          </div>
        ) : null}


        {loading ? (
          <div className={viewMode === "grid" ? "mt-6 grid grid-cols-3 gap-6" : "mt-6 space-y-4"}>
            <ProductCardSkeleton count={6} layout={viewMode} />
          </div>
        ) : !hasSubmitted ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
            Pick a preference and click <span className="font-semibold text-slate-700">Recommend</span> to see AI picks.
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
            No phones matched. Try widening the price range.
          </div>
        ) : (
          <>
            <div className={viewMode === "grid" ? "mt-6 grid grid-cols-3 gap-6" : "mt-6 space-y-4"}>
              {visibleResults.map((gadget) => (
                <ProductCard key={gadget.id} gadget={gadget} layout={viewMode} />
              ))}
            </div>
            {visibleCount === "all" && allPageCount > 1 ? (
              <div className="flex items-center justify-center gap-3 pb-36 pt-6">
                <button
                  type="button"
                  onClick={() => setAllPage((current) => Math.max(1, current - 1))}
                  disabled={allPage === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:border-blue-500 hover:text-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="min-w-24 text-center text-sm font-semibold text-slate-600">
                  {allPage} / {allPageCount}
                </div>
                <button
                  type="button"
                  onClick={() => setAllPage((current) => Math.min(allPageCount, current + 1))}
                  disabled={allPage === allPageCount}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:border-blue-500 hover:text-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="pb-36" />
            )}
          </>
        )}
      </section>

      {compareList.length ? (
        <div className="pointer-events-none fixed bottom-4 left-[calc(50%+140px)] z-30 w-[min(1040px,calc(100vw-360px))] -translate-x-1/2">
          <div className="pointer-events-auto rounded-[1.4rem] border border-slate-200 bg-[linear-gradient(135deg,rgba(248,250,252,0.96)_0%,rgba(238,244,255,0.96)_100%)] px-4 py-3 shadow-[0_16px_36px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Compare Queue</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {compareList.length}/3 gadgets ready to compare from the recommendation page.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearCompare}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:border-rose-400 hover:text-rose-600"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/compare")}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-3.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  Open Compare
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-2.5 md:grid-cols-3">
              {compareList.map((gadget) => (
                <div key={gadget.id} className="rounded-xl border border-white/70 bg-white/90 px-3 py-2.5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold leading-5 text-slate-900">{gadget.name}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCompare(gadget.id)}
                      className="inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-slate-200 px-2 text-[11px] font-semibold text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 3 - compareList.length) }).map((_, index) => (
                <div
                  key={`empty-slot-${index}`}
                  className="flex min-h-[76px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-3 text-xs font-medium text-slate-400"
                >
                  Empty slot
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Recommend;
