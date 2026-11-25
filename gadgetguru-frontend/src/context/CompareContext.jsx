import { createContext, useCallback, useContext, useState } from 'react';
import { getGadgetId } from '../components/GadgetCard/gadgetUtils';

export const MAX_COMPARE_DEVICES = 3;

export const CompareContext = createContext(null);

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}

export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState('balanced');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const displayToast = useCallback((message) => {
    setToastMessage(message);
    setShowToast(true);
  }, []);

  const hideToast = useCallback(() => {
    setShowToast(false);
  }, []);

  const addToCompare = useCallback((device) => {
    setCompareList((prev) => {
      if (prev.length >= MAX_COMPARE_DEVICES) {
        displayToast(`Maximum ${MAX_COMPARE_DEVICES} devices allowed for comparison`);
        return prev;
      }
      const id = getGadgetId(device);
      if (prev.some((d) => getGadgetId(d) === id)) {
        displayToast('Device already in comparison list');
        return prev;
      }
      return [...prev, device];
    });
  }, [displayToast]);

  const removeFromCompare = useCallback((device) => {
    setCompareList((prev) => {
      const id = getGadgetId(device);
      return prev.filter((d) => getGadgetId(d) !== id);
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, []);

  const openCompareModal = useCallback(() => {
    if (compareList.length >= 2) {
      setIsModalOpen(true);
    }
  }, [compareList.length]);

  const closeCompareModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const isInCompare = useCallback(
    (device) => {
      const id = getGadgetId(device);
      return compareList.some((d) => getGadgetId(d) === id);
    },
    [compareList]
  );

  const value = {
    compareList,
    isModalOpen,
    selectedIntent,
    setSelectedIntent,
    toastMessage,
    showToast,
    hideToast,
    addToCompare,
    removeFromCompare,
    clearCompare,
    openCompareModal,
    closeCompareModal,
    isInCompare,
  };

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}
