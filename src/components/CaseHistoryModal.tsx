import type { Batch, Sample } from "../types";

interface Props {
  caseNo: string | null;
  samples: Sample[];
  batches: Batch[];
  onClose: () => void;
  onEdit: (sample: Sample) => void;
  onSelectBatch: (batchId: string) => void;
}

export default function CaseHistoryModal({
  caseNo,
  samples,
  batches,
  onClose,
  onEdit,
  onSelectBatch,
}: Props) {
  if (!caseNo) return null;

  const history = [...samples]
    .filter((s) => s.caseNo.trim() === caseNo)
    .sort((a, b) => b.sampledAt.localeCompare(a.sampledAt));
  const currentId = history[0]?.id;
  const batchName = (id: string) =>
    batches.find((b) => b.id === id)?.name ?? "未知批次";

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="heading">
          <div>
            <p>案件样本关联</p>
            <h2>{caseNo} · 送检历史</h2>
          </div>
          <button onClick={onClose}>关闭</button>
        </div>
        <p className="modal-hint">
          共 {history.length} 次送检记录，历史全部保留；最新采样时刻的发育阶段作为当前结论。
        </p>
        <div className="history-list">
          {history.map((s) => {
            const isCurrent = s.id === currentId;
            return (
              <article
                key={s.id}
                className={"history-item" + (isCurrent ? " current" : "")}
              >
                <header>
                  <span className={"badge " + (isCurrent ? "badge-current" : "badge-history")}>
                    {isCurrent ? "当前结论" : "历史记录"}
                  </span>
                  <time>{new Date(s.sampledAt).toLocaleString("zh-CN")}</time>
                </header>
                <dl className="card-fields">
                  <div>
                    <dt>发育阶段</dt>
                    <dd>{s.devStage.trim() || "待鉴定（待补）"}</dd>
                  </div>
                  <div>
                    <dt>昆虫种类</dt>
                    <dd>{s.species.trim() || "待补录"}</dd>
                  </div>
                  <div>
                    <dt>采样地点</dt>
                    <dd>{s.location.trim() || "待补录"}</dd>
                  </div>
                  <div>
                    <dt>暴露阶段</dt>
                    <dd>{s.exposureStage.trim() || "待补录"}</dd>
                  </div>
                  <div>
                    <dt>环境温度</dt>
                    <dd>{s.temperature.trim() ? `${s.temperature} ℃` : "待补录"}</dd>
                  </div>
                  <div>
                    <dt>保存方式</dt>
                    <dd>{s.preservation.trim() || "待补录"}</dd>
                  </div>
                  <div className="full">
                    <dt>鉴定备注</dt>
                    <dd>{s.note.trim() || "—"}</dd>
                  </div>
                </dl>
                <footer>
                  <span>所属批次：{batchName(s.batchId)}</span>
                  <span className="history-ops">
                    <button
                      onClick={() => {
                        onSelectBatch(s.batchId);
                        onEdit(s);
                        onClose();
                      }}
                    >
                      补录 / 修改
                    </button>
                  </span>
                </footer>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
