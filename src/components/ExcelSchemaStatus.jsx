import { useEffect, useState } from "react";
import { CheckCircle2, FileWarning, LoaderCircle } from "lucide-react";
import { inspectExcelFile } from "../utils/excelSchemaValidator";

export default function ExcelSchemaStatus({ file, schemaKey }) {
  const [state, setState] = useState(null);
  useEffect(() => {
    let active = true;
    if (!file) { setState(null); return () => { active = false; }; }
    setState({ checking: true });
    inspectExcelFile(file, schemaKey)
      .then(result => { if (active) setState(result); })
      .catch(error => { if (active) setState({ valid: false, error: error.message || "Không thể kiểm tra file" }); });
    return () => { active = false; };
  }, [file, schemaKey]);

  if (!file || !state) return null;
  if (state.checking) return <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-400"><LoaderCircle className="animate-spin" size={14}/>Đang kiểm tra cấu trúc Excel...</div>;
  if (state.valid) return <div className="mt-2 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"><CheckCircle2 className="mt-0.5 shrink-0" size={15}/><span><b>{state.message}</b><span className="mt-0.5 block opacity-80">Sheet: {state.matchedSheets.join(", ")}</span></span></div>;
  return <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"><FileWarning className="mt-0.5 shrink-0" size={15}/><span><b>File có cấu trúc chưa hợp lệ.</b><span className="block">{state.error || state.message}</span>{state.foundSheets?.length ? <span className="block opacity-75">Đã tìm thấy: {state.foundSheets.join(", ")}</span> : null}</span></div>;
}
