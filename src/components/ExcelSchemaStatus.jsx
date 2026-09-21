import { useEffect, useState } from "react";
import { CheckCircle2, FileSpreadsheet, FileWarning, LoaderCircle } from "lucide-react";
import { inspectExcelFile } from "../utils/excelSchemaValidator";
import { inspectGsttFileForRange } from "../utils/gsttProcessor";
import { inspectTxdlFile } from "../utils/txdlProcessor";

export default function ExcelSchemaStatus({ file, schemaKey, startDate = "", endDate = "" }) {
  const [state, setState] = useState(null);
  useEffect(() => {
    let active = true;
    if (!file) { setState(null); return () => { active = false; }; }
    setState({ checking: true });
    const inspection = schemaKey === "gstt"
      ? inspectGsttFileForRange(file, startDate, endDate)
      : schemaKey === "txdl"
        ? inspectTxdlFile(file)
        : inspectExcelFile(file, schemaKey);
    inspection.then(result => { if (active) setState(result); })
      .catch(error => { if (active) setState({ valid: false, error: error.message || "Không thể kiểm tra file" }); });
    return () => { active = false; };
  }, [file, schemaKey, startDate, endDate]);

  if (!file || !state) return null;
  if (state.checking) return <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-400"><LoaderCircle className="animate-spin" size={14}/>Đang kiểm tra cấu trúc Excel...</div>;
  if (state.pendingRange) return <div className="mt-2 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300"><FileSpreadsheet className="mt-0.5 shrink-0" size={15}/><span><b>{state.message}</b><span className="block">{state.detail}</span></span></div>;
  if (state.valid) return <div className="mt-2 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"><CheckCircle2 className="mt-0.5 shrink-0" size={15}/><span><b>{state.message}</b>{state.detail ? <span className="mt-0.5 block opacity-80">{state.detail}</span> : null}{state.matchedSheets?.length ? <span className="mt-0.5 block opacity-80">Sheet sử dụng: {state.matchedSheets.join(", ")}</span> : null}</span></div>;
  const warning = state.severity === "warning";
  return <div className={`mt-2 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs leading-5 ${warning ? "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300" : "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"}`}><FileWarning className="mt-0.5 shrink-0" size={15}/><span><b>{warning ? "Cần kiểm tra khoảng ngày / sheet tháng." : "File có cấu trúc chưa hợp lệ."}</b><span className="block">{state.error || state.message}</span>{state.detail ? <span className="block opacity-85">{state.detail}</span> : null}{state.foundSheets?.length ? <span className="block opacity-75">Đã tìm thấy: {state.foundSheets.join(", ")}</span> : null}</span></div>;
}
