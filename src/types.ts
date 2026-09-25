export interface Batch {
  id: string;
  name: string;
  note: string;
  createdAt: string;
}

export interface SampleForm {
  caseNo: string; // 案件编号（可后补）
  location: string; // 采样地点（接收必填）
  exposureStage: string; // 暴露阶段（接收必填）
  temperature: string; // 环境温度 ℃（接收必填）
  sampledAt: string; // 采样时刻（接收必填）
  species: string; // 昆虫种类
  devStage: string; // 发育阶段
  preservation: string; // 保存方式
  note: string; // 鉴定备注
}

export interface Sample extends SampleForm {
  id: string;
  batchId: string;
  createdAt: string;
}

export interface StoreData {
  batches: Batch[];
  samples: Sample[];
}

export type FormErrors = Partial<Record<keyof SampleForm, string>>;

export const STAGE_FILTERS = ["卵", "幼虫", "蛹", "成虫"] as const;

export const EXPOSURE_STAGES = [
  "新鲜期",
  "肿胀期",
  "腐烂期",
  "后腐烂期",
  "白骨化期",
];

export const COMMON_SPECIES = [
  "丝光绿蝇",
  "大头金蝇",
  "家蝇",
  "棕尾别麻蝇",
  "黑尾黑麻蝇",
];

export const DEV_STAGES = [
  "卵",
  "一龄幼虫",
  "二龄幼虫",
  "三龄幼虫",
  "蛹",
  "成虫",
];
