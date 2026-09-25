import { useMemo, useState } from "react";
import type { TempPoint } from "../storage";

interface Props {
  points: TempPoint[];
  batchName: string;
}

const W = 680;
const H = 240;
const PAD_L = 44;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 40;

export default function TempChart({ points, batchName }: Props) {
  const [active, setActive] = useState<number | null>(null);

  const { coords, yTicks, avg } = useMemo(() => {
    if (points.length === 0) {
      return {
        coords: [] as { x: number; y: number; p: TempPoint }[],
        yTicks: [] as { y: number; v: number }[],
        avg: 0,
      };
    }
    const temps = points.map((p) => p.temp);
    let min = Math.min(...temps);
    let max = Math.max(...temps);
    if (min === max) {
      min -= 2;
      max += 2;
    } else {
      const pad = (max - min) * 0.15;
      min -= pad;
      max += pad;
    }
    const t0 = new Date(points[0].time).getTime();
    const t1 = new Date(points[points.length - 1].time).getTime();

    const xOf = (p: TempPoint) => {
      if (t1 === t0) return PAD_L + (W - PAD_L - PAD_R) / 2;
      const t = new Date(p.time).getTime();
      return (
        PAD_L +
        ((t - t0) / (t1 - t0)) * (W - PAD_L - PAD_R)
      );
    };
    const yOf = (v: number) =>
      PAD_T + (1 - (v - min) / (max - min)) * (H - PAD_T - PAD_B);

    const coords = points.map((p) => ({ x: xOf(p), y: yOf(p.temp), p }));
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((q) => {
      const v = max - q * (max - min);
      return { y: yOf(v), v: Math.round(v * 10) / 10 };
    });
    const avg =
      Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10;
    return { coords, yTicks, avg };
  }, [points]);

  return (
    <section className="panel chart-panel">
      <div className="heading">
        <div>
          <p>随批次切换</p>
          <h2>温度曲线 · {batchName}</h2>
        </div>
        {points.length > 0 && (
          <div className="chart-summary">
            <span>{points.length} 个测点</span>
            <span>平均 {avg} ℃</span>
            <span>
              区间 {Math.min(...points.map((p) => p.temp))}–
              {Math.max(...points.map((p) => p.temp))} ℃
            </span>
          </div>
        )}
      </div>

      {points.length === 0 ? (
        <div className="chart-empty">该批次暂无温度记录（接收样本时温度为必填项）。</div>
      ) : (
        <>
          <svg
            className="temp-chart"
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`${batchName} 温度曲线`}
          >
            {yTicks.map((t, i) => (
              <g key={i}>
                <line
                  x1={PAD_L}
                  x2={W - PAD_R}
                  y1={t.y}
                  y2={t.y}
                  className="grid-line"
                />
                <text x={PAD_L - 8} y={t.y + 4} className="axis-label" textAnchor="end">
                  {t.v}
                </text>
              </g>
            ))}

            <polyline
              className="temp-line"
              fill="none"
              points={coords.map((c) => `${c.x},${c.y}`).join(" ")}
            />
            {coords.map((c, i) => (
              <g key={c.p.sampleId}>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={active === i ? 6 : 4}
                  className="temp-dot"
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                >
                  <title>
                    {`${c.p.caseNo} · ${c.p.label} · ${c.p.temp}℃ · ${new Date(
                      c.p.time
                    ).toLocaleString("zh-CN")}`}
                  </title>
                </circle>
                <text x={c.x} y={H - PAD_B + 18} className="axis-label" textAnchor="middle">
                  {new Date(c.p.time).toLocaleString("zh-CN", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </text>
              </g>
            ))}
            {active !== null && (
              <line
                x1={coords[active].x}
                x2={coords[active].x}
                y1={PAD_T}
                y2={H - PAD_B}
                className="hover-line"
              />
            )}
          </svg>
          {active !== null && (
            <p className="chart-tip">
              {coords[active].p.caseNo} · {coords[active].p.label} ·{" "}
              <b>{coords[active].p.temp} ℃</b> ·{" "}
              {new Date(coords[active].p.time).toLocaleString("zh-CN")}
            </p>
          )}
        </>
      )}
    </section>
  );
}
