"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAppStore = create(
  persist(
    (set, get) => ({
      recentIds: [],
      rememberTool(id) {
        const next = [id, ...get().recentIds.filter((item) => item !== id)].slice(0, 8);
        set({ recentIds: next });
      },
    }),
    { name: "anykit-local" }
  )
);
