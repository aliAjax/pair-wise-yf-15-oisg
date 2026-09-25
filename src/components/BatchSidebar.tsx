import { useState } from "react";
import type { Batch, Sample } from "../types";

interface Props {
  batches: Batch[];
  samples: Sample[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string, note: string) => void;
}

export default function BatchSidebar({
  batches,
  samples,
  selectedId,
  onSelect,
  onCreate,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim()) {
      setError("请填写批次名称");
      return;
    }
    onCreate(name.trim(), note.trim());
    setName("");
    setNote("");
    setError("");
    setCreating(false);
  };

  return (
    <aside className="panel sidebar">
      <div className="heading">
        <div>
          <p>本机台账</p>
          <h2>样本批次</h2>
        </div>
        <button className="primary" onClick={() => setCreating((v) => !v)}>
          {creating ? "取消" : "新建批次"}
        </button>
      </div>

      <p className="local-hint">批次与样本仅保存在当前浏览器（localStorage）。</p>

      {creating && (
        <div className="batch-create">
          <label>
            <span>批次名称 *</span>
            <input
              value={name}
              placeholder="例如：CASE-063 首批送检"
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />
          </label>
          <label>
            <span>批次说明（可后补）</span>
            <input
              value={note}
              placeholder="送检单位 / 现场概况"
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button className="primary" onClick={submit}>
            在本机创建
          </button>
        </div>
      )}

      <div className="batch-list">
        {batches.map((b) => {
          const count = samples.filter((s) => s.batchId === b.id).length;
          const pending = samples.filter(
            (s) => s.batchId === b.id && !s.devStage.trim()
          ).length;
          return (
            <button
              key={b.id}
              className={"batch-item" + (b.id === selectedId ? " active" : "")}
              onClick={() => onSelect(b.id)}
            >
              <strong>{b.name}</strong>
              <small>
                {new Date(b.createdAt).toLocaleString("zh-CN", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" · "}
                {count} 份样本{pending > 0 ? ` · ${pending} 份待鉴定` : ""}
              </small>
              {b.note && <em>{b.note}</em>}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
