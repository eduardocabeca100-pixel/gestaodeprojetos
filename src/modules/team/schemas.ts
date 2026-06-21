import { z } from "zod";

import { paymentStatuses, teamRoles } from "./types";

export const teamMemberSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(2),
  role: z.enum(teamRoles),
  phone: z.string().min(8),
  email: z.email(),
  document: z.string().min(5),
  expectedAmount: z.coerce.number().min(0),
  paidAmount: z.coerce.number().min(0),
  paymentStatus: z.enum(paymentStatuses),
  notes: z.string().optional(),
});

export const teamRosterMemberSchema = z.object({
  name: z.string().min(2),
  role: z.enum(teamRoles),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  document: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  notes: z.string().optional(),
});

export const teamRosterAssignmentSchema = z.object({
  teamRosterId: z.string().min(1),
  projectId: z.string().min(1),
  expectedAmount: z.coerce.number().min(0),
  paidAmount: z.coerce.number().min(0),
  paymentStatus: z.enum(paymentStatuses),
  notes: z.string().optional(),
});
