"use client";

import { useEffect, useState } from "react";
import { Cpu, Zap, X, ChevronDown, ChevronUp } from "lucide-react";

interface SystemInfo {
  model: string;
  model_params: string;
  model_quality: string;
  hardware: { on_gpu: boolean; mode: string };
  performance: { expected_response_time: string; advice: string };
  recommended_upgrades: { model: string; reason: string; effort: string }[];
}

export default function SystemBanner() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/system/info")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => {});
  }, []);

  if (!info || dismissed) return null;

  const onGpu = info.hardware.on_gpu;

  return (
    <div
      className={`border-b px-4 py-2 text-sm ${
        onGpu
          ? "bg-green-50 border-green-200 text-green-800"
          : "bg-amber-50 border-amber-200 text-amber-800"
      }`}
    >
      <div className="max-w-3xl mx-auto flex items-start gap-2">
        {onGpu ? (
          <Zap className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
        ) : (
          <Cpu className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">
              {info.model} ({info.model_params}) · {info.hardware.mode}
            </span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                onGpu ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              ~{info.performance.expected_response_time}
            </span>
            {!onGpu && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="flex items-center gap-0.5 text-xs underline text-amber-600 hover:text-amber-800"
              >
                {expanded ? "Hide" : "How to speed this up"}
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {!onGpu && expanded && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-amber-700">{info.performance.advice}</p>
              {info.recommended_upgrades.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-amber-800">Upgrade options:</p>
                  {info.recommended_upgrades.map((u) => (
                    <div key={u.model} className="text-xs bg-amber-100 rounded px-2 py-1">
                      <span className="font-mono font-semibold">{u.model}</span>
                      {" — "}
                      {u.reason}
                      <span className="block text-amber-600 mt-0.5">{u.effort}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setDismissed(true)}
          className={`flex-shrink-0 ${onGpu ? "text-green-400 hover:text-green-600" : "text-amber-400 hover:text-amber-600"}`}
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
