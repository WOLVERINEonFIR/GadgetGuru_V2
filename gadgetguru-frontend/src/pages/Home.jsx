import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import RetryErrorCard from "../components/RetryErrorCard";
import { useGadgets } from "../hooks/useGadgets";

function Home() {
  const [visibleCount, setVisibleCount] = useState(8);
  const { data: gadgets = [], loading, error, retry } = useGadgets({
    categories: ["Phones"],
  });
  
  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-12">
      <Hero />

      <section className="rounded-[2rem] border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Live Catalog</div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
              Fresh gadgets, clean presentation
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
              Every card is aligned for quick scanning, with backend-backed pricing and clearer purchase confidence.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Showing {loading ? "..." : gadgets.length} gadgets
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Backend synced
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Trust-first ranking
            </div>
          </div>
        </div>

        {error ? <div className="mt-8"><RetryErrorCard message={error} onRetry={retry} /></div> : null}

        {loading ? (
          <div className="mt-8 grid grid-cols-4 gap-6">
            <ProductCardSkeleton count={8} />
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-4 gap-6">
              {gadgets.slice(0, visibleCount).map((gadget) => (
                <ProductCard key={gadget.id} gadget={gadget} />
              ))}
            </div>

            {visibleCount < gadgets.length ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((current) => current + 8)}
                  className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-1 hover:border-blue-500 hover:text-blue-700 hover:shadow-md"
                >
                  Load More
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

export default Home;
