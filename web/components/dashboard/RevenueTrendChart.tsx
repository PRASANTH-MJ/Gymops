"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface RevenueTrendChartProps {
  data: Array<{ date: string; income: number }>;
}

const WIDTH = 640;
const HEIGHT = 220;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const innerWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const maxIncome = Math.max(...data.map((d) => d.income), 1);

  const points = useMemo(
    () =>
      data.map((d, i) => {
        const x = PAD_LEFT + (data.length === 1 ? innerWidth / 2 : (i / (data.length - 1)) * innerWidth);
        const y = PAD_TOP + innerHeight - (d.income / maxIncome) * innerHeight;
        return { x, y, ...d };
      }),
    [data, innerWidth, innerHeight, maxIncome]
  );

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${PAD_TOP + innerHeight} L ${points[0]?.x ?? 0} ${PAD_TOP + innerHeight} Z`;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let closest = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relativeX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHoverIndex(closest);
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const gridLines = [0.25, 0.5, 0.75, 1];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {gridLines.map((g) => (
          <line
            key={g}
            x1={PAD_LEFT}
            x2={WIDTH - PAD_RIGHT}
            y1={PAD_TOP + innerHeight * (1 - g)}
            y2={PAD_TOP + innerHeight * (1 - g)}
            stroke="hsl(var(--border))"
            strokeWidth={1}
          />
        ))}

        <path d={areaPath} fill="hsl(var(--primary))" fillOpacity={0.08} stroke="none" />
        <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          <circle
            key={p.date}
            cx={p.x}
            cy={p.y}
            r={hoverIndex === i ? 5 : 3}
            fill="hsl(var(--primary))"
            stroke="hsl(var(--card))"
            strokeWidth={1.5}
          />
        ))}

        {hovered && (
          <line
            x1={hovered.x}
            x2={hovered.x}
            y1={PAD_TOP}
            y2={PAD_TOP + innerHeight}
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.35}
            strokeWidth={1}
          />
        )}

        {points.map((p, i) => {
          const showLabel = data.length <= 7 || i % Math.ceil(data.length / 7) === 0;
          if (!showLabel) return null;
          return (
            <text
              key={`label-${p.date}`}
              x={p.x}
              y={HEIGHT - 8}
              textAnchor="middle"
              fontSize={10}
              fill="hsl(var(--muted-foreground))"
            >
              {new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
            </text>
          );
        })}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: `${(hovered.x / WIDTH) * 100}%` }}
        >
          <div className="font-semibold">{formatCurrency(hovered.income)}</div>
          <div className="text-muted-foreground">
            {new Date(hovered.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>
      )}
    </div>
  );
}
