import { useEffect, useState } from "react";
import type { FormErrors, Sample, SampleForm } from "../types";
import { COMMON_SPECIES, DEV_STAGES, EXPOSURE_STAGES } from "../types";

interface Props {
  batchName: string;
  editing: Sample | null;
  duplicateOf: Sample | null;
  resetSignal: number;
  onSubmit: (form: SampleForm) => void;
  onEdit: (form: SampleForm) => void;
  onCancelEdit: () => void;
  onForceSave: () => void;
  onViewDuplicate: (id: string) => void;
}

export const EMPTY_FORM: SampleForm = {
  caseNo: "",
  location: "",
  exposureStage: "",
  temperature: "",
  sampledAt: "",
  species: "",
  devStage: "",
  preservation: "",
  note: "",
};

const REQUIRED_FIELDS: { key: keyof SampleForm; label: string }[] = [
  { key: "location", label: "采样地点" },
  { key: "exposureStage", label: "暴露阶段" },
  { key: "temperature", label: "温度" },
  { key: "sampledAt", label: "采样时刻" },
];

export default function SampleFormPanel({
  batchName,
  editing,
  duplicateOf,
  resetSignal,
  onSubmit,
  onEdit,
  onCancelEdit,
  onForceSave,
  onViewDuplicate,
}: Props) {
  const [form, setForm] = useState<SampleForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (editing) {
      setForm({
        caseNo: editing.caseNo,
        location: editing.location,
        exposureStage: editing.exposureStage,
        temperature: editing.temperature,
        sampledAt: editing.sampledAt,
        species: editing.species,
        devStage: editing.devStage,
        preservation: editing.preservation,
        note: editing.note,
      });
      setErrors({});
    }
  }, [editing]);

  // 成功入账 / 强制保存后回到空白表单
  useEffect(() => {
    if (!editing && resetSignal > 0) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  }, [resetSignal, editing]);

  const set = (key: keyof SampleForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    for (const { key, label } of REQUIRED_FIELDS) {
      if (!form[key].trim()) next[key] = `${label}为接收必填项`;
    }
    if (form.temperature.trim() && !Number.isFinite(Number(form.temperature))) {
      next.temperature = "温度需为数值（℃）";
    }
    return next;
  };

  const submit = () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit(form);
  };

  const saveEdit = () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onEdit(form);
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const fieldError = (key: keyof SampleForm) =>
    errors[key] ? <em className="field-error">{errors[key]}</em> : null;

  return (
    <section className="panel form-panel">
      <div className="heading">
        <div>
          <p>{editing ? "补录 / 修改样本" : `登记到「${batchName}」`}</p>
          <h2>{editing ? `编辑 ${editing.caseNo || "（案件编号待补）"}` : "新样本接收登记"}</h2>
        </div>
        {editing ? (
          <button onClick={onCancelEdit}>放弃修改</button>
        ) : (
          <button onClick={reset}>清空表单</button>
        )}
      </div>

      <div className="required-hint">
        <b>*</b> 采样地点、暴露阶段、温度、采样时刻缺一项不接收；其余字段（含案件编号）可后补。
      </div>

      <div className="field-grid">
        <label className={errors.caseNo ? "invalid" : ""}>
          <span>案件编号（可后补）</span>
          <input
            value={form.caseNo}
            placeholder="例如 CASE-042"
            onChange={(e) => set("caseNo", e.target.value)}
          />
        </label>

        <label className={errors.sampledAt ? "invalid" : ""}>
          <span>采样时刻 *</span>
          <input
            type="datetime-local"
            value={form.sampledAt}
            onChange={(e) => set("sampledAt", e.target.value)}
          />
          {fieldError("sampledAt")}
        </label>

        <label className={errors.location ? "invalid" : ""}>
          <span>采样地点 *</span>
          <input
            value={form.location}
            placeholder="例如 室外草地 / 阴影区域"
            onChange={(e) => set("location", e.target.value)}
          />
          {fieldError("location")}
        </label>

        <label className={errors.exposureStage ? "invalid" : ""}>
          <span>暴露阶段 *</span>
          <input
            list="exposure-stage-list"
            value={form.exposureStage}
            placeholder="新鲜期 / 肿胀期 / 腐烂期 …"
            onChange={(e) => set("exposureStage", e.target.value)}
          />
          <datalist id="exposure-stage-list">
            {EXPOSURE_STAGES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {fieldError("exposureStage")}
        </label>

        <label className={errors.temperature ? "invalid" : ""}>
          <span>环境温度 ℃ *</span>
          <input
            type="number"
            step="0.1"
            value={form.temperature}
            placeholder="例如 28.6"
            onChange={(e) => set("temperature", e.target.value)}
          />
          {fieldError("temperature")}
        </label>

        <label>
          <span>昆虫种类</span>
          <input
            list="species-list"
            value={form.species}
            placeholder="例如 丝光绿蝇（可后补）"
            onChange={(e) => set("species", e.target.value)}
          />
          <datalist id="species-list">
            {COMMON_SPECIES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>

        <label>
          <span>发育阶段</span>
          <input
            list="dev-stage-list"
            value={form.devStage}
            placeholder="卵 / 幼虫 / 蛹 / 成虫（可后补）"
            onChange={(e) => set("devStage", e.target.value)}
          />
          <datalist id="dev-stage-list">
            {DEV_STAGES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>

        <label>
          <span>保存方式</span>
          <input
            value={form.preservation}
            placeholder="例如 75% 乙醇 / 针插 / 冷藏"
            onChange={(e) => set("preservation", e.target.value)}
          />
        </label>

        <label className="full-width">
          <span>鉴定备注</span>
          <input
            value={form.note}
            placeholder="体长、数量、复核意见等（可后补）"
            onChange={(e) => set("note", e.target.value)}
          />
        </label>
      </div>

      {duplicateOf && (
        <div className="dup-warning" role="alert">
          <p>
            <b>案件编号 + 采样时刻重复：</b>
            台账中已有「{duplicateOf.caseNo || "（案件编号待补）"} ·{" "}
            {new Date(duplicateOf.sampledAt).toLocaleString("zh-CN")}」
            {duplicateOf.species ? `（${duplicateOf.species}）` : ""}
            ，原记录已保留，{editing ? "当前修改尚未保存。" : "本次登记尚未写入。"}
          </p>
          <div className="dup-actions">
            <button onClick={() => onViewDuplicate(duplicateOf.id)}>
              查看原记录
            </button>
            <button onClick={onForceSave}>仍作为重复送检保存</button>
          </div>
        </div>
      )}

      <div className="form-actions">
        {editing ? (
          <button className="primary" onClick={saveEdit}>
            保存补录
          </button>
        ) : (
          <button className="primary" onClick={submit}>
            接收入账
          </button>
        )}
      </div>
    </section>
  );
}
