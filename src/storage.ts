import type { Batch, Sample, StoreData } from "./types";

const STORAGE_KEY = "forensic-entomology-ledger-v1";

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function seedData(): StoreData {
  const now = new Date();
  const iso = (offsetHours: number): string => {
    const d = new Date(now.getTime() - offsetHours * 3600_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const batchA: Batch = {
    id: "batch-seed-042",
    name: "CASE-042 批次（9月18日送检）",
    note: "城东废弃工地，两具相关现场交叉送检",
    createdAt: iso(170),
  };
  const batchB: Batch = {
    id: "batch-seed-051",
    name: "CASE-051 批次（9月20日送检）",
    note: "水沟沿线样本，含成虫网捕",
    createdAt: iso(120),
  };

  const samples: Sample[] = [
    {
      id: "s-seed-1",
      batchId: batchA.id,
      createdAt: iso(170),
      caseNo: "CASE-042",
      location: "室外草地",
      exposureStage: "肿胀期",
      temperature: "28.6",
      sampledAt: iso(172),
      species: "丝光绿蝇",
      devStage: "三龄幼虫",
      preservation: "75% 乙醇保存",
      note: "幼虫三龄，体长 14mm",
    },
    {
      id: "s-seed-2",
      batchId: batchA.id,
      createdAt: iso(168),
      caseNo: "CASE-042",
      location: "阴影区域",
      exposureStage: "肿胀期",
      temperature: "26.1",
      sampledAt: iso(168),
      species: "丝光绿蝇",
      devStage: "蛹",
      preservation: "干燥冷藏",
      note: "蛹期样本，需复核种属",
    },
    {
      id: "s-seed-3",
      batchId: batchB.id,
      createdAt: iso(120),
      caseNo: "CASE-051",
      location: "水沟边缘",
      exposureStage: "腐烂期",
      temperature: "24.8",
      sampledAt: iso(122),
      species: "大头金蝇",
      devStage: "成虫",
      preservation: "针插标本",
      note: "已完成拍照",
    },
    {
      id: "s-seed-4",
      batchId: batchB.id,
      createdAt: iso(96),
      caseNo: "CASE-051",
      location: "水沟边缘",
      exposureStage: "腐烂期",
      temperature: "23.5",
      sampledAt: iso(96),
      species: "棕尾别麻蝇",
      devStage: "",
      preservation: "",
      note: "等待复检，发育阶段暂未定",
    },
  ];

  return { batches: [batchA, batchB], samples };
}

export function loadStore(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = seedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as StoreData;
    if (!Array.isArray(parsed.batches) || !Array.isArray(parsed.samples)) {
      throw new Error("bad data");
    }
    return parsed;
  } catch {
    return seedData();
  }
}

export function saveStore(data: StoreData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** 温度曲线点位：批次内样本按采样时刻排序 */
export interface TempPoint {
  sampleId: string;
  caseNo: string;
  label: string;
  time: string;
  temp: number;
}

export function temperaturePoints(samples: Sample[]): TempPoint[] {
  return samples
    .map((s) => ({ s, temp: parseFloat(s.temperature) }))
    .filter(({ temp }) => Number.isFinite(temp))
    .sort((a, b) => a.s.sampledAt.localeCompare(b.s.sampledAt))
    .map(({ s, temp }) => ({
      sampleId: s.id,
      caseNo: s.caseNo || "（案件编号待补）",
      label: s.species || "未定种",
      time: s.sampledAt,
      temp,
    }));
}
