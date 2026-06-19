export const participantStatuses = [
  "Inscrito",
  "Selecionado",
  "Ativo",
  "Desistente",
  "Concluído",
] as const;

export type ParticipantStatus = (typeof participantStatuses)[number];

export type Participant = {
  id: string;
  projectId: string;
  fullName: string;
  document: string;
  birthDate: string;
  phone: string;
  email: string;
  city: string;
  neighborhood: string;
  address: string;
  photoUrl: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  imageAuthorization: boolean;
  participationAuthorization: boolean;
  imageAuthorizationFileName: string | null;
  participationAuthorizationFileName: string | null;
  pedagogicalNotes: string;
  status: ParticipantStatus;
  attendanceRate: number;
};
