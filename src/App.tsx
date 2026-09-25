import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import type { Batch, Sample, SampleForm, StoreData } from "./types";
import { loadStore, saveStore, temperaturePoints, uid } from "./storage";
import BatchSidebar from "./components/BatchSidebar";
import SampleFormPanel from "./components/SampleForm";
import SampleCard from "./components/SampleCard";
import FilterBar, { matchStage } from "./components/FilterBar";
import TempChart from "./components/TempChart";
import CaseHistoryModal from "./components/CaseHistoryModal";

const APP_TITLE = "法医昆虫学样本批次台账";

function sameCaseAndTime(a: Pick<Sample, "caseNo" | "sampledAt">, b: Sample): boolean {
  const caseA = a.caseNo.trim();
  if (!caseA) return false; // 案件编号后补中的记录不参与重复判定
  return caseA === b.caseNo.trim() && a.sampledAt === b.sampledAt;
}

function App() {
  const [store, setStore] = useState<StoreData>(() => loadStore());
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    () => loadStore().batches[0]?.id ?? ""
  );
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [editing, setEditing] = useState<Sample | null>(null);
  const [pendingForm, setPendingForm] = useState<SampleForm | null>(null);
  const [duplicateOf, setDuplicateOf] = useState<Sample | null>(null);
  const [caseModal, setCaseModal] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [formResetSignal, setFormResetSignal] = useState(0);

  useEffect(() => {
    saveStore(store);
  }, [store]);

  // 批次被删除/切换时兜底
  useEffect(() => {
    if (!store.batches.some((b) => b.id === selectedBatchId)) {
      setSelectedBatchId(store.batches[0]?.id ?? "");
    }
  }, [store.batches, selectedBatchId]);

  const selectedBatch =
    store.batches.find((b) => b.id === selectedBatchId) ?? null;

  // 跨批次（如从案件历史弹窗进入补录）时，清掉不属于当前批次的编辑态
  if (editing && editing.batchId !== selectedBatchId) {
    setEditing(null);
    setPendingForm(null);
    setDuplicateOf(null);
  }

  const batchSamples = useMemo(
    () =>
      store.samples
        .filter((s) => s.batchId === selectedBatchId)
        .sort((a, b) => b.sampledAt.localeCompare(a.sampledAt)),
    [store.samples, selectedBatchId]
  );

  const filteredSamples = useMemo(
    () =>
      batchSamples.filter((s) => {
        if (
          selectedStages.size > 0 &&
          ![...selectedStages].some((g) => matchStage(s.devStage, g))
        ) {
          return false;
        }
        if (selectedSpecies && s.species.trim() !== selectedSpecies) {
          return false;
        }
        return true;
      }),
    [batchSamples, selectedStages, selectedSpecies]
  );

  // 同一案件：最新采样时刻的记录为当前结论
  const currentIdByCase = useMemo(() => {
    const map = new Map<string, string>();
    const byCase = new Map<string, Sample[]>();
    for (const s of store.samples) {
      const key = s.caseNo.trim();
      if (!key) continue;
      const list = byCase.get(key) ?? [];
      list.push(s);
      byCase.set(key, list);
    }
    for (const [key, list] of byCase) {
      list.sort((a, b) => b.sampledAt.localeCompare(a.sampledAt));
      map.set(key, list[0].id);
    }
    return map;
  }, [store.samples]);

  const caseCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of store.samples) {
      const key = s.caseNo.trim();
      if (key) map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [store.samples]);

  // 指标（随筛选更新）
  const pendingCount = filteredSamples.filter((s) => !s.devStage.trim()).length;
  const distinctStages = new Set(
    filteredSamples.map((s) => s.devStage.trim()).filter(Boolean)
  ).size;
  const temps = batchSamples
    .map((s) => Number(s.temperature))
    .filter((v) => Number.isFinite(v));
  const avgTemp =
    temps.length > 0
      ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10
      : null;

  const createBatch = (name: string, note: string) => {
    const batch: Batch = {
      id: uid("batch"),
      name,
      note,
      createdAt: new Date().toISOString().slice(0, 16),
    };
    setStore((prev) => ({ ...prev, batches: [...prev.batches, batch] }));
    setSelectedBatchId(batch.id);
  };

  const persistSample = (form: SampleForm) => {
    const sample: Sample = {
      ...form,
      id: uid("s"),
      batchId: selectedBatchId,
      createdAt: new Date().toISOString(),
    };
    setStore((prev) => ({ ...prev, samples: [...prev.samples, sample] }));
  };

  const handleSubmit = (form: SampleForm) => {
    const dup = store.samples.find((s) => sameCaseAndTime(form, s));
    if (dup) {
      setPendingForm(form);
      setDuplicateOf(dup);
      return;
    }
    persistSample(form);
    setPendingForm(null);
    setDuplicateOf(null);
    setFormResetSignal((n) => n + 1);
  };

  const handleForceSave = () => {
    if (!pendingForm) return;
    if (editing) {
      const editId = editing.id;
      setStore((prev) => ({
        ...prev,
        samples: prev.samples.map((s) =>
          s.id === editId ? { ...s, ...pendingForm } : s
        ),
      }));
      setEditing(null);
    } else {
      persistSample(pendingForm);
    }
    setPendingForm(null);
    setDuplicateOf(null);
    setFormResetSignal((n) => n + 1);
  };

  const handleViewDuplicate = (id: string) => {
    const target = store.samples.find((s) => s.id === id);
    if (!target) return;
    setSelectedBatchId(target.batchId);
    setHighlightId(id);
  };

  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => {
      document
        .getElementById(`sample-${highlightId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    const t2 = setTimeout(() => setHighlightId(null), 2600);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [highlightId, store.samples]);

  const handleEdit = (form: SampleForm) => {
    if (!editing) return;
    const dup = store.samples.find(
      (s) => s.id !== editing.id && sameCaseAndTime(form, s)
    );
    if (dup) {
      setPendingForm(form);
      setDuplicateOf(dup);
      return;
    }
    setStore((prev) => ({
      ...prev,
      samples: prev.samples.map((s) =>
        s.id === editing.id
          ? { ...s, ...form }
          : s
      ),
    }));
    setEditing(null);
    setPendingForm(null);
    setDuplicateOf(null);
  };
  const cancelEdit = () => {
    setEditing(null);
    setPendingForm(null);
    setDuplicateOf(null);
  };

  const startEdit = (sample: Sample) => {
    setDuplicateOf(null);
    setPendingForm(null);
    setEditing(sample);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleStage = (stage: string) => {
    setSelectedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedStages(new Set());
    setSelectedSpecies("");
  };

  const tempData = useMemo(
    () => temperaturePoints(batchSamples),
    [batchSamples]
  );

  return (
    <main className="app">
      <section className="hero">
        <p>hxyfront-62003 · 本机批次台账 · Port 62003</p>
        <h1>{APP_TITLE}</h1>
        <span>
          采样员与鉴定员共用同一台账：批次留存在本机；接收时校验地点、暴露阶段、温度与采样时刻，其余字段可后补。
          同一案件多次送检全程留痕，最新发育阶段自动成为当前结论。
        </span>
      </section>

      <section className="metrics">
        <article>
          <small>当前批次样本</small>
          <strong>{batchSamples.length}</strong>
        </article>
        <article>
          <small>批次平均温度</small>
          <strong>{avgTemp === null ? "—" : `${avgTemp}℃`}</strong>
        </article>
        <article>
          <small>筛选命中发育阶段</small>
          <strong>{distinctStages}</strong>
        </article>
        <article>
          <small>待鉴定（随筛选）</small>
          <strong>{pendingCount}</strong>
        </article>
      </section>

      <section className="workspace">
        <BatchSidebar
          batches={store.batches}
          samples={store.samples}
          selectedId={selectedBatchId}
          onSelect={(id) => {
            setSelectedBatchId(id);
            cancelEdit();
          }}
          onCreate={createBatch}
        />

        {selectedBatch ? (
          <SampleFormPanel
            batchName={selectedBatch.name}
            editing={editing}
            duplicateOf={duplicateOf}
            resetSignal={formResetSignal}
            onSubmit={handleSubmit}
            onEdit={handleEdit}
            onCancelEdit={cancelEdit}
            onForceSave={handleForceSave}
            onViewDuplicate={handleViewDuplicate}
          />
        ) : (
          <section className="panel form-panel empty-batch">
            <h2>还没有批次</h2>
            <p>先在左侧「新建批次」，批次仅保存在本机浏览器。</p>
          </section>
        )}
      </section>

      {selectedBatch && (
        <>
          <TempChart points={tempData} batchName={selectedBatch.name} />

          <section className="panel ledger-panel">
            <div className="heading">
              <div>
                <p>批次台账明细</p>
                <h2>{selectedBatch.name}</h2>
              </div>
              <span className="result-count">
                筛选显示 {filteredSamples.length} / {batchSamples.length} 份
              </span>
            </div>

            <FilterBar
              samples={batchSamples}
              selectedStages={selectedStages}
              selectedSpecies={selectedSpecies}
              onToggleStage={toggleStage}
              onSelectSpecies={setSelectedSpecies}
              onClear={clearFilters}
            />

            {filteredSamples.length === 0 ? (
              <div className="ledger-empty">
                {batchSamples.length === 0
                  ? "该批次尚未接收样本。"
                  : "当前筛选条件下没有样本，可调整发育阶段或昆虫种类。"}
              </div>
            ) : (
              <div className="cards">
                {filteredSamples.map((s) => {
                  const key = s.caseNo.trim();
                  return (
                    <SampleCard
                      key={s.id}
                      sample={s}
                      caseCount={key ? caseCount.get(key) ?? 1 : 1}
                      isCurrent={currentIdByCase.get(key) === s.id}
                      highlighted={highlightId === s.id}
                      onShowCase={setCaseModal}
                      onEdit={startEdit}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      <CaseHistoryModal
        caseNo={caseModal}
        samples={store.samples}
        batches={store.batches}
        onClose={() => setCaseModal(null)}
        onEdit={startEdit}
        onSelectBatch={setSelectedBatchId}
      />

      <footer className="page-foot">
        数据存储于本机 localStorage（键：forensic-entomology-ledger-v1），清空浏览器数据将丢失台账。
      </footer>
    </main>
  );
}

export default App;
