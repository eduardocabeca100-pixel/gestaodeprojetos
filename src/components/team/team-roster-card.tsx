"use client";

import type { TeamRosterMember } from "@/modules/team/types";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";

interface TeamRosterCardProps {
  member: TeamRosterMember;
  onEdit?: (member: TeamRosterMember) => void;
  onDelete?: (id: string) => void;
}

export function TeamRosterCard({
  member,
  onEdit,
  onDelete,
}: TeamRosterCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">{member.name}</h3>
          <p className="text-sm text-slate-500">{member.role}</p>
          {member.email && (
            <p className="mt-2 text-xs text-slate-600">{member.email}</p>
          )}
          {member.phone && (
            <p className="text-xs text-slate-600">{member.phone}</p>
          )}
          {member.bio && (
            <p className="mt-2 line-clamp-2 text-xs text-slate-600">
              {member.bio}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(member)}
              className="h-8 w-8 p-0"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => onDelete(member.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
