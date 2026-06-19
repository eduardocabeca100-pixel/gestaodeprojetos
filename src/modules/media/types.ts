export const mediaTypes = [
  "Foto",
  "Print",
  "Cartaz",
  "Banner",
  "Link de vídeo",
  "Link de pasta externa",
] as const;

export const mediaCategories = [
  "Aulas",
  "Ensaios",
  "Apresentações",
  "Bastidores",
  "Divulgação",
  "Imprensa",
  "Prestação de contas",
  "Registro fotográfico",
  "Outros",
] as const;

export type MediaType = (typeof mediaTypes)[number];
export type MediaCategory = (typeof mediaCategories)[number];

export type MediaItem = {
  id: string;
  title: string;
  type: MediaType;
  projectId: string;
  activityId: string | null;
  registeredAt: string;
  location: string;
  description: string;
  url: string;
  category: MediaCategory;
  selectedForDossier: boolean;
};
