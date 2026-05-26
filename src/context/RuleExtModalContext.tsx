import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface RuleExtModalState {
  openId: number | null;
  openRuleExt: (id: number) => void;
  closeRuleExt: () => void;
}

const RuleExtModalContext = createContext<RuleExtModalState | undefined>(undefined);

export function RuleExtModalProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<number | null>(null);

  const openRuleExt = useCallback((id: number) => {
    setOpenId(Number.isFinite(id) ? id : null);
  }, []);

  const closeRuleExt = useCallback(() => {
    setOpenId(null);
  }, []);

  const value = useMemo(
    () => ({ openId, openRuleExt, closeRuleExt }),
    [openId, openRuleExt, closeRuleExt],
  );

  return (
    <RuleExtModalContext.Provider value={value}>
      {children}
    </RuleExtModalContext.Provider>
  );
}

export function useRuleExtModal(): RuleExtModalState {
  const ctx = useContext(RuleExtModalContext);
  if (!ctx) {
    return {
      openId: null,
      openRuleExt: () => undefined,
      closeRuleExt: () => undefined,
    };
  }
  return ctx;
}
