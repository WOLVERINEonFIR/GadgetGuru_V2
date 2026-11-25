import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { formatPrice, quickPriceRanges } from "../lib/gadgetData";

const phonePreferences = ["balanced", "gaming", "camera", "battery", "display"];
const laptopPreferences = ["basic", "gaming", "coding", "productivity", "portability", "multimedia"];
const ramOptions = [0, 4, 6, 8, 12, 16, 32];
const storageOptions = [0, 64, 128, 256, 512, 1024];
const defaultCategories = ["Phones"];

function getPreferenceOptions(category) {
  return category === "Laptops" ? laptopPreferences : phonePreferences;
}

function getDefaultPriority(category) {
  return category === "Laptops" ? "basic" : "balanced";
}

function Section({ title, open, onToggle, children }) {
  return (
    <div className="border-b border-slate-100 pb-5 last:border-b-0">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between text-left">
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>
      {open ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

function FiltersSidebar({ filters, setFilters, categoryCounts, brandCounts }) {
  const [brandQuery, setBrandQuery] = useState("");
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [sections, setSections] = useState({
    category: true,
    brand: true,
    preference: true,
    price: true,
    sort: true,
    notes: true,
  });

  const selectedCategory = filters.categories.length === 1 ? filters.categories[0] : null;
  const brands = useMemo(() => Object.keys(brandCounts).sort(), [brandCounts]);
  const totalBrandMatches = useMemo(
    () => Object.values(brandCounts).reduce((sum, count) => sum + Number(count || 0), 0),
    [brandCounts]
  );
  const visibleBrands = brands.filter((brand) => brand.toLowerCase().includes(brandQuery.toLowerCase()));
  const shownBrands = showAllBrands ? visibleBrands : visibleBrands.slice(0, 6);
  const activeCategory = selectedCategory || "Phones";
  const preferenceOptions = getPreferenceOptions(activeCategory);
  const resetPriority = getDefaultPriority(activeCategory);
  const hasCategoryFilter = Boolean(selectedCategory);
  const hasPriorityFilter = Boolean(filters.priority) && filters.priority !== resetPriority;
  const activeFilterCount =
    (hasCategoryFilter ? 1 : 0) +
    filters.brands.length +
    (hasPriorityFilter ? 1 : 0) +
    (filters.minRam ? 1 : 0) +
    (filters.minStorage ? 1 : 0) +
    (filters.minPrice > 0 || filters.maxPrice < 200000 ? 1 : 0);

  const activeChips = [
    ...(hasCategoryFilter
      ? [
          {
            label: selectedCategory,
            onRemove: () =>
              setFilters((current) => ({
                ...current,
                categories: defaultCategories,
                brands: [],
                priority: getDefaultPriority("Phones"),
              })),
          },
        ]
      : []),
    ...filters.brands.map((value) => ({
      label: value,
      onRemove: () =>
        setFilters((current) => ({
          ...current,
          brands: current.brands.filter((item) => item !== value),
        })),
    })),
    ...(hasPriorityFilter
      ? [
          {
            label: filters.priority[0].toUpperCase() + filters.priority.slice(1),
            onRemove: () => setFilters((current) => ({ ...current, priority: resetPriority })),
          },
        ]
      : []),
    ...(filters.minRam
      ? [{ label: `${filters.minRam}GB RAM+`, onRemove: () => setFilters((current) => ({ ...current, minRam: 0 })) }]
      : []),
    ...(filters.minStorage
      ? [
          {
            label: filters.minStorage >= 1024 ? "1TB+" : `${filters.minStorage}GB+`,
            onRemove: () => setFilters((current) => ({ ...current, minStorage: 0 })),
          },
        ]
      : []),
  ];

  const toggleCategory = (category) => {
    setFilters((current) => {
      const nextPriority = getPreferenceOptions(category).includes(current.priority)
        ? current.priority
        : getDefaultPriority(category);

      return {
        ...current,
        categories: [category],
        brands: [],
        priority: nextPriority,
      };
    });
    setBrandQuery("");
    setShowAllBrands(false);
  };

  const toggleBrand = (brand) => {
    setFilters((current) => ({
      ...current,
      brands: current.brands.includes(brand)
        ? current.brands.filter((item) => item !== brand)
        : [...current.brands, brand],
    }));
  };

  const selectAllBrands = () => {
    setFilters((current) => ({
      ...current,
      brands: [],
    }));
  };

  return (
    <aside className="classic-card sticky top-20 w-[280px] self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-900">Filters</h3>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            {activeFilterCount}
          </span>
        </div>
        <button
          type="button"
          onClick={() =>
            setFilters({
              categories: defaultCategories,
              brands: [],
              minPrice: 0,
              maxPrice: 200000,
              sortBy: "value",
              priority: getDefaultPriority("Phones"),
              minRam: 0,
              minStorage: 0,
            })
          }
          className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          Reset All
        </button>
      </div>

      {activeChips.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.onRemove}
              className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6 space-y-5">
        <Section title="Category" open={sections.category} onToggle={() => setSections((current) => ({ ...current, category: !current.category }))}>
          <div className="space-y-3">
            {["Phones", "Laptops"].map((category) => (
              <label key={category} className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === category}
                    onChange={() => toggleCategory(category)}
                    className="h-4 w-4 border-slate-300 text-blue-600"
                  />
                  <span className="text-sm text-slate-700">{category}</span>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-500">
                  {categoryCounts[category] || 0}
                </span>
              </label>
            ))}
          </div>
        </Section>

        <Section title="Brand" open={sections.brand} onToggle={() => setSections((current) => ({ ...current, brand: !current.brand }))}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={brandQuery}
              onChange={(event) => setBrandQuery(event.target.value)}
              placeholder="Search brand"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500"
            />
          </div>
          <div className="mt-3 space-y-2">
            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={filters.brands.length === 0}
                  onChange={selectAllBrands}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span className="text-sm font-medium text-slate-700">All brands</span>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-500">
                {totalBrandMatches}
              </span>
            </label>
            {shownBrands.map((brand) => (
              <label key={brand} className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <span className="text-sm text-slate-700">{brand}</span>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                  {brandCounts[brand]}
                </span>
              </label>
            ))}
          </div>
          {visibleBrands.length > 6 ? (
            <button
              type="button"
              onClick={() => setShowAllBrands((current) => !current)}
              className="mt-3 text-sm font-semibold text-blue-600"
            >
              {showAllBrands ? "Show less" : "Show more"}
            </button>
          ) : null}
        </Section>

        <Section title="Intent" open={sections.preference} onToggle={() => setSections((current) => ({ ...current, preference: !current.preference }))}>
          <div className="flex flex-wrap gap-2">
            {preferenceOptions.map((preference) => (
              <button
                key={preference}
                type="button"
                onClick={() => setFilters((current) => ({ ...current, priority: preference }))}
                className={[
                  "rounded-full border px-3 py-2 text-xs font-semibold capitalize transition",
                  filters.priority === preference
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-500 hover:text-blue-700",
                ].join(" ")}
              >
                {preference}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <select
              value={filters.minRam}
              onChange={(event) => setFilters((current) => ({ ...current, minRam: Number(event.target.value) }))}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              {ramOptions.map((ram) => (
                <option key={ram} value={ram}>
                  {ram === 0 ? "RAM" : `${ram} GB+`}
                </option>
              ))}
            </select>
            <select
              value={filters.minStorage}
              onChange={(event) => setFilters((current) => ({ ...current, minStorage: Number(event.target.value) }))}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              {storageOptions.map((storage) => (
                <option key={storage} value={storage}>
                  {storage === 0 ? "Storage" : storage >= 1024 ? "1 TB+" : `${storage} GB+`}
                </option>
              ))}
            </select>
          </div>
        </Section>

        <Section title="Notes" open={sections.notes ?? true} onToggle={() => setSections((current) => ({ ...current, notes: !(current.notes ?? true) }))}>
          <textarea
            value={filters.userText || ""}
            onChange={(event) => setFilters((current) => ({ ...current, userText: event.target.value }))}
            placeholder="e.g. good low-light photos, long battery, compact size"
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
          />
          <p className="mt-2 text-xs text-slate-500">
            Optional. Describe what matters most — the AI will use it to rank phones.
          </p>
        </Section>

        <Section title="Price Range" open={sections.price} onToggle={() => setSections((current) => ({ ...current, price: !current.price }))}>
          <div className="relative pt-2">
            <div className="absolute left-0 right-0 top-[19px] h-1.5 rounded-full bg-slate-200" />
            <div
              className="absolute top-[19px] h-1.5 rounded-full bg-blue-600"
              style={{
                left: `${(filters.minPrice / 200000) * 100}%`,
                right: `${100 - (filters.maxPrice / 200000) * 100}%`,
              }}
            />
            <input
              type="range"
              min="0"
              max="200000"
              step="5000"
              value={filters.minPrice}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  minPrice: Math.min(Number(event.target.value), current.maxPrice - 5000),
                }))
              }
              className="relative z-10 w-full"
            />
            <input
              type="range"
              min="0"
              max="200000"
              step="5000"
              value={filters.maxPrice}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  maxPrice: Math.max(Number(event.target.value), current.minPrice + 5000),
                }))
              }
              className="relative z-10 -mt-6 w-full"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <input
              type="number"
              value={filters.minPrice}
              onChange={(event) => setFilters((current) => ({ ...current, minPrice: Number(event.target.value) || 0 }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(event) => setFilters((current) => ({ ...current, maxPrice: Number(event.target.value) || 200000 }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="mt-3 text-xs font-medium text-slate-500">
            {formatPrice(filters.minPrice)} to {formatPrice(filters.maxPrice)}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickPriceRanges.map((range) => (
              <button
                key={range.label}
                type="button"
                onClick={() => setFilters((current) => ({ ...current, minPrice: range.min, maxPrice: range.max }))}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-500 hover:text-blue-700"
              >
                {range.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Sort By" open={sections.sort} onToggle={() => setSections((current) => ({ ...current, sort: !current.sort }))}>
          <select
            value={filters.sortBy}
            onChange={(event) => setFilters((current) => ({ ...current, sortBy: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="value">Best Value</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="ratings">Ratings</option>
          </select>
        </Section>
      </div>
    </aside>
  );
}

export default FiltersSidebar;
