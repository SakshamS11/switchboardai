"use client";

import type { ReactNode } from "react";
import { useAppState } from "./app-state";

export function ActionButton({ children, action, target, type = "Configuration", secondary = false }: { children: ReactNode; action: string; target: string; type?: string; secondary?: boolean }) {
  const { simulateAction } = useAppState();
  return (
    <button className={`button ${secondary ? "secondary" : ""}`} type="button" onClick={() => simulateAction(action, target, type)}>
      {children}
    </button>
  );
}
