export type VivaFontPreset = "arial" | "system" | "arial-black";
export type VivaMenuDensity = "compact" | "comfortable";

export type VivaAppearanceSettings = {
  fontPreset: VivaFontPreset;
  primaryColor: string;
  accentColor: string;
  sidebarWidth: number;
  menuDensity: VivaMenuDensity;
  showMenuIcons: boolean;
  showMenuLabels: boolean;
  logoDataUrl: string;
  darkLogoDataUrl: string;
  faviconDataUrl: string;
};

export const defaultAppearanceSettings: VivaAppearanceSettings = {
  fontPreset: "arial",
  primaryColor: "#1d4ed8",
  accentColor: "#7c3aed",
  sidebarWidth: 248,
  menuDensity: "compact",
  showMenuIcons: true,
  showMenuLabels: true,
  logoDataUrl: "",
  darkLogoDataUrl: "",
  faviconDataUrl: "",
};

const STORAGE_KEY = "viva.appearance.settings";

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function parseAppearanceSettings(raw: string | null): VivaAppearanceSettings {
  if (!raw) {
    return defaultAppearanceSettings;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<VivaAppearanceSettings>;

    return {
      ...defaultAppearanceSettings,
      ...parsed,
      sidebarWidth:
        typeof parsed.sidebarWidth === "number" && parsed.sidebarWidth > 0
          ? parsed.sidebarWidth
          : defaultAppearanceSettings.sidebarWidth,
      showMenuIcons:
        typeof parsed.showMenuIcons === "boolean"
          ? parsed.showMenuIcons
          : defaultAppearanceSettings.showMenuIcons,
      showMenuLabels:
        typeof parsed.showMenuLabels === "boolean"
          ? parsed.showMenuLabels
          : defaultAppearanceSettings.showMenuLabels,
    };
  } catch {
    return defaultAppearanceSettings;
  }
}

export function readAppearanceSettings(): VivaAppearanceSettings {
  if (!isBrowser()) {
    return defaultAppearanceSettings;
  }

  return parseAppearanceSettings(window.localStorage.getItem(STORAGE_KEY));
}

export function writeAppearanceSettings(settings: VivaAppearanceSettings) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function setFavicon(dataUrl: string) {
  if (!isBrowser()) {
    return;
  }

  const head = document.head;
  let link = head.querySelector<HTMLLinkElement>("link[rel~='icon']");

  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    head.appendChild(link);
  }

  link.href = dataUrl || "/globe.svg";
}

function setFontStack(preset: VivaFontPreset) {
  if (!isBrowser()) {
    return;
  }

  const root = document.documentElement;

  if (preset === "system") {
    root.style.setProperty("--font-viva-sans", "Arial, Helvetica, sans-serif");
    root.style.setProperty("--font-viva-heading", "Arial, Helvetica, sans-serif");
    root.style.setProperty("--viva-heading-weight", "700");
    return;
  }

  if (preset === "arial-black") {
    root.style.setProperty("--font-viva-sans", "Arial, Helvetica, sans-serif");
    root.style.setProperty("--font-viva-heading", "\"Arial Black\", Arial, Helvetica, sans-serif");
    root.style.setProperty("--viva-heading-weight", "900");
    return;
  }

  root.style.setProperty("--font-viva-sans", "Arial, Helvetica, sans-serif");
  root.style.setProperty("--font-viva-heading", "\"Arial Black\", Arial, Helvetica, sans-serif");
  root.style.setProperty("--viva-heading-weight", "900");
}

export function applyAppearanceSettings(settings: VivaAppearanceSettings) {
  if (!isBrowser()) {
    return;
  }

  const root = document.documentElement;

  root.dataset.vivaMenuDensity = settings.menuDensity;
  root.dataset.vivaMenuIcons = String(settings.showMenuIcons);
  root.dataset.vivaMenuLabels = String(settings.showMenuLabels);
  root.style.setProperty("--primary", settings.primaryColor);
  root.style.setProperty("--ring", settings.primaryColor);
  root.style.setProperty("--sidebar-primary", settings.primaryColor);
  root.style.setProperty("--sidebar-ring", settings.primaryColor);
  root.style.setProperty("--accent", settings.accentColor);
  root.style.setProperty("--sidebar-width", `${settings.sidebarWidth}px`);
  root.style.setProperty(
    "--viva-sidebar-width",
    `${Math.max(228, Math.min(280, settings.sidebarWidth))}px`,
  );
  root.style.setProperty("--viva-page-padding-x", settings.menuDensity === "compact" ? "1rem" : "1.25rem");
  root.style.setProperty("--viva-page-padding-y", settings.menuDensity === "compact" ? "0.9rem" : "1.1rem");
  root.style.setProperty("--viva-card-padding", settings.menuDensity === "compact" ? "0.875rem" : "1rem");
  root.style.setProperty("--viva-input-height", settings.menuDensity === "compact" ? "2.25rem" : "2.5rem");
  root.style.setProperty("--viva-button-height", settings.menuDensity === "compact" ? "2.25rem" : "2.5rem");
  root.style.setProperty("--viva-topbar-height", settings.menuDensity === "compact" ? "3.5rem" : "3.75rem");
  root.style.setProperty("--viva-sidebar-item-height", settings.menuDensity === "compact" ? "2rem" : "2.25rem");
  setFontStack(settings.fontPreset);
  setFavicon(settings.faviconDataUrl);
}

export async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}
