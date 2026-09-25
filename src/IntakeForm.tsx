import { useMemo, useState } from "react";
import type { Batch, BatchDraft } from "./types";
import {
  DEV_STAGES,
  EMPTY_DRAFT,
  REQUIRED_KEYS,
  REQUIRED_LABELS,
} from "./types";

interface Props {
  batches: Batch[];
  onAccept: (draft: BatchDraft) => void;
}

/** 把 datetime-local（无时区）按本机时间转为毫秒数 */
function localToMs(value: string): number {
  const [datePart, timePart = "00:00"] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm).getTime();
}

/** 案件编号 + 采样时刻完全一致视为重复送检 */
export function findDuplicate(
  batches: Batch[],
  draft: BatchDraft
): Batch | undefined {
  if (!draft.caseNo.trim() || !draft.sampledAt) return undefined;
  const target = localToMs(draft.sampledAt);
  return batches.find((b) => {
    if (!b.caseNo) return false;
    return (
      b.caseNo.trim().toLowerCase() === draft.caseNo.trim().toLowerCase() &&
      new Date(b.sampledAt).getTime() === target
    );
  });
}

/** 接收校验：四项必填缺一项不接收；温度需为合理数值。返回缺失/错误字段名列表 */
export function validateDraft(draft: BatchDraft): string[] {
  const missing = REQUIRED_KEYS.filter((k) => !String(draft[k]).trim()).map(
    (k) => REQUIRED_LABELS[k]
  );
  if (missing.length > 0) return missing;
  const temp = Number(draft.tempC);
  if (!Number.isFinite(temp) || temp < -50 || temp > 80) {
    return ["环境温度需为 -50 ~ 80 ℃ 之间的数值"];
  }
  return [];
}

export default function IntakeForm({ batches, onAccept }: Props) {
  const [draft, setDraft] = useState<BatchDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<string[]>([]);
  const [blocked, setBlocked] = useState<Batch | null>(null);

  const duplicate = useMemo(
    () => findDuplicate(batches, draft),
    [batches, draft]
  );

  const set = <K extends keyof BatchDraft>(key: K, value: BatchDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors([]);
  };

  const submit = () => {
    // 缺任何一项都不接收：地点、暴露阶段、温度、采样时刻
    const problems = validateDraft(draft);
    if (problems.length > 0) {
      setErrors(problems);
      return;
    }
    // 重复时提示并留住原记录：本次不写入
    if (duplicate) {
      setBlocked(duplicate);
      return;
    }
    onAccept(draft);
    setDraft(EMPTY_DRAFT);
    setErrors([]);
    setBlocked(null);
  };

  return (
    <section className="panel form-panel">
      <div className="heading">
        <div>
          <p>本机批次台账</p>
          <h2>送检接收</h2>
        </div>
        <span className="local-tag">仅存本机</span>
      </div>

      <p className="form-hint">
        标 <b>*</b> 的四项（采样地点、暴露阶段、温度、采样时刻）缺一项不接收；
        案件编号、昆虫种类、发育阶段等可由鉴定员后补。
      </p>

      <div className="field-grid">
        <label>
          <span>案件编号（可后补）</span>
          <input
            placeholder="如 CASE-042"
            value={draft.caseNo}
            onChange={(e) => set("caseNo", e.target.value)}
          />
        </label>
        <label className="required">
          <span>采样地点 *</span>
          <input
            placeholder="如 室外草地"
            value={draft.location}
            onChange={(e) => set("location", e.target.value)}
          />
        </label>
        <label className="required">
          <span>尸体暴露阶段 *</span>
          <input
            placeholder="如 新鲜期 / 膨胀期 / 腐烂期"
            value={draft.exposureStage}
            onChange={(e) => set("exposureStage", e.target.value)}
          />
        </label>
        <label className="required">
          <span>环境温度 ℃ *</span>
          <input
            type="number"
            step="0.1"
            placeholder="采样时刻温度"
            value={draft.tempC}
            onChange={(e) => set("tempC", e.target.value)}
          />
        </label>
        <label className="required">
          <span>采样时刻 *</span>
          <input
            type="datetime-local"
            value={draft.sampledAt}
            onChange={(e) => set("sampledAt", e.target.value)}
          />
        </label>
        <label>
          <span>昆虫种类（可后补）</span>
          <input
            placeholder="如 丝光绿蝇"
            value={draft.species}
            onChange={(e) => set("species", e.target.value)}
          />
        </label>
        <label>
          <span>发育阶段（可后补，留空即待鉴定）</span>
          <select
            value={draft.devStage}
            onChange={(e) => set("devStage", e.target.value as BatchDraft["devStage"])}
          >
            <option value="">待鉴定（暂不填）</option>
            {DEV_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>阶段描述（可后补）</span>
          <input
            placeholder="如 三龄"
            value={draft.stageNote}
            onChange={(e) => set("stageNote", e.target.value)}
          />
        </label>
        <label>
          <span>保存方式（可后补）</span>
          <input
            placeholder="如 75% 乙醇"
            value={draft.storage}
            onChange={(e) => set("storage", e.target.value)}
          />
        </label>
        <label>
          <span>鉴定备注（可后补）</span>
          <input
            placeholder="现场情况、复核要求等"
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </label>
      </div>

      {errors.length > 0 && (
        <div className="alert error" role="alert">
          不予接收：请补全
          {errors.map((e) => (
            <b key={e}> {e}</b>
          ))}
          。
        </div>
      )}

      {blocked && (
        <div className="alert warn" role="alert">
          <div>
            案件编号 <b>{blocked.caseNo}</b> 与采样时刻{" "}
            <b>{new Date(blocked.sampledAt).toLocaleString("zh-CN")}</b>{" "}
            的批次已存在，原记录已保留未改动。若为同一案件的新送检，请核对采样时刻（新的发育阶段将成为该案件的当前结论）。
          </div>
          <div className="alert-actions">
            <button onClick={() => setBlocked(null)}>知道了，回去修改</button>
          </div>
        </div>
      )}

      {!blocked && duplicate && (
        <div className="alert warn-inline">
          检测到案件编号与采样时刻重复的既有批次，提交后将保留原记录、不覆盖。
        </div>
      )}

      <div className="form-actions">
        <button className="primary" onClick={submit}>
          接收入账
        </button>
        <button
          onClick={() => {
            setDraft(EMPTY_DRAFT);
            setErrors([]);
            setBlocked(null);
          }}
        >
          清空
        </button>
      </div>
    </section>
  );
}
