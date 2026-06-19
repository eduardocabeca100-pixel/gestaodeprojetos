export type SettingField = {
  label: string;
  value: string;
  type: "text" | "textarea" | "toggle" | "color" | "number" | "select";
  lockedForDirector?: boolean;
};

export type SettingsSection = {
  id: string;
  title: string;
  description: string;
  fields: SettingField[];
};
