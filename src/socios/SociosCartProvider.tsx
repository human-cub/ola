import React, { createContext, useContext } from "react";
import { useSociosCart } from "./hooks/useSociosCart";

type Ctx = ReturnType<typeof useSociosCart>;

const SociosCartContext = createContext<Ctx | undefined>(undefined);

export const SociosCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useSociosCart();
  return <SociosCartContext.Provider value={value}>{children}</SociosCartContext.Provider>;
};

export const useSociosCartCtx = (): Ctx => {
  const ctx = useContext(SociosCartContext);
  if (!ctx) throw new Error("useSociosCartCtx must be used inside SociosCartProvider");
  return ctx;
};