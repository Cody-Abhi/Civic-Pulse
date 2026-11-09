"use client";

import * as React from "react";

const ViewOnlyContext = React.createContext<boolean>(false);

export function ViewOnlyProvider({
  viewOnly = false,
  children,
}: {
  viewOnly?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ViewOnlyContext.Provider value={viewOnly}>
      {children}
    </ViewOnlyContext.Provider>
  );
}

export function useViewOnly(): boolean {
  return React.useContext(ViewOnlyContext);
}

