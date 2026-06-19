"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";

import { formatCurrency } from "@/lib/utils/format-currency";

export function FinancePieChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  return (
    <PieChart width={160} height={160}>
      <Pie data={data} innerRadius={44} outerRadius={68} dataKey="value">
        {data.map((entry) => (
          <Cell key={entry.name} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
    </PieChart>
  );
}
