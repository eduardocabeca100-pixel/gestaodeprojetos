import type { Profile } from "./types";

export async function listUsers(): Promise<Profile[]> {
  return [
    {
      id: "admin-eduardo",
      name: "Eduardo / Marcel",
      email: "admin@viva.local",
      role: "admin",
      avatar_url: null,
      is_active: true,
      created_at: "2026-06-18T00:00:00.000Z",
      updated_at: "2026-06-18T00:00:00.000Z",
    },
    {
      id: "diretor",
      name: "Direção executiva",
      email: "direcao@viva.local",
      role: "diretor_executivo",
      avatar_url: null,
      is_active: true,
      created_at: "2026-06-18T00:00:00.000Z",
      updated_at: "2026-06-18T00:00:00.000Z",
    },
  ];
}
