export function ProjectProgress({
  approved,
  executed,
}: {
  approved: number;
  executed: number;
}) {
  const percent = approved > 0 ? Math.round((executed / approved) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Execução financeira</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
