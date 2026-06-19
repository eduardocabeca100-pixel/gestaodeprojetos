"use client";

import { useEffect } from "react";

import {
  applyAppearanceSettings,
  readAppearanceSettings,
} from "@/lib/appearance";

export function AppearanceSync() {
  useEffect(() => {
    const sync = () => applyAppearanceSettings(readAppearanceSettings());

    sync();

    const handleStorage = () => sync();
    const handleCustom = () => sync();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("viva:appearance-changed", handleCustom as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("viva:appearance-changed", handleCustom as EventListener);
    };
  }, []);

  return null;
}
