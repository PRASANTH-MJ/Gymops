"use client";

import { useState } from "react";

interface PeakHoursChartProps {
  data: Array<{ hour: number; count: number }>;
}

const WIDTH = 640;
const HEIGHT = 160;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 8;
const PAD_BOTTOM = 24;

function formatHour(hour: number) {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}

export function PeakHoursChart({ data }: PeakHoursChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const innerWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const barWidth = innerWidth / data.length;
  const gap = barWidth * 0.25;

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
        {data.map((d, i) => {
          const barHeight = (d.count / maxCount) * innerHeight;
          const x = PAD_LEFT + i * barWidth + gap / 2;
          const y = PAD_TOP + innerHeight - barHeight;
          const showLabel = d.hour % 3 === 0;
          return (
            <g
              key={d.hour}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <rect x={x} y={PAD_TOP} width={barWidth - gap} height={innerHeight} fill="transparent" />
              <rect
                x={x}
                y={d.count === 0 ? PAD_TOP + innerHeight - 1 : y}
                width={barWidth - gap}
                height={d.count === 0 ? 1 : barHeight}
                rx={2}
                fill="hsl(var(--primary))"
                fillOpacity={hoverIndex === i ? 1 : 0.55}
              />
              {showLabel && (
                <text
                  x={x + (barWidth - gap) / 2}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  fontSize={9}
                  fill="hsl(var(--muted-foreground))"
                >
                  {formatHour(d.hour)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div className="pointer-events-none absolute right-2 top-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-md">
          <div className="font-semibold">{hovered.count} check-in{hovered.count === 1 ? "" : "s"}</div>
          <div className="text-muted-foreground">{formatHour(hovered.hour)}</div>
        </div>
      )}
    </div>
  );
}
