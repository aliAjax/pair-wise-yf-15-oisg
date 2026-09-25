import type { Sample } from "../types";

interface Props {
  sample: Sample;
  caseCount: number; // 同案件送检次数（含本条）
  isCurrent: boolean; // 是否为该案件当前结论
  highlighted: boolean;
  onShowCase: (caseNo: string) => void;
  onEdit: (sample: Sample) => void;
}

const FIELD_LABELS: { key: keyof Sample; label: string }[] = [
  { key: "location", label: "采样地点" },
  { key: "exposureStage", label: "暴露阶段" },
  { key: "temperature", label: "环境温度" },
  { key: "sampledAt", label: "采样时刻" },
  { key: "species", label: "昆虫种类" },
  { key: "devStage", label: "发育阶段" },
  { key: "preservation", label: "保存方式" },
  { key: "note", label: "鉴定备注" },
];

export default function SampleCard({
  sample,
  caseCount,
  isCurrent,
  highlighted,
  onShowCase,
  onEdit,
}: Props) {
  const pending = !sample.devStage.trim();
  const hasCase = sample.caseNo.trim().length > 0;

  return (
    <article
      className={"sample-card" + (highlighted ? " highlighted" : "")}
      id={`sample-${sample.id}`}
    >
      <header className="card-head">
        <div className="card-title">
          <h3>{hasCase ? sample.caseNo : "案件编号待补"}</h3>
          <div className="badges">
            {pending ? (
              <span className="badge badge-pending">待鉴定</span>
            ) : (
              <span className="badge badge-done">已鉴定</span>
            )}
            {hasCase && (
              <span className={"badge " + (isCurrent ? "badge-current" : "badge-history")}>
                {isCurrent ? "当前结论" : `历史送检（共 ${caseCount} 次）`}
              </span>
            )}
          </div>
        </div>
        <div className="card-ops">
          {hasCase && caseCount > 1 && (
            <button onClick={() => onShowCase(sample.caseNo.trim())}>
              案件送检史
            </button>
          )}
          <button onClick={() => onEdit(sample)}>补录 / 修改</button>
        </div>
      </header>

      <dl className="card-fields">
        {FIELD_LABELS.map(({ key, label }) => {
          let value = String(sample[key] ?? "").trim();
          if (key === "temperature" && value) value = `${value} ℃`;
          if (key === "sampledAt" && value) {
            value = new Date(value).toLocaleString("zh-CN");
          }
          return (
            <div key={key} className={value ? "" : "empty"}>
              <dt>{label}</dt>
              <dd>{value || "待补录"}</dd>
            </div>
          );
        })}
      </dl>

      <footer className="card-foot">
        <span>入账时间：{new Date(sample.createdAt).toLocaleString("zh-CN")}</span>
      </footer>
    </article>
  );
}
