import { createContext, useContext, useEffect, useMemo, useState } from "react";

const GadgetContext = createContext(null);
const CURRENT_STORAGE_PREFIX = "gadgetguru";
const LEGACY_STORAGE_PREFIX = ["gadget", "iq"].join("");

function readStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function readStorageWithLegacy(key, legacyKey, fallback) {
  const current = readStorage(key, undefined);
  if (current !== undefined) return current;
  return readStorage(legacyKey, fallback);
}

export function GadgetProvider({ children }) {
  const [watchlist, setWatchlist] = useState(() =>
    readStorageWithLegacy(`${CURRENT_STORAGE_PREFIX}-watchlist`, `${LEGACY_STORAGE_PREFIX}-watchlist`, [])
  );
  const [compareList, setCompareList] = useState(() =>
    readStorageWithLegacy(`${CURRENT_STORAGE_PREFIX}-compare`, `${LEGACY_STORAGE_PREFIX}-compare`, [])
  );
  const [activeDrawerGadget, setActiveDrawerGadget] = useState(null);
  const [classicMode, setClassicMode] = useState(() =>
    readStorageWithLegacy(`${CURRENT_STORAGE_PREFIX}-classic`, `${LEGACY_STORAGE_PREFIX}-classic`, false)
  );
  const [darkMode, setDarkMode] = useState(() =>
    readStorageWithLegacy(`${CURRENT_STORAGE_PREFIX}-dark`, `${LEGACY_STORAGE_PREFIX}-dark`, false)
  );

  useEffect(() => {
    window.localStorage.setItem(`${CURRENT_STORAGE_PREFIX}-watchlist`, JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    window.localStorage.setItem(`${CURRENT_STORAGE_PREFIX}-compare`, JSON.stringify(compareList));
  }, [compareList]);

  useEffect(() => {
    window.localStorage.setItem(`${CURRENT_STORAGE_PREFIX}-classic`, JSON.stringify(classicMode));
  }, [classicMode]);

  useEffect(() => {
    window.localStorage.setItem(`${CURRENT_STORAGE_PREFIX}-dark`, JSON.stringify(darkMode));
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const value = useMemo(
    () => ({
      watchlist,
      compareList,
      activeDrawerGadget,
      classicMode,
      darkMode,
      addToWatchlist: (gadget) =>
        setWatchlist((current) =>
          current.some((item) => item.id === gadget.id) ? current : [...current, gadget]
        ),
      removeFromWatchlist: (id) =>
        setWatchlist((current) => current.filter((item) => item.id !== id)),
      addToCompare: (gadget) =>
        setCompareList((current) => {
          if (current.some((item) => item.id === gadget.id)) return current;
          if (current.length >= 3) return current;
          return [...current, gadget];
        }),
      removeFromCompare: (id) =>
        setCompareList((current) => current.filter((item) => item.id !== id)),
      clearCompare: () => setCompareList([]),
      openDrawer: (gadget) => setActiveDrawerGadget(gadget),
      closeDrawer: () => setActiveDrawerGadget(null),
      toggleClassicMode: () => setClassicMode((current) => !current),
      toggleDarkMode: () => setDarkMode((current) => !current),
      isInWatchlist: (id) => watchlist.some((item) => item.id === id),
      isInCompare: (id) => compareList.some((item) => item.id === id),
    }),
    [activeDrawerGadget, classicMode, compareList, darkMode, watchlist]
  );

  return <GadgetContext.Provider value={value}>{children}</GadgetContext.Provider>;
}

export function useGadgetUI() {
  const context = useContext(GadgetContext);
  if (!context) {
    throw new Error("useGadgetUI must be used within GadgetProvider");
  }
  return context;
}
