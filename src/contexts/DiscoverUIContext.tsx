import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DiscoverUIContextType {
  uiVisible: boolean;
  setUiVisible: (visible: boolean) => void;
  toggleUI: () => void;
}

const DiscoverUIContext = createContext<DiscoverUIContextType | undefined>(undefined);

export const DiscoverUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [uiVisible, setUiVisible] = useState(true);

  const toggleUI = () => {
    setUiVisible(prev => !prev);
  };

  return (
    <DiscoverUIContext.Provider value={{ uiVisible, setUiVisible, toggleUI }}>
      {children}
    </DiscoverUIContext.Provider>
  );
};

export const useDiscoverUI = () => {
  const context = useContext(DiscoverUIContext);
  if (!context) {
    // Return default values when not in provider (for non-discover pages)
    return {
      uiVisible: true,
      setUiVisible: () => {},
      toggleUI: () => {},
    };
  }
  return context;
};
