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
  neighborhood: string;
  address: string;
  guardianName: string | null;
  guardianPhone: string | null;
  imageAuthorization: boolean;
  participationAuthorization: boolean;
  pedagogicalNotes: string;
  status: ParticipantStatus;
  attendanceRate: number;
};
