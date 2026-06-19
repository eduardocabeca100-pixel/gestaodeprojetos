import type { Activity } from "./types";

const lessonTitles = [
  "Acolhimento e integração",
  "História do teatro e linguagens cênicas",
  "Leitura do roteiro Reféns",
  "Corpo, expressão e presença",
  "Voz, respiração e projeção",
  "Improvisação e jogo teatral",
  "Montagem das primeiras cenas",
  "Cenas centrais e ritmo",
  "Final, coro e cenas coletivas",
  "Ensaio corrido e ajustes de direção",
  "Ensaio geral pedagógico e fechamento",
];

const lessonDates = [
  "2026-08-05",
  "2026-08-08",
  "2026-08-11",
  "2026-08-14",
  "2026-08-17",
  "2026-08-20",
  "2026-08-23",
  "2026-08-26",
  "2026-08-29",
  "2026-09-01",
  "2026-09-04",
];

export const activities: Activity[] = lessonTitles.map((title, index) => ({
  id: `aula-${index + 1}`,
  projectId: "refens",
  title,
  type: index === 10 ? "Ensaio geral" : "Aula",
  date: lessonDates[index],
  startTime: "19:00",
  endTime: "22:00",
  location: "Cia de Artes Viva",
  responsible: "Professor/formador",
  description: `Encontro ${index + 1} da formação do projeto Reféns.`,
  status: index < 2 ? "Realizada" : "Agendada",
  attendanceCount: index < 2 ? 18 : 0,
  photoCount: index < 2 ? 12 : 0,
  documentCount: index < 2 ? 1 : 0,
  notes: "Registrar presença, fotos e observações pedagógicas.",
  lesson: {
    number: index + 1,
    theme: title,
    objective: "Desenvolver repertório técnico e criativo para a montagem.",
    content: "Exercícios cênicos, leitura, composição e reflexão coletiva.",
    practice: "Jogos teatrais e criação de cena.",
    expectedResult: "Participantes aptos a avançar para a etapa seguinte.",
    teacher: "Formador da Cia de Artes Viva",
    pedagogicalNotes: "Acompanhar evolução individual e coletiva.",
  },
}));

export async function listActivities() {
  return activities;
}

export async function listUpcomingActivities() {
  return activities.filter((activity) => activity.status === "Agendada").slice(0, 4);
}
