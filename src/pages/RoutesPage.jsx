import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Download,
  FileCheck2,
  FileSpreadsheet,
  LoaderCircle,
  RefreshCw,
  Search,
  Sheet,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import FileSaver from "file-saver";
import { toast } from "react-toastify";
import { useAuth } from "../AuthContext";
import { usePageSettings } from "../PageSettingsContext";
import {
  getRouteWorkbookBuffer,
  getRouteWorkbookMeta,
  inspectRouteWorkbookFile,
  saveRouteWorkbook,
} from "../services/routeWorkbookService";
import {
  getPreviewMergeAt,
  isPreviewCellSelected,
  isPreviewMergeMaster,
  MAX_ROUTE_WORKBOOK_BYTES,
  parseRouteWorkbook,
  previewSelectionCount,
  previewSelectionToHtml,
  previewSelectionToText,
  routePreviewColumnName,
} from "../utils/routeExcelPreview";

const { saveAs } = FileSaver;

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDateTime(value) {
  if (!value) return "Chưa xác định";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa xác định";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function writeSelectionClipboard(sheet, selection) {
  const text = previewSelectionToText(sheet, selection);
  const html = previewSelectionToHtml(sheet, selection);

  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([text], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      }),
    ]);
    return true;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

function UploadWorkbookDialog({ open, onClose, onUploaded, busy, currentMeta }) {
  const [file, setFile] = useState(null);
  const [inspection, setInspection] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setInspection(null);
    setChecking(false);
  }, [open]);

  if (!open) return null;

  const inspect = async selected => {
    if (!selected) return;
    setChecking(true);
    setFile(selected);
    setInspection(null);
    try {
      const next = await inspectRouteWorkbookFile(selected);
      setInspection(next);
    } catch (error) {
      setFile(null);
      toast.error(error.message || "Không thể đọc file Excel");
    } finally {
      setChecking(false);
    }
  };

  return <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
    <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-emerald-600 dark:text-emerald-300"><UploadCloud size={15}/>Cập nhật dữ liệu Tuyến</span>
          <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Tải file Excel lên</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">File mới sẽ trở thành nguồn xem trước và file tải xuống cho toàn bộ người dùng.</p>
        </div>
        <button type="button" onClick={() => !busy && onClose()} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18}/></button>
      </div>

      {currentMeta && <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
        File hiện tại: <b className="text-slate-700 dark:text-slate-200">{currentMeta.originalName}</b> · {formatBytes(currentMeta.size)}
      </div>}

      <label className="mt-5 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 px-5 py-7 text-center transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20 dark:hover:border-emerald-700">
        {checking
          ? <LoaderCircle className="animate-spin text-emerald-600" size={34}/>
          : <FileSpreadsheet className="text-emerald-600 dark:text-emerald-300" size={38}/>}
        <b className="mt-3 text-sm text-slate-800 dark:text-slate-100">{file?.name || "Chọn file Excel .xlsx"}</b>
        <span className="mt-1 text-xs text-slate-400">Tối đa {Math.round(MAX_ROUTE_WORKBOOK_BYTES / 1024 / 1024)} MB</span>
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          disabled={busy || checking}
          onChange={event => inspect(event.target.files?.[0])}
        />
      </label>

      {inspection && <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300"><FileCheck2 size={17}/>File hợp lệ</div>
        <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-3">
          <div><span className="block text-slate-400">Dung lượng</span><b>{formatBytes(inspection.size)}</b></div>
          <div><span className="block text-slate-400">Số sheet</span><b>{inspection.preview.sheetNames.length}</b></div>
          <div><span className="block text-slate-400">Số ô xem trước</span><b>{inspection.preview.totalCells.toLocaleString("vi-VN")}</b></div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {inspection.preview.sheetNames.map(name => <span key={name} className="rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-emerald-900 dark:bg-slate-900 dark:text-slate-300">{name}</span>)}
        </div>
      </div>}

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="secondary-button" disabled={busy} onClick={onClose}>Hủy</button>
        <button type="button" className="primary-button !bg-emerald-600 !shadow-none hover:!bg-emerald-700" disabled={!inspection || busy || checking} onClick={() => onUploaded(file, inspection)}>
          {busy ? <LoaderCircle className="animate-spin" size={17}/> : <UploadCloud size={17}/>}
          {busy ? "Đang tải lên..." : currentMeta ? "Thay file hiện tại" : "Đưa file lên hệ thống"}
        </button>
      </div>
    </div>
  </div>;
}

export default function RoutesPage() {
  const auth = useAuth();
  const pageSettings = usePageSettings();
  const pageTitle = pageSettings.getPage("routes")?.title || "Tuyến";
  const canManage = auth.role === "admin" || auth.role === "superadmin";

  const [meta, setMeta] = useState(null);
  const [buffer, setBuffer] = useState(null);
  const [preview, setPreview] = useState(null);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [selection, setSelection] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);

  const activeSheet = preview?.sheets?.[activeSheetIndex] || null;
  const gridRef = useRef(null);

  const loadWorkbook = useCallback(async () => {
    setLoading(true);
    try {
      const currentMeta = await getRouteWorkbookMeta();
      if (!currentMeta) {
        setMeta(null);
        setBuffer(null);
        setPreview(null);
        return;
      }
      const currentBuffer = await getRouteWorkbookBuffer(currentMeta);
      const currentPreview = await parseRouteWorkbook(currentBuffer);
      setMeta(currentMeta);
      setBuffer(currentBuffer);
      setPreview(currentPreview);
      setActiveSheetIndex(index => Math.min(index, Math.max(0, currentPreview.sheets.length - 1)));
    } catch (error) {
      setMeta(null);
      setBuffer(null);
      setPreview(null);
      toast.error(error.message || "Không thể tải file Excel Tuyến");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadWorkbook(); }, [loadWorkbook]);

  useEffect(() => {
    const stop = () => setDragging(false);
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, []);

  useEffect(() => {
    setSelection(null);
    setSearchQuery("");
    setMatchIndex(0);
  }, [activeSheetIndex]);

  const matches = useMemo(() => {
    const needle = searchQuery.trim().toLocaleLowerCase("vi");
    if (!needle || !activeSheet) return [];
    const result = [];
    activeSheet.rows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (String(cell?.text || "").toLocaleLowerCase("vi").includes(needle)) result.push({ row: rowIndex, col: colIndex });
      });
    });
    return result;
  }, [activeSheet, searchQuery]);

  const selectedCount = previewSelectionCount(selection);

  const selectCell = (event, row, col) => {
    event.preventDefault();
    const merge = getPreviewMergeAt(activeSheet, row, col);
    if (event.shiftKey && selection?.anchor) {
      setSelection({
        anchor: selection.anchor,
        focus: merge ? { row: merge.rowEnd, col: merge.colEnd } : { row, col },
      });
    } else if (merge) {
      setSelection({
        anchor: { row: merge.rowStart, col: merge.colStart },
        focus: { row: merge.rowEnd, col: merge.colEnd },
      });
    } else {
      setSelection({ anchor: { row, col }, focus: { row, col } });
    }
    setDragging(true);
  };

  const extendSelection = (row, col) => {
    if (!dragging || !selection?.anchor) return;
    const merge = getPreviewMergeAt(activeSheet, row, col);
    setSelection(current => ({
      anchor: current.anchor,
      focus: merge ? { row: merge.rowEnd, col: merge.colEnd } : { row, col },
    }));
  };

  const copySelection = useCallback(async () => {
    if (!activeSheet || !selection) return toast.info("Chọn một hoặc nhiều ô trước khi copy");
    try {
      await writeSelectionClipboard(activeSheet, selection);
      toast.success(`Đã copy ${selectedCount} ô`);
    } catch (error) {
      toast.error(error.message || "Không thể copy vùng chọn");
    }
  }, [activeSheet, selectedCount, selection]);

  useEffect(() => {
    const onKeyDown = event => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "c") return;
      const tag = event.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || event.target?.isContentEditable || !selection) return;
      event.preventDefault();
      copySelection();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [copySelection, selection]);

  const goToMatch = delta => {
    if (!matches.length || !activeSheet) return;
    const nextIndex = (matchIndex + delta + matches.length) % matches.length;
    const target = matches[nextIndex];
    const merge = getPreviewMergeAt(activeSheet, target.row, target.col);
    const master = merge ? { row: merge.rowStart, col: merge.colStart } : target;
    setMatchIndex(nextIndex);
    setSelection(merge
      ? { anchor: master, focus: { row: merge.rowEnd, col: merge.colEnd } }
      : { anchor: target, focus: target });
    requestAnimationFrame(() => {
      document.getElementById(`excel-preview-cell-${master.row}-${master.col}`)?.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: "smooth",
      });
    });
  };

  const downloadOriginal = async () => {
    if (!meta) return;
    try {
      const currentBuffer = buffer || await getRouteWorkbookBuffer(meta);
      if (!currentBuffer) throw new Error("Không tìm thấy file Excel");
      saveAs(
        new Blob([currentBuffer], { type: meta.contentType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        meta.originalName || "TUYEN.xlsx",
      );
    } catch (error) {
      toast.error(error.message || "Không thể tải file Excel");
    }
  };

  const uploadWorkbook = async (file, inspection) => {
    setUploading(true);
    try {
      const uploadedByName = auth.profile?.fullName || auth.profile?.username || auth.user?.email?.split("@")[0] || "Admin";
      const savedMeta = await saveRouteWorkbook(file, { inspection, uploadedByName });
      setMeta(savedMeta);
      setBuffer(inspection.buffer);
      setPreview(inspection.preview);
      setActiveSheetIndex(0);
      setSelection(null);
      setSearchQuery("");
      setUploadOpen(false);
      toast.success("Đã cập nhật file Excel Tuyến");
    } catch (error) {
      toast.error(error.message || "Không thể tải file Excel lên hệ thống");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <section className="mx-auto grid min-h-[65vh] max-w-7xl place-items-center px-4"><div className="text-center text-slate-500"><LoaderCircle className="mx-auto animate-spin text-emerald-600" size={38}/><p className="mt-3 text-sm">Đang mở file Excel Tuyến...</p></div></section>;

  return <section className="mx-auto max-w-[1720px] px-3 py-5 sm:px-5 sm:py-7 lg:px-7">
    <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#f0fdf4_0%,#ffffff_48%,#ecfeff_100%)] px-5 py-5 dark:border-slate-800 dark:bg-[linear-gradient(135deg,#052e16_0%,#0f172a_48%,#083344_100%)] sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-emerald-700 shadow-sm dark:border-emerald-900 dark:bg-slate-900/70 dark:text-emerald-300"><FileSpreadsheet size={14}/>Excel Viewer</span>
            <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{pageTitle}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">Xem trực tiếp file Excel do Admin cập nhật, chọn vùng để copy như Excel và tải lại đúng file gốc khi cần.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManage && <button type="button" onClick={() => setUploadOpen(true)} className="secondary-button"><UploadCloud size={17}/>{meta ? "Cập nhật file Excel" : "Tải file Excel lên"}</button>}
            <button type="button" onClick={downloadOriginal} disabled={!meta} className="secondary-button"><Download size={17}/>Tải file Excel</button>
            <button type="button" onClick={copySelection} disabled={!selection} className="primary-button !bg-emerald-600 !shadow-none hover:!bg-emerald-700 disabled:opacity-40"><ClipboardCopy size={17}/>Copy {selectedCount ? `${selectedCount} ô` : "vùng chọn"}</button>
          </div>
        </div>

        {meta && <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/80 bg-white/70 px-3.5 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">File hiện tại</span><b className="mt-1 block truncate text-xs text-slate-700 dark:text-slate-200">{meta.originalName}</b></div>
          <div className="rounded-2xl border border-white/80 bg-white/70 px-3.5 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Workbook</span><b className="mt-1 block text-xs text-slate-700 dark:text-slate-200">{meta.sheetCount} sheet · {formatBytes(meta.size)}</b></div>
          <div className="rounded-2xl border border-white/80 bg-white/70 px-3.5 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Cập nhật</span><b className="mt-1 block text-xs text-slate-700 dark:text-slate-200">{formatDateTime(meta.updatedAt)}</b></div>
          <div className="rounded-2xl border border-white/80 bg-white/70 px-3.5 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Người cập nhật</span><b className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-700 dark:text-slate-200"><UserRound size={13}/>{meta.uploadedByName || "Admin"}</b></div>
        </div>}
      </div>

      {!preview || !meta ? <div className="grid min-h-[520px] place-items-center p-6">
        <div className="max-w-lg text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"><FileSpreadsheet size={32}/></span>
          <h2 className="mt-5 text-xl font-bold text-slate-800 dark:text-white">Chưa có file Excel Tuyến</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{canManage ? "Hãy tải file .xlsx lên. Sau đó toàn bộ người dùng sẽ xem và tải đúng phiên bản file này." : "Admin/SuperAdmin chưa cập nhật file Excel. Vui lòng quay lại sau."}</p>
          {canManage && <button type="button" onClick={() => setUploadOpen(true)} className="primary-button mx-auto mt-5 !bg-emerald-600 !shadow-none hover:!bg-emerald-700"><UploadCloud size={17}/>Tải file Excel lên</button>}
        </div>
      </div> : <div className="p-3 sm:p-4">
        <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"><Sheet size={18}/></span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-slate-800 dark:text-white">{activeSheet?.name}</h2>
              <p className="mt-0.5 text-[11px] text-slate-400">{activeSheet?.rowCount} hàng · {activeSheet?.columnCount} cột{selection ? ` · đã chọn ${selectedCount} ô` : ""}</p>
            </div>
          </div>

          <div className="flex w-full max-w-2xl items-center gap-2 xl:w-auto xl:flex-1">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
              <input className="field-input !h-10 !pl-9 !text-xs" value={searchQuery} onChange={event => { setSearchQuery(event.target.value); setMatchIndex(0); }} placeholder="Tìm nội dung trong sheet đang xem..."/>
            </div>
            {searchQuery && <span className="hidden min-w-20 text-center text-[11px] font-semibold text-slate-400 sm:block">{matches.length ? `${matchIndex + 1}/${matches.length}` : "0 kết quả"}</span>}
            <button type="button" disabled={!matches.length} onClick={() => goToMatch(-1)} className="secondary-button !h-10 !w-10 !px-0"><ChevronLeft size={16}/></button>
            <button type="button" disabled={!matches.length} onClick={() => goToMatch(1)} className="secondary-button !h-10 !w-10 !px-0"><ChevronRight size={16}/></button>
            <button type="button" title="Tải lại file" onClick={loadWorkbook} className="secondary-button !h-10 !w-10 !px-0"><RefreshCw size={16}/></button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-inner dark:border-slate-700">
          <div ref={gridRef} className="max-h-[72vh] overflow-auto bg-white">
            <table className="table-fixed border-separate border-spacing-0 text-[12px] text-slate-800" style={{ width: "max-content", minWidth: "100%" }}>
              <colgroup>
                <col style={{ width: 44 }}/>
                {activeSheet.columnWidths.map((width, col) => <col key={col} style={{ width: Math.max(8, width), minWidth: Math.max(8, width) }}/>)}
              </colgroup>
              <thead className="sticky top-0 z-30">
                <tr>
                  <th className="sticky left-0 z-40 h-7 w-11 border-b border-r border-slate-300 bg-[#e5e7eb] text-[10px] font-semibold text-slate-500"/>
                  {Array.from({ length: activeSheet.columnCount }, (_, col) => <th key={col} className="h-7 border-b border-r border-slate-300 bg-[#eef1f5] px-1 text-center text-[10px] font-semibold text-slate-500">{routePreviewColumnName(col)}</th>)}
                </tr>
              </thead>
              <tbody>
                {activeSheet.rows.map((row, rowIndex) => {
                  const rowHeight = Math.max(8, activeSheet.rowHeights[rowIndex] || 24);
                  return <tr key={rowIndex} style={{ height: rowHeight }}>
                    <th className="sticky left-0 z-20 w-11 border-b border-r border-slate-300 bg-[#eef1f5] px-1 text-center text-[10px] font-medium text-slate-500">{rowIndex + 1}</th>
                    {row.map((cell, colIndex) => {
                      const merge = getPreviewMergeAt(activeSheet, rowIndex, colIndex);
                      if (merge && !isPreviewMergeMaster(merge, rowIndex, colIndex)) return null;
                      const selected = isPreviewCellSelected(selection, rowIndex, colIndex);
                      const matched = matches.some(item => item.row === rowIndex && item.col === colIndex);
                      const rowSpan = merge ? merge.rowEnd - merge.rowStart + 1 : undefined;
                      const colSpan = merge ? merge.colEnd - merge.colStart + 1 : undefined;
                      const css = {
                        ...cell.css,
                        minHeight: rowHeight,
                        whiteSpace: cell.css?.whiteSpace || "pre-wrap",
                        overflowWrap: "break-word",
                      };

                      return <td
                        id={`excel-preview-cell-${rowIndex}-${colIndex}`}
                        key={colIndex}
                        rowSpan={rowSpan}
                        colSpan={colSpan}
                        onPointerDown={event => selectCell(event, rowIndex, colIndex)}
                        onPointerEnter={() => extendSelection(rowIndex, colIndex)}
                        style={css}
                        className={`relative select-none border-b border-r border-slate-200 bg-white px-1.5 py-1 align-middle ${selected ? "z-10 ring-2 ring-inset ring-emerald-500" : matched ? "ring-2 ring-inset ring-amber-400" : ""}`}
                      >
                        {cell.hyperlink
                          ? <a href={cell.hyperlink} target="_blank" rel="noreferrer" onPointerDown={event => event.stopPropagation()} className="underline underline-offset-2" style={{ color: cell.css?.color || "#2563EB" }}>{cell.text}</a>
                          : cell.text}
                      </td>;
                    })}
                  </tr>;
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-300 bg-[#f3f4f6] px-2 py-1.5">
            <span className="mr-1 shrink-0 px-2 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Sheets</span>
            {preview.sheets.map((sheet, index) => <button
              key={sheet.id}
              type="button"
              onClick={() => setActiveSheetIndex(index)}
              className={`shrink-0 rounded-md border px-3 py-1.5 text-[11px] font-semibold transition ${index === activeSheetIndex ? "border-emerald-500 bg-white text-emerald-700 shadow-sm" : "border-transparent text-slate-500 hover:border-slate-300 hover:bg-white"}`}
            >{sheet.name}</button>)}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
          <span>Kéo chuột chọn vùng rồi bấm <b className="text-slate-600 dark:text-slate-300">Copy</b> hoặc Ctrl/Cmd+C để dán sang Excel.</span>
          <span>Đang xem file gốc · không chỉnh sửa dữ liệu trên web</span>
        </div>
      </div>}
    </div>

    <UploadWorkbookDialog
      open={uploadOpen}
      currentMeta={meta}
      busy={uploading}
      onClose={() => setUploadOpen(false)}
      onUploaded={uploadWorkbook}
    />
  </section>;
}
