import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import RetryErrorCard from "../components/RetryErrorCard";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useRecommendations } from "../hooks/useRecommendations";

const topOptions = [5, 10, 15, 20, "all"];
const allPageSize = 10;

function Results() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState("grid");
  const [visibleCount, setVisibleCount] = useState(10);
  const [allPage, setAllPage] = useState(1);
  const queryBrands = searchParams.getAll("brand");

  const filters = useMemo(
    () => ({
      categories: ["Phones", "Laptops"],
      brands: queryBrands.length
        ? queryBrands
        : Array.isArray(location.state?.filters?.brands)
        ? location.state.filters.brands
        : location.state?.filters?.brand
        ? [location.state.filters.brand]
        : [],
      minPrice: Number(searchParams.get("minPrice") || location.state?.filters?.min_price || 0),
      maxPrice: Number(searchParams.get("maxPrice") || location.state?.filters?.max_price || 200000),
      sortBy: "value",
      priority: searchParams.get("priority") || location.state?.filters?.priority || "balanced",
      minRam: Number(searchParams.get("ram") || 0),
      minStorage: Number(searchParams.get("storage") || 0),
    }),
    [location.state, queryBrands, searchParams]
  );

  const debouncedFilters = useDebouncedValue(filters, 300);
  const { data: filtered = [], loading, error, retry } = useRecommendations(debouncedFilters);
  const allPageCount = visibleCount === "all" ? Math.max(1, Math.ceil(filtered.length / allPageSize)) : 1;
  const visibleResults = useMemo(() => {
    if (visibleCount !== "all") return filtered.slice(0, visibleCount);
    const start = (allPage - 1) * allPageSize;
    return filtered.slice(start, start + allPageSize);
  }, [allPage, filtered, visibleCount]);

  useEffect(() => {
    setAllPage(1);
  }, [debouncedFilters, visibleCount]);

  useEffect(() => {
    setAllPage((current) => Math.min(current, allPageCount));
  }, [allPageCount]);

  return (
    <div className="mx-auto max-w-[1600px] rounded-[2rem] border border-slate-200 bg-white px-8 py-8 shadow-sm">
      <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Results</h1>
          <p className="mt-2 text-sm text-slate-500">
            Showing {loading ? "..." : visibleResults.length} of {filtered.length} gadgets
            {visibleCount === "all" && !loading ? ` · Page ${allPage} of ${allPageCount}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
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

      {error ? <div className="mt-6"><RetryErrorCard message={error} onRetry={retry} /></div> : null}

      {loading ? (
        <div className={viewMode === "grid" ? "mt-6 grid grid-cols-3 gap-6" : "mt-6 space-y-4"}>
          <ProductCardSkeleton count={6} layout={viewMode} />
        </div>
      ) : (
        <>
          <div className={viewMode === "grid" ? "mt-6 grid grid-cols-3 gap-6" : "mt-6 space-y-4"}>
            {visibleResults.map((gadget) => (
              <ProductCard key={gadget.id} gadget={gadget} layout={viewMode} />
            ))}
          </div>
          {visibleCount === "all" && allPageCount > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-6">
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
          ) : null}
        </>
      )}
    </div>
  );
}

export default Results;
