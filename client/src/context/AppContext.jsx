import { createContext, useContext } from 'react';

const AppContext = createContext({});

export function AppProvider({ children }) {
  // Populated by 003+ as global app state arrives. Empty for 001.
  return <AppContext.Provider value={{}}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
