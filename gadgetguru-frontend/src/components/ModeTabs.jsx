function ModeTabs({ mode, setMode, deviceType, setDeviceType }) {
  return (
    <div className="flex overflow-x-auto whitespace-nowrap scroll-smooth no-scrollbar items-center justify-between gap-3">
      <select
        value={deviceType}
        onChange={(e) => setDeviceType(e.target.value)}
        className="mr-4 rounded-md border px-3 py-2 bg-white"
        aria-label="Select device type"
      >
        <option value="phones">Phones</option>
        <option value="laptops">Laptops</option>
        <option value="tablets">Tablets</option>
      </select>

      <div role="tablist" aria-label="Recommendation modes" className="flex overflow-x-auto no-scrollbar">
        <button
          role="tab"
          id="regular-mode-tab"
          aria-controls="recommend-mode-panel"
          aria-selected={mode === "regular"}
          tabIndex={mode === "regular" ? 0 : -1}
          onClick={() => setMode("regular")}
          className="tab-btn"
          type="button"
        >
          Regular Mode
        </button>
        <button
          role="tab"
          id="techie-mode-tab"
          aria-controls="recommend-mode-panel"
          aria-selected={mode === "techie"}
          tabIndex={mode === "techie" ? 0 : -1}
          onClick={() => setMode("techie")}
          className="tab-btn"
          type="button"
        >
          Techie Mode
        </button>
      </div>
    </div>
  );
}

export default ModeTabs;
