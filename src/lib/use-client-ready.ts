"use client";

import { useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
  void onStoreChange;
  return () => {};
}

export function useClientReady() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
