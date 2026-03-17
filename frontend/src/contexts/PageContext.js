import React, { createContext, useContext } from 'react';

const PageContext = createContext();

export const PageProvider = ({ children, pageBlocks }) => {
  return (
    <PageContext.Provider value={{ pageBlocks }}>
      {children}
    </PageContext.Provider>
  );
};

export const usePageContext = () => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePageContext must be used within a PageProvider');
  }
  return context;
};
