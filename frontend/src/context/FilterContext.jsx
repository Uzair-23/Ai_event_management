import { createContext, useState, useEffect } from 'react';

export const FilterContext = createContext({
  stateSelection: 'All',
  setStateSelection: () => {},
});

export function FilterProvider({ children }) {
  const [stateSelection, setStateSelection] = useState(() => {
    try {
      return localStorage.getItem('stateSelection') || 'All';
    } catch { return 'All'; }
  });

  useEffect(() => {
    try { localStorage.setItem('stateSelection', stateSelection); } catch {}
  }, [stateSelection]);

  return (
    <FilterContext.Provider value={{ stateSelection, setStateSelection }}>
      {children}
    </FilterContext.Provider>
  );
}
