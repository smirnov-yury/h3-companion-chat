import type { ReactNode } from "react";
import { gridColsClass, type CardLayout } from "@/config/cardLayouts";

export function CardGrid({ layout, children }: { layout: CardLayout; children: ReactNode }) {
  return <div className={gridColsClass(layout)}>{children}</div>;
}
