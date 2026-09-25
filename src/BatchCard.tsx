import type { Batch } from "./types";

interface Props {
  batch: Batch;
  /** 同案件全部送检批次（含自身），按采样时刻排序 */
  caseHistory: Batch[];
  isCurrent: boolean;
  onSelect: (id: string) => void;
  onPatch: (id: string, patch: Partial<Batch>) => void;
  onRemove: (id: string) => void;
}

function fmtDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function Field({
  label,
  value,
  pending,
}: {
  label: string;
  value: string;
  pending?: boolean;
}) {
  return (
    <div className="card-field">
      <span>{label}</span>
      <b className={pending ? "pending" : ""}>{pending ? "待后补" : value}</b>
    </div>
  );
}

export default function BatchCard({
  batch,
  caseHistory,
  isCurrent,
  onSelect,
  onPatch,
  onRemove,
}: Props) {
  const setSpecies = () => {
    const v = window.prompt("补录昆虫种类", batch.species);
    if (v !== null) onPatch(batch.id, { species: v.trim() });
  };
  const setStorage = () => {
    const v = window.prompt("补录保存方式", batch.storage);
    if (v !== null) onPatch(batch.id, { storage: v.trim() });
  };
  const setNotes = () => {
    const v = window.prompt("补录鉴定备注", batch.notes);
    if (v !== null) onPatch(batch.id, { notes: v.trim() });
  };
  const setStageNote = () => {
    const v = window.prompt("补录发育阶段描述（如：三龄）", batch.stageNote);
    if (v !== null) onPatch(batch.id, { stageNote: v.trim() });
  };
  const setCaseNo = () => {
    const v = window.prompt("关联案件编号", batch.caseNo);
    if (v !== null) onPatch(batch.id, { caseNo: v.trim() });
  };

  return (
    <article className="batch-card">
      <header className="card-head">
        <div>
          <p className="eyebrow">批次台账 · 入账 {fmtDateTime(batch.createdAt)}</p>
          <h3>
            <button className="case-link" onClick={setCaseNo} title="点击补录案件编号">
              {batch.caseNo || "未关联案件（点击补录）"}
            </button>
            {isCurrent && <em className="current-badge">当前结论</em>}
          </h3>
        </div>
        <button
          className="danger"
          onClick={() => {
            if (window.confirm("删除该批次记录？此操作不可撤销。")) onRemove(batch.id);
          }}
        >
          删除批次
        </button>
      </header>

      <div className="card-grid">
        <Field label="采样地点" value={batch.location} />
        <Field label="暴露阶段" value={batch.exposureStage} />
        <Field label="采样温度" value={`${batch.tempC.toFixed(1)} ℃`} />
        <Field label="采样时刻" value={fmtDateTime(batch.sampledAt)} />
        <Field
          label="昆虫种类"
          value={batch.species}
          pending={!batch.species}
        />
        <Field
          label="发育阶段"
          value={
            batch.devStage
              ? batch.stageNote
                ? `${batch.devStage}（${batch.stageNote}）`
                : batch.devStage
              : ""
          }
          pending={!batch.devStage}
        />
        <Field
          label="保存方式"
          value={batch.storage}
          pending={!batch.storage}
        />
        <Field label="鉴定备注" value={batch.notes} pending={!batch.notes} />
      </div>

      <div className="card-actions">
        {!batch.species && <button onClick={setSpecies}>补录昆虫种类</button>}
        {!batch.devStage && (
          <label className="inline-stage">
            补录发育阶段
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onPatch(batch.id, { devStage: e.target.value as Batch["devStage"] });
                  e.currentTarget.value = "";
                }
              }}
            >
              <option value="" disabled>
                选择阶段
              </option>
              <option value="卵">卵</option>
              <option value="幼虫">幼虫</option>
              <option value="蛹">蛹</option>
              <option value="成虫">成虫</option>
            </select>
          </label>
        )}
        {!batch.stageNote && batch.devStage && (
          <button onClick={setStageNote}>补录阶段描述</button>
        )}
        {!batch.storage && <button onClick={setStorage}>补录保存方式</button>}
        {!batch.notes && <button onClick={setNotes}>补录鉴定备注</button>}
      </div>

      {batch.caseNo && caseHistory.length > 1 && (
        <div className="case-history">
          <p>
            同一案件送检 {caseHistory.length} 次 · 历史批次（点击切换，最新发育阶段为当前结论）
          </p>
          <ol>
            {caseHistory.map((h, i) => (
              <li
                key={h.id}
                className={h.id === batch.id ? "active" : ""}
                onClick={() => onSelect(h.id)}
              >
                <span>{fmtDateTime(h.sampledAt)}</span>
                <b>{h.devStage || "待鉴定"}</b>
                {h.stageNote && <small>{h.stageNote}</small>}
                {i === caseHistory.length - 1 && <em>当前</em>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </article>
  );
}
