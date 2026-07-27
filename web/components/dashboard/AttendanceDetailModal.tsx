"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { PeakHoursChart } from "./PeakHoursChart";

interface AttendanceRow {
  id: string;
  member_name: string;
  member_code: string;
  checked_in_at: string;
  source: string;
}

interface PeakHour {
  hour: number;
  count: number;
}

export function AttendanceDetailModal({ onClose }: { onClose: () => void }) {
  const [checkIns, setCheckIns] = useState<AttendanceRow[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getAttendanceTodayList(), api.getPeakHours()])
      .then(([list, hours]) => {
        setCheckIns(list as AttendanceRow[]);
        setPeakHours(hours as PeakHour[]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Today&apos;s Attendance</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-5">
            <div>
              <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
                Peak Hours <span className="font-normal">(last 30 days)</span>
              </h4>
              <PeakHoursChart data={peakHours} />
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
                Checked In Today ({checkIns.length})
              </h4>
              <div className="max-h-56 space-y-1.5 overflow-y-auto">
                {checkIns.length === 0 && (
                  <p className="text-sm text-muted-foreground">No check-ins yet today.</p>
                )}
                {checkIns.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">{c.member_name}</div>
                      <div className="text-xs text-muted-foreground">#{c.member_code}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {new Date(c.checked_in_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-[11px] capitalize text-muted-foreground">{c.source}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
