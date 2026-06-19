export function AttendanceStatus({ rate }: { rate: number }) {
  const isAtRisk = rate < 75;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Presença</span>
        <span className={isAtRisk ? "font-semibold text-red-600" : "font-semibold text-emerald-700"}>{rate}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={isAtRisk ? "h-full rounded-full bg-red-500" : "h-full rounded-full bg-emerald-500"}
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  );
}
