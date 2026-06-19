import type { Role } from "@/lib/auth/permissions";

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar_url: string | null;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
};
