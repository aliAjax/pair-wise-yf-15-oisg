import { useMemo, useState } from "react";
import type { Batch, TemperaturePoint } from "./types";

interface Props {
  batch: Batch | undefined;
  onAddPoint: (batchId: string, at: string, tempC: number) => void;
  onRemovePoint: (batchId: string, pointId: string) => void;
}

function formatAt(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${m}-${day} ${hh}:${mm}`;
}

/** datetime-local（无时区）按本机时间转 ISO */
function localToIso(value: string): string {
  const [datePart, timePart = "00:00"] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm).toISOString();
}

export default function TemperatureChart({
  batch,
  onAddPoint,
  onRemovePoint,
}: Props) {
  const [at, setAt] = useState("");
  const [temp, setTemp] = useState("");

  const points = batch?.temperaturePoints ?? [];

  const geometry = useMemo(() => {
    const width = 560;
    const height = 220;
    const padding = { top: 18, right: 18, bottom: 38, left: 44 };
    if (points.length === 0) return null;
    const temps = points.map((p) => p.tempC);
    const times = points.map((p) => +new Date(p.at));
    let minT = Math.min(...temps);
    let maxT = Math.max(...temps);
    if (minT === maxT) {
      minT -= 2;
      maxT += 2;
    }
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const span = Math.max(maxTime - minTime, 1);
    const x = (t: number) =>
      padding.left +
      ((t - minTime) / span) * (width - padding.left - padding.right);
    const y = (v: number) =>
      padding.top +
      (1 - (v - minT) / (maxT - minT)) *
        (height - padding.top - padding.bottom);
    const path = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${x(+new Date(p.at))} ${y(p.tempC)}`)
      .join(" ");
    return { width, height, padding, x, y, path, minT, maxT, minTime, maxTime };
  }, [points]);

  if (!batch) {
    return (
      <div className="chart-empty">
        选择左侧批次后在此查看该批次的温度曲线
      </div>
    );
  }

  const submit = () => {
    const v = Number(temp);
    if (!at || !Number.isFinite(v)) return;
    onAddPoint(batch.id, localToIso(at), v);
    setAt("");
    setTemp("");
  };

  return (
    <div className="chart">
      <div className="chart-meta">
        <span>
          {batch.caseNo || "未关联案件"} · {batch.location}
        </span>
        <small>共 {points.length} 个温度记录点</small>
      </div>

      {geometry && points.length > 0 ? (
        <svg
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          className="chart-svg"
          role="img"
          aria-label="批次温度曲线"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((r) => {
            const ty =
              geometry.padding.top +
              r * (geometry.height - geometry.padding.top - geometry.padding.bottom);
            const value = geometry.maxT - r * (geometry.maxT - geometry.minT);
            return (
              <g key={r}>
                <line
                  x1={geometry.padding.left}
                  x2={geometry.width - geometry.padding.right}
                  y1={ty}
                  y2={ty}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text x={6} y={ty + 4} fontSize={11} fill="#64748b">
                  {value.toFixed(1)}
                </text>
              </g>
            );
          })}
          <path d={geometry.path} fill="none" stroke="#365314" strokeWidth={2.5} />
          {points.map((p: TemperaturePoint) => (
            <g key={p.id} className="chart-point">
              <circle
                cx={geometry.x(+new Date(p.at))}
                cy={geometry.y(p.tempC)}
                r={5}
                fill="#a16207"
                stroke="#fff"
                strokeWidth={2}
              />
              <title>{`${formatAt(p.at)}　${p.tempC}℃（点击删除）`}</title>
              <circle
                cx={geometry.x(+new Date(p.at))}
                cy={geometry.y(p.tempC)}
                r={12}
                fill="transparent"
                onClick={() => onRemovePoint(batch.id, p.id)}
                style={{ cursor: "pointer" }}
              />
            </g>
          ))}
          <text
            x={geometry.padding.left}
            y={geometry.height - 12}
            fontSize={11}
            fill="#64748b"
          >
            {formatAt(new Date(geometry.minTime).toISOString())}
          </text>
          <text
            x={geometry.width - geometry.padding.right}
            y={geometry.height - 12}
            fontSize={11}
            fill="#64748b"
            textAnchor="end"
          >
            {formatAt(new Date(geometry.maxTime).toISOString())}
          </text>
        </svg>
      ) : (
        <div className="chart-empty">暂无温度记录，请先补录</div>
      )}

      <div className="chart-add">
        <input
          type="datetime-local"
          value={at}
          onChange={(e) => setAt(e.target.value)}
          aria-label="测温时刻"
        />
        <input
          type="number"
          step="0.1"
          placeholder="温度 ℃"
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          aria-label="温度"
        />
        <button onClick={submit} disabled={!at || temp === ""}>
          追加测温点
        </button>
        <small>点击曲线上的圆点可删除该记录</small>
      </div>
    </div>
  );
}
