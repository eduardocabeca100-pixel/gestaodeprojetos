import { StatusBadge } from "@/components/shared/status-badge";

export function PaymentStatus({ value }: { value: string }) {
  return <StatusBadge value={value} />;
}
