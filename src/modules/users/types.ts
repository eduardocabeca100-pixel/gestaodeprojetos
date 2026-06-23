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

export type UserProjectAccess = Pick<
  Profile,
  "id" | "name" | "email" | "role" | "is_active" | "must_change_password"
> & {
  projectIds: string[];
};
