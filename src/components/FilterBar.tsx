import { STAGE_FILTERS } from "../types";
import type { Sample } from "../types";

interface Props {
  samples: Sample[];
  selectedStages: Set<string>;
  selectedSpecies: string;
  onToggleStage: (stage: string) => void;
  onSelectSpecies: (species: string) => void;
  onClear: () => void;
}

/** 样本发育阶段是否归入筛选大类（卵 / 幼虫 / 蛹 / 成虫） */
export function matchStage(devStage: string, group: string): boolean {
  const s = devStage.trim();
  if (!s) return false;
  if (group === "幼虫") return s.includes("幼虫") || s === group;
  return s.startsWith(group) || s === group;
}

export default function FilterBar({
  samples,
  selectedStages,
  selectedSpecies,
  onToggleStage,
  onSelectSpecies,
  onClear,
}: Props) {
  const speciesList = Array.from(
    new Set(samples.map((s) => s.species.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "zh-CN"));

  const hasFilter = selectedStages.size > 0 || selectedSpecies !== "";

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="filter-label">发育阶段</span>
        <div className="chips">
          {STAGE_FILTERS.map((stage) => (
            <button
              key={stage}
              className={selectedStages.has(stage) ? "chip-on" : ""}
              onClick={() => onToggleStage(stage)}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <span className="filter-label">昆虫种类</span>
        <select
          value={selectedSpecies}
          onChange={(e) => onSelectSpecies(e.target.value)}
        >
          <option value="">全部种类</option>
          {speciesList.map((sp) => (
            <option key={sp} value={sp}>
              {sp}
            </option>
          ))}
        </select>
      </div>
      {hasFilter && <button onClick={onClear}>清除筛选</button>}
    </div>
  );
}
