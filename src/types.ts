export const DEV_STAGES = ["卵", "幼虫", "蛹", "成虫"] as const;
export type DevStage = (typeof DEV_STAGES)[number] | "";

export interface TemperaturePoint {
  id: string;
  /** ISO 时刻 */
  at: string;
  /** 摄氏度 */
  tempC: number;
}

export interface Batch {
  id: string;
  /** 案件编号，可后补（采样员先送检、鉴定员后关联案件） */
  caseNo: string;
  /** 采样地点（必填） */
  location: string;
  /** 尸体暴露阶段（必填） */
  exposureStage: string;
  /** 采样时刻环境温度（必填，入账时登记） */
  tempC: number;
  /** 采样时刻（必填） */
  sampledAt: string;
  /** 昆虫种类，可后补 */
  species: string;
  /** 发育阶段，可后补；空表示待鉴定 */
  devStage: DevStage;
  /** 发育阶段补充描述，如“三龄”，可后补 */
  stageNote: string;
  /** 保存方式，可后补 */
  storage: string;
  /** 鉴定备注，可后补 */
  notes: string;
  /** 批次温度曲线，入账时以采样温度为首点 */
  temperaturePoints: TemperaturePoint[];
  /** 入账时刻（本机） */
  createdAt: string;
}

/** 表单草稿：必填项为空时不接收，其余字段允许留空后补 */
export type BatchDraft = {
  caseNo: string;
  location: string;
  exposureStage: string;
  tempC: string;
  sampledAt: string;
  species: string;
  devStage: DevStage;
  stageNote: string;
  storage: string;
  notes: string;
};

export const EMPTY_DRAFT: BatchDraft = {
  caseNo: "",
  location: "",
  exposureStage: "",
  tempC: "",
  sampledAt: "",
  species: "",
  devStage: "",
  stageNote: "",
  storage: "",
  notes: "",
};

/** 接收批次时强制校验的四项：地点、暴露阶段、温度、采样时刻 */
export const REQUIRED_KEYS = [
  "location",
  "exposureStage",
  "tempC",
  "sampledAt",
] as const;
export type RequiredKey = (typeof REQUIRED_KEYS)[number];

export const REQUIRED_LABELS: Record<RequiredKey, string> = {
  location: "采样地点",
  exposureStage: "暴露阶段",
  tempC: "环境温度",
  sampledAt: "采样时刻",
};
