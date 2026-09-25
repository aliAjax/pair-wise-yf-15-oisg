import { useMemo, useState } from "react";
import "./styles.css";
import { useLedger } from "./useLedger";
import type { Batch, BatchDraft, DevStage } from "./types";
import { DEV_STAGES } from "./types";
import IntakeForm from "./IntakeForm";
import BatchCard from "./BatchCard";
import TemperatureChart from "./TemperatureChart";

const STAGE_FILTERS: Array<{ key: DevStage | "pending" | "all"; label: string }> = [
  { key: "all", label: "全部阶段" },
  ...DEV_STAGES.map((s) => ({ key: s as DevStage, label: s })),
  { key: "pending", label: "待鉴定" },
];

function fmt(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

/** datetime-local（无时区）按本机时间转 ISO */
function localToIso(value: string): string {
  const [datePart, timePart = "00:00"] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm).toISOString();
}

function App({ initialBatchId = null }: { initialBatchId?: string | null }) {
  const {
    batches,
    addBatch,
    updateBatch,
    removeBatch,
    addTemperaturePoint,
    removeTemperaturePoint,
  } = useLedger();

  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState<(typeof STAGE_FILTERS)[number]["key"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialBatchId);

  const speciesOptions = useMemo(
    () =>
      Array.from(new Set(batches.map((b) => b.species).filter(Boolean))).sort(),
    [batches]
  );

  const filtered = useMemo(() => {
    return batches
      .filter((b) => speciesFilter === "all" || b.species === speciesFilter)
      .filter((b) => {
        if (stageFilter === "all") return true;
        if (stageFilter === "pending") return !b.devStage;
        return b.devStage === stageFilter;
      })
      .sort((a, b) => +new Date(b.sampledAt) - +new Date(a.sampledAt));
  }, [batches, speciesFilter, stageFilter]);

  // 筛选变化后，若当前选中批次不在结果集中，则落到第一条；没有结果则不显示详情
  const selected: Batch | undefined =
    filtered.find((b) => b.id === selectedId) ?? filtered[0];

  const caseHistory = useMemo(() => {
    if (!selected?.caseNo) return [];
    return batches
      .filter((b) => b.caseNo && b.caseNo === selected.caseNo)
      .sort((a, b) => +new Date(a.sampledAt) - +new Date(b.sampledAt));
  }, [batches, selected]);

  const isCurrent =
    !!selected &&
    caseHistory.length > 0 &&
    caseHistory[caseHistory.length - 1].id === selected.id;

  const pendingCount = filtered.filter((b) => !b.devStage).length;
  const avgTemp =
    filtered.length > 0
      ? filtered.reduce((s, b) => s + b.tempC, 0) / filtered.length
      : 0;
  const caseCount = new Set(
    filtered.map((b) => b.caseNo).filter(Boolean)
  ).size;

  const handleAccept = (draft: BatchDraft) => {
    const created = addBatch({
      caseNo: draft.caseNo.trim(),
      location: draft.location.trim(),
      exposureStage: draft.exposureStage.trim(),
      tempC: Number(draft.tempC),
      sampledAt: localToIso(draft.sampledAt),
      species: draft.species.trim(),
      devStage: draft.devStage,
      stageNote: draft.stageNote.trim(),
      storage: draft.storage.trim(),
      notes: draft.notes.trim(),
    });
    setSelectedId(created.id);
    // 新批次入账后让其立即可见
    setSpeciesFilter("all");
    setStageFilter("all");
  };

  return (
    <main className="app">
      <section className="hero">
        <p>hxyfront-62003 · 法医昆虫学 · 批次台账</p>
        <h1>法医昆虫学样本批次台账</h1>
        <span>
          采样员送检、鉴定员补录共用同一本机台账。接收时强制核验采样地点、暴露阶段、温度与采样时刻；
          同一案件多次送检保留完整历史，最新发育阶段作为当前结论。
        </span>
      </section>

      <section className="metrics">
        <article>
          <small>批次总数（按筛选）</small>
          <strong>{filtered.length}</strong>
        </article>
        <article>
          <small>待鉴定（随筛选更新）</small>
          <strong className={pendingCount > 0 ? "metric-warn" : ""}>
            {pendingCount}
          </strong>
        </article>
        <article>
          <small>筛选结果平均温度</small>
          <strong>{avgTemp.toFixed(1)}℃</strong>
        </article>
        <article>
          <small>关联案件数</small>
          <strong>{caseCount}</strong>
        </article>
      </section>

      <section className="workspace">
        <aside className="panel list-panel">
          <h2>批次列表</h2>

          <label className="filter-select">
            <span>昆虫种类</span>
            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
            >
              <option value="all">全部种类</option>
              {speciesOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              {speciesOptions.length === 0 && (
                <option value="__none" disabled>
                  暂无可筛种类
                </option>
              )}
            </select>
          </label>

          <div className="chips stage-chips">
            {STAGE_FILTERS.map((f) => (
              <button
                key={f.key}
                className={stageFilter === f.key ? "chip-active" : ""}
                onClick={() => setStageFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="batch-list">
            {filtered.length === 0 && (
              <p className="list-empty">当前筛选下没有批次</p>
            )}
            {filtered.map((b) => {
              const active = selected?.id === b.id;
              return (
                <button
                  key={b.id}
                  className={`batch-item${active ? " active" : ""}${
                    !b.devStage ? " pending" : ""
                  }`}
                  onClick={() => setSelectedId(b.id)}
                >
                  <span className="item-case">{b.caseNo || "未关联案件"}</span>
                  <span className="item-main">
                    {b.species || "种类待补"} ·{" "}
                    {b.devStage || <em>待鉴定</em>}
                  </span>
                  <span className="item-sub">
                    {b.location} · {b.tempC.toFixed(1)}℃ · {fmt(b.sampledAt)}
                  </span>
                  {!b.devStage && <i className="pending-dot" title="待鉴定" />}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="main-col">
          <IntakeForm batches={batches} onAccept={handleAccept} />

          {selected ? (
            <>
              <BatchCard
                batch={selected}
                caseHistory={caseHistory}
                isCurrent={isCurrent}
                onSelect={setSelectedId}
                onPatch={updateBatch}
                onRemove={(id) => {
                  removeBatch(id);
                  setSelectedId(null);
                }}
              />

              <section className="panel chart-panel">
                <div className="heading">
                  <div>
                    <p>批次温度曲线</p>
                    <h2>温度记录</h2>
                  </div>
                  <small>随所选批次切换</small>
                </div>
                <TemperatureChart
                  batch={selected}
                  onAddPoint={addTemperaturePoint}
                  onRemovePoint={removeTemperaturePoint}
                />
              </section>
            </>
          ) : (
            <section className="panel">
              <div className="chart-empty">
                没有可展示的批次，请先在上方接收送检。
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
