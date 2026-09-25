import { useCallback, useEffect, useState } from "react";
import type { Batch } from "./types";

const STORAGE_KEY = "forensic-entomology-ledger/v1";

function makeId(): string {
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function seedBatches(): Batch[] {
  const iso = (d: string) => new Date(d).toISOString();
  return [
    {
      id: makeId(),
      caseNo: "CASE-042",
      location: "室外草地",
      exposureStage: "膨胀期",
      tempC: 28.6,
      sampledAt: iso("2026-09-12T09:30"),
      species: "丝光绿蝇",
      devStage: "幼虫",
      stageNote: "三龄",
      storage: "75% 乙醇保存",
      notes: "首次送检，蛆群密集于体腔开口处",
      temperaturePoints: [
        { id: "t1", at: iso("2026-09-12T09:30"), tempC: 28.6 },
        { id: "t2", at: iso("2026-09-12T15:30"), tempC: 31.2 },
        { id: "t3", at: iso("2026-09-13T09:00"), tempC: 24.8 },
      ],
      createdAt: iso("2026-09-12T10:05"),
    },
    {
      id: makeId(),
      caseNo: "CASE-042",
      location: "室外草地（树荫侧）",
      exposureStage: "腐烂期",
      tempC: 25.1,
      sampledAt: iso("2026-09-18T16:10"),
      species: "丝光绿蝇",
      devStage: "蛹",
      stageNote: "初蛹",
      storage: "干燥离心管",
      notes: "同一案件再次送检，新发育阶段更新当前结论",
      temperaturePoints: [
        { id: "t1", at: iso("2026-09-18T16:10"), tempC: 25.1 },
        { id: "t2", at: iso("2026-09-19T08:40"), tempC: 19.6 },
      ],
      createdAt: iso("2026-09-18T16:40"),
    },
    {
      id: makeId(),
      caseNo: "CASE-051",
      location: "水沟边缘",
      exposureStage: "白骨化前期",
      tempC: 22.4,
      sampledAt: iso("2026-09-20T11:20"),
      species: "",
      devStage: "",
      stageNote: "",
      storage: "",
      notes: "种属待鉴定员补录",
      temperaturePoints: [
        { id: "t1", at: iso("2026-09-20T11:20"), tempC: 22.4 },
      ],
      createdAt: iso("2026-09-20T11:50"),
    },
  ];
}

function loadBatches(): Batch[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedBatches();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Batch[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useLedger() {
  const [batches, setBatches] = useState<Batch[]>(loadBatches);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
  }, [batches]);

  const addBatch = useCallback(
    (batch: Omit<Batch, "id" | "createdAt" | "temperaturePoints"> & {
      temperaturePoints?: Batch["temperaturePoints"];
    }): Batch => {
      const full: Batch = {
        ...batch,
        id: makeId(),
        createdAt: new Date().toISOString(),
        temperaturePoints:
          batch.temperaturePoints && batch.temperaturePoints.length > 0
            ? batch.temperaturePoints
            : [
                {
                  id: `t_${Date.now().toString(36)}`,
                  at: batch.sampledAt,
                  tempC: batch.tempC,
                },
              ],
      };
      setBatches((prev) => [...prev, full]);
      return full;
    },
    []
  );

  const updateBatch = useCallback((id: string, patch: Partial<Batch>) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
  }, []);

  const removeBatch = useCallback((id: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const addTemperaturePoint = useCallback(
    (batchId: string, at: string, tempC: number) => {
      setBatches((prev) =>
        prev.map((b) =>
          b.id === batchId
            ? {
                ...b,
                temperaturePoints: [
                  ...b.temperaturePoints,
                  { id: `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, at, tempC },
                ].sort((x, y) => +new Date(x.at) - +new Date(y.at)),
              }
            : b
        )
      );
    },
    []
  );

  const removeTemperaturePoint = useCallback(
    (batchId: string, pointId: string) => {
      setBatches((prev) =>
        prev.map((b) =>
          b.id === batchId
            ? {
                ...b,
                temperaturePoints: b.temperaturePoints.filter(
                  (p) => p.id !== pointId
                ),
              }
            : b
        )
      );
    },
    []
  );

  return {
    batches,
    addBatch,
    updateBatch,
    removeBatch,
    addTemperaturePoint,
    removeTemperaturePoint,
  };
}
