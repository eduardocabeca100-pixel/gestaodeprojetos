export const activityTypes = [
  "Aula",
  "Ensaio",
  "Apresentação",
  "Reunião",
  "Prazo do edital",
  "Entrega de documento",
  "Pagamento",
  "Prestação de contas",
  "Divulgação",
  "Ensaio técnico",
  "Ensaio geral",
] as const;

export const activityStatuses = [
  "Agendada",
  "Realizada",
  "Cancelada",
  "Remarcada",
  "Pendente",
] as const;

export type ActivityType = (typeof activityTypes)[number];
export type ActivityStatus = (typeof activityStatuses)[number];

export type Activity = {
  id: string;
  projectId: string;
  title: string;
  type: ActivityType;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  responsible: string;
  description: string;
  status: ActivityStatus;
  attendanceCount: number;
  photoCount: number;
  documentCount: number;
  notes: string;
  lesson?: {
    number: number;
    theme: string;
    objective: string;
    content: string;
    practice: string;
    expectedResult: string;
    teacher: string;
    pedagogicalNotes: string;
  };
};
