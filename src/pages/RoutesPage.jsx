import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Columns3,
  Download,
  ExternalLink,
  FileSpreadsheet,
  LoaderCircle,
  Pencil,
  Plus,
  Rows3,
  Save,
  Search,
  Settings2,
  Sheet,
  Trash2,
  Waypoints,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../AuthContext";
import { usePageSettings } from "../PageSettingsContext";
import { exportRouteSheetsToExcel } from "../utils/exportRouteSheets";
import {
  createRouteSheet,
  deleteRouteSheet,
  getRouteSheets,
  saveRouteSheet,
} from "../services/routeSheetService";
import {
  countRouteSelectionCells,
  deleteRouteColumn,
  deleteRouteRow,
  findRouteMatches,
  insertRouteColumn,
  insertRouteRow,
  isRouteCellSelected,
  normalizeRouteSheet,
  routeColumnName,
  routeSelectionBounds,
  routeSelectionToText,
  updateRouteCell,
} from "../utils/routeSheet";
import { routeRowKind, routeSheetColumnMetrics } from "../utils/routeSheetPresentation";

function isUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function selectionHtml(sheet, selection) {
  const bounds = routeSelectionBounds(selection);
  if (!bounds) return "";
  const normalized = normalizeRouteSheet(sheet);
  const rows = [];
  for (let row = bounds.rowStart; row <= bounds.rowEnd; row += 1) {
    const cells = [];
    for (let col = bounds.colStart; col <= bounds.colEnd; col += 1) {
      const value = String(normalized.rows[row]?.cells?.[col] ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      cells.push(`<td>${value}</td>`);
    }
    rows.push(`<tr>${cells.join("")}</tr>`);
  }
  return `<table><tbody>${rows.join("")}</tbody></table>`;
}

async function writeSelectionClipboard(sheet, selection) {
  const text = routeSelectionToText(sheet, selection);
  if (!text && !selection) return false;
  if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([text], { type: "text/plain" }),
        "text/html": new Blob([selectionHtml(sheet, selection)], { type: "text/html" }),
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

function SheetDialog({ dialog, onClose, onSubmit, busy }) {
  const [name, setName] = useState(dialog?.initialName || "");
  const [columns, setColumns] = useState(8);

  useEffect(() => {
    setName(dialog?.initialName || "");
    setColumns(8);
  }, [dialog?.type, dialog?.initialName]);

  if (!dialog) return null;
  const destructive = dialog.type === "delete";
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink dark:text-white">{dialog.title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{dialog.description}</p>
        </div>
        <button type="button" className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose}><X size={18}/></button>
      </div>

      {!destructive && <div className="mt-5 space-y-4">
        <label className="block"><span className="field-label">Tên sheet</span><input autoFocus className="field-input" value={name} onChange={event => setName(event.target.value)} placeholder="Ví dụ: TUYẾN MỚI"/></label>
        {dialog.type === "add" && <label className="block"><span className="field-label">Số cột ban đầu</span><input className="field-input" type="number" min="1" max="30" value={columns} onChange={event => setColumns(Math.max(1, Math.min(30, Number(event.target.value) || 1)))}/></label>}
      </div>}

      {destructive && <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm leading-6 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">Sheet <b>“{dialog.initialName}”</b> và toàn bộ dữ liệu bên trong sẽ bị xóa khỏi Firestore.</div>}

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
        <button type="button" disabled={busy || (!destructive && !name.trim())} className={destructive ? "inline-flex h-11 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50" : "primary-button"} onClick={() => onSubmit({ name: name.trim(), columns })}>
          {busy ? <LoaderCircle className="animate-spin" size={17}/> : destructive ? <Trash2 size={17}/> : <Save size={17}/>}
          {destructive ? "Xóa sheet" : "Lưu"}
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
  const [sheets, setSheets] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [selection, setSelection] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [cellDraft, setCellDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const [dialog, setDialog] = useState(null);
  const gridRef = useRef(null);

  const activeSheet = useMemo(
    () => sheets.find(sheet => sheet.id === activeId) || sheets[0] || null,
    [sheets, activeId],
  );
  const matches = useMemo(() => findRouteMatches(activeSheet, searchQuery), [activeSheet, searchQuery]);
  const matchKeys = useMemo(() => new Set(matches.map(item => `${item.row}:${item.col}`)), [matches]);
  const columnMetrics = useMemo(() => activeSheet ? routeSheetColumnMetrics(activeSheet) : [], [activeSheet]);
  const selectedCell = selection?.focus || null;
  const selectedCount = countRouteSelectionCells(selection);

  const loadSheets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRouteSheets();
      setSheets(data);
      setActiveId(current => data.some(item => item.id === current) ? current : (data[0]?.id || ""));
    } catch (error) {
      toast.error(error.message || "Không thể tải dữ liệu Tuyến");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSheets(); }, [loadSheets]);
  useEffect(() => {
    const stop = () => setDragging(false);
    window.addEventListener("pointerup", stop);
    return () => window.removeEventListener("pointerup", stop);
  }, []);

  useEffect(() => {
    setSelection(null);
    setCellDraft("");
    setSearchQuery("");
    setMatchIndex(0);
  }, [activeId]);

  useEffect(() => {
    if (!activeSheet || !selectedCell) {
      setCellDraft("");
      return;
    }
    setCellDraft(String(activeSheet.rows[selectedCell.row]?.cells?.[selectedCell.col] ?? ""));
  }, [activeSheet, selectedCell?.row, selectedCell?.col]);

  const downloadAllSheets = async () => {
    if (!sheets.length) return toast.info("Chưa có dữ liệu Tuyến để tải");
    setExporting(true);
    try {
      await exportRouteSheetsToExcel(sheets);
      toast.success(`Đã tải Excel gồm ${sheets.length} sheet`);
    } catch (error) {
      toast.error(error.message || "Không thể tạo file Excel");
    } finally {
      setExporting(false);
    }
  };

  const copySelection = useCallback(async () => {
    if (!activeSheet || !selection) return toast.info("Chọn một hoặc nhiều ô trước khi copy");
    try {
      const ok = await writeSelectionClipboard(activeSheet, selection);
      if (!ok) throw new Error("Trình duyệt không cho phép sao chép");
      const bounds = routeSelectionBounds(selection);
      const vertical = bounds?.colStart === bounds?.colEnd;
      toast.success(`Đã copy ${selectedCount} ô${vertical ? " theo hàng dọc" : ""}`);
    } catch (error) {
      toast.error(error.message || "Không thể copy vùng chọn");
    }
  }, [activeSheet, selectedCount, selection]);

  useEffect(() => {
    const onKeyDown = event => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "c") return;
      const tag = event.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || event.target?.isContentEditable) return;
      if (!selection) return;
      event.preventDefault();
      copySelection();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [copySelection, selection]);

  const selectCell = (event, row, col) => {
    event.preventDefault();
    const point = { row, col };
    if (event.shiftKey && selection?.anchor) {
      setSelection({ anchor: selection.anchor, focus: point });
    } else {
      setSelection({ anchor: point, focus: point });
    }
    setDragging(true);
  };

  const extendSelection = (row, col) => {
    if (!dragging || !selection?.anchor) return;
    setSelection(current => ({ anchor: current.anchor, focus: { row, col } }));
  };

  const goToMatch = delta => {
    if (!matches.length) return;
    const nextIndex = (matchIndex + delta + matches.length) % matches.length;
    const target = matches[nextIndex];
    setMatchIndex(nextIndex);
    setSelection({ anchor: target, focus: target });
    requestAnimationFrame(() => {
      document.getElementById(`route-cell-${target.row}-${target.col}`)?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    });
  };

  const replaceSheetLocal = next => setSheets(current => current.map(item => item.id === next.id ? next : item));

  const persistSheet = async (next, label, details = {}) => {
    setBusy(true);
    try {
      const saved = await saveRouteSheet(next, { label, details });
      replaceSheetLocal(saved);
      toast.success("Đã lưu thay đổi");
      return saved;
    } catch (error) {
      toast.error(error.message || "Không thể lưu dữ liệu Tuyến");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const saveCell = async () => {
    if (!activeSheet || !selectedCell) return toast.info("Chọn ô cần sửa");
    const next = updateRouteCell(activeSheet, selectedCell.row, selectedCell.col, cellDraft);
    await persistSheet(next, `Sửa ô ${routeColumnName(selectedCell.col)}${selectedCell.row + 1} · ${activeSheet.name}`, {
      cell: `${routeColumnName(selectedCell.col)}${selectedCell.row + 1}`,
    });
  };

  const mutateStructure = async (type) => {
    if (!activeSheet) return;
    try {
      let next = activeSheet;
      let label = "";
      if (type === "add-row") {
        next = insertRouteRow(activeSheet, selectedCell?.row ?? activeSheet.rows.length - 1);
        label = `Thêm hàng · ${activeSheet.name}`;
      } else if (type === "delete-row") {
        if (!selectedCell) return toast.info("Chọn một ô trong hàng cần xóa");
        next = deleteRouteRow(activeSheet, selectedCell.row);
        label = `Xóa hàng ${selectedCell.row + 1} · ${activeSheet.name}`;
      } else if (type === "add-col") {
        next = insertRouteColumn(activeSheet, selectedCell?.col ?? activeSheet.columnCount - 1);
        label = `Thêm cột · ${activeSheet.name}`;
      } else if (type === "delete-col") {
        if (!selectedCell) return toast.info("Chọn một ô trong cột cần xóa");
        next = deleteRouteColumn(activeSheet, selectedCell.col);
        label = `Xóa cột ${routeColumnName(selectedCell.col)} · ${activeSheet.name}`;
      }
      const saved = await persistSheet(next, label);
      if (saved) setSelection(null);
    } catch (error) {
      toast.error(error.message || "Không thể thay đổi cấu trúc sheet");
    }
  };

  const submitDialog = async ({ name, columns }) => {
    if (!dialog) return;
    setBusy(true);
    try {
      if (dialog.type === "add") {
        const created = await createRouteSheet({ name, columnCount: columns, sortOrder: sheets.length + 1 });
        await loadSheets();
        setActiveId(created.id);
        toast.success(`Đã tạo sheet “${name}”`);
      } else if (dialog.type === "rename" && activeSheet) {
        const saved = await saveRouteSheet({ ...activeSheet, name }, {
          label: `Đổi tên sheet “${activeSheet.name}” → “${name}”`,
          details: { oldName: activeSheet.name, newName: name },
        });
        replaceSheetLocal(saved);
        toast.success("Đã đổi tên sheet");
      } else if (dialog.type === "delete" && activeSheet) {
        await deleteRouteSheet(activeSheet);
        const nextSheets = sheets.filter(item => item.id !== activeSheet.id);
        setSheets(nextSheets);
        setActiveId(nextSheets[0]?.id || "");
        toast.success("Đã xóa sheet");
      }
      setDialog(null);
    } catch (error) {
      toast.error(error.message || "Không thể cập nhật sheet");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <section className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-4"><div className="text-center text-slate-500"><LoaderCircle className="mx-auto animate-spin text-brand-500" size={36}/><p className="mt-3 text-sm">Đang tải dữ liệu {pageTitle}...</p></div></section>;

  return <section className="mx-auto max-w-[1680px] px-3 py-5 sm:px-5 sm:py-7 lg:px-7">
    <div className="rounded-[28px] border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="relative overflow-hidden rounded-t-[28px] border-b border-slate-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_50%,#ecfeff_100%)] px-5 py-5 dark:border-slate-800 dark:bg-[linear-gradient(135deg,#21140c_0%,#0f172a_50%,#082f36_100%)] sm:px-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-cyan-200/30 blur-3xl dark:bg-cyan-900/20"/>
        <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-orange-200/35 blur-3xl dark:bg-orange-900/20"/>
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-brand-600 shadow-sm backdrop-blur dark:border-orange-900/50 dark:bg-slate-900/70 dark:text-orange-300"><Waypoints size={14}/>Danh mục tuyến</span>
            <div className="mt-2.5 flex flex-wrap items-end gap-x-3 gap-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white sm:text-3xl">{pageTitle}</h1>
              <span className="mb-1 text-xs font-medium text-slate-400">{sheets.length} sheet dữ liệu</span>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">Tra cứu nhanh, chọn nhiều ô rồi copy dọc sang Excel/BA GPS. Các tiêu đề và nhóm dữ liệu được làm nổi bật để dễ dò hơn.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canManage && <button type="button" onClick={() => setManageMode(value => !value)} className={manageMode ? "primary-button !bg-violet-600 !shadow-none hover:!bg-violet-700" : "secondary-button"}><Settings2 size={17}/>{manageMode ? "Thoát quản lý" : "Quản lý dữ liệu"}</button>}
            <button type="button" onClick={downloadAllSheets} disabled={exporting || !sheets.length} className="secondary-button"><Download size={17}/>{exporting ? "Đang tạo..." : "Tải Excel"}</button>
            <button type="button" onClick={copySelection} disabled={!selection} className="primary-button !bg-brand-500 !shadow-orange-200 hover:!bg-brand-600 dark:!shadow-none disabled:opacity-40"><ClipboardCopy size={17}/>Copy {selectedCount ? `${selectedCount} ô` : "vùng chọn"}</button>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50/70 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/35 sm:px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {sheets.map((sheet, index) => {
            const active = activeSheet?.id === sheet.id;
            return <button key={sheet.id} type="button" onClick={() => setActiveId(sheet.id)} className={`group flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${active ? "border-slate-900 bg-slate-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-900" : "border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-900/70 dark:hover:text-orange-300"}`}>
              <span className={`grid h-6 w-6 place-items-center rounded-lg text-[10px] font-bold ${active ? "bg-brand-500 text-white dark:bg-brand-500" : "bg-slate-100 text-slate-400 group-hover:bg-orange-50 group-hover:text-brand-500 dark:bg-slate-800"}`}>{index + 1}</span>
              <span className="max-w-52 truncate text-xs font-bold">{sheet.name}</span>
            </button>;
          })}
          {manageMode && canManage && <button type="button" title="Thêm sheet" onClick={() => setDialog({ type: "add", title: "Thêm sheet mới", description: "Tạo một sheet trống để nhập dữ liệu mới." })} className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50 px-3 text-xs font-bold text-violet-600 transition hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300"><Plus size={16}/>Thêm sheet</button>}
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-brand-600 dark:bg-orange-950/40 dark:text-orange-300"><Sheet size={18}/></span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-slate-800 dark:text-white">{activeSheet?.name || "Chưa có sheet"}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                {activeSheet && <><span>{activeSheet.rows.length} hàng</span><span>•</span><span>{activeSheet.columnCount} cột</span></>}
                {selection && <><span>•</span><span className="font-bold text-brand-500">Đã chọn {selectedCount} ô</span></>}
              </div>
            </div>
          </div>

          <div className="flex w-full max-w-2xl items-center gap-2 lg:w-auto lg:flex-1">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
              <input className="field-input !h-10 !pl-9 !text-xs" placeholder="Tìm tuyến, chi nhánh, điều độ..." value={searchQuery} onChange={event => { setSearchQuery(event.target.value); setMatchIndex(0); }}/>
            </div>
            {searchQuery && <span className="hidden min-w-20 text-center text-[11px] font-semibold text-slate-400 sm:block">{matches.length ? `${matchIndex + 1}/${matches.length}` : "0 kết quả"}</span>}
            <button type="button" disabled={!matches.length} onClick={() => goToMatch(-1)} className="secondary-button !h-10 !w-10 !px-0"><ChevronLeft size={16}/></button>
            <button type="button" disabled={!matches.length} onClick={() => goToMatch(1)} className="secondary-button !h-10 !w-10 !px-0"><ChevronRight size={16}/></button>
          </div>
        </div>

        {manageMode && canManage && activeSheet && <div className="mb-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-900/60 dark:bg-violet-950/20">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <label className="min-w-0"><span className="field-label"><Pencil size={15}/>Ô {selectedCell ? `${routeColumnName(selectedCell.col)}${selectedCell.row + 1}` : "chưa chọn"}</span><textarea className="field-input min-h-16 resize-y py-2 text-sm" disabled={!selectedCell} value={cellDraft} onChange={event => setCellDraft(event.target.value)} placeholder="Chọn một ô trong bảng để sửa"/></label>
            <button type="button" disabled={busy || !selectedCell} className="primary-button !bg-violet-600 !shadow-none hover:!bg-violet-700" onClick={saveCell}>{busy ? <LoaderCircle className="animate-spin" size={17}/> : <Save size={17}/>}Lưu ô</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="secondary-button !h-9" disabled={busy} onClick={() => mutateStructure("add-row")}><Rows3 size={15}/>Thêm hàng</button>
            <button type="button" className="secondary-button !h-9" disabled={busy} onClick={() => mutateStructure("add-col")}><Columns3 size={15}/>Thêm cột</button>
            <button type="button" className="secondary-button !h-9" onClick={() => setDialog({ type: "rename", title: "Đổi tên sheet", description: "Tên mới sẽ hiển thị trên tab sheet.", initialName: activeSheet.name })}><Pencil size={15}/>Đổi tên sheet</button>
            <span className="hidden h-9 w-px bg-violet-200 dark:bg-violet-900 sm:block"/>
            <button type="button" className="secondary-button !h-9 !text-rose-600 dark:!text-rose-300" disabled={busy || !selectedCell} onClick={() => mutateStructure("delete-row")}><Trash2 size={15}/>Xóa hàng</button>
            <button type="button" className="secondary-button !h-9 !text-rose-600 dark:!text-rose-300" disabled={busy || !selectedCell} onClick={() => mutateStructure("delete-col")}><Trash2 size={15}/>Xóa cột</button>
            <button type="button" className="secondary-button !h-9 !text-rose-600 dark:!text-rose-300" disabled={sheets.length <= 1} onClick={() => setDialog({ type: "delete", title: "Xóa sheet", description: "Thao tác này không thể hoàn tác.", initialName: activeSheet.name })}><Trash2 size={15}/>Xóa sheet</button>
          </div>
        </div>}

        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
          <span><b className="text-slate-600 dark:text-slate-300">Mẹo:</b> kéo chọn dọc một cột rồi Ctrl/Cmd+C để dán thẳng sang Excel.</span>
          {activeSheet?.source === "excel-seed" && <span className="rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">Nguồn Excel</span>}
        </div>

        <div ref={gridRef} className="max-h-[72vh] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-inner dark:border-slate-700 dark:bg-slate-900">
          {activeSheet ? <table className="w-max min-w-full border-separate border-spacing-0 text-xs">
            {manageMode && <thead className="sticky top-0 z-30">
              <tr>
                <th className="sticky left-0 z-40 h-7 min-w-9 border-b border-r border-slate-300 bg-slate-200 text-center text-[9px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">#</th>
                {Array.from({ length: activeSheet.columnCount }, (_, col) => {
                  const metric = columnMetrics[col] || { widthPx: 120 };
                  return <th key={col} style={{ width: metric.widthPx, minWidth: metric.widthPx, maxWidth: metric.widthPx }} className="h-7 border-b border-r border-slate-300 bg-slate-200 px-1.5 text-center text-[9px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">{routeColumnName(col)}</th>;
                })}
              </tr>
            </thead>}
            <tbody>
              {activeSheet.rows.map((row, rowIndex) => {
                const kind = routeRowKind(activeSheet, rowIndex);
                const blank = kind === "blank";
                const rowNumberClass = kind === "header"
                  ? "bg-slate-800 text-white dark:bg-slate-800"
                  : kind === "section"
                    ? "bg-orange-100 text-brand-700 dark:bg-orange-950/60 dark:text-orange-300"
                    : blank
                      ? "bg-slate-50 text-slate-300 dark:bg-slate-950 dark:text-slate-700"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800";
                return <tr key={rowIndex} className={blank ? "h-3" : ""}>
                  <th className={`sticky left-0 z-10 min-w-9 border-b border-r border-slate-200 px-1.5 text-center text-[9px] font-semibold dark:border-slate-800 ${blank ? "h-3 py-0" : "h-9 py-1"} ${rowNumberClass}`}>{rowIndex + 1}</th>
                  {Array.from({ length: activeSheet.columnCount }, (_, colIndex) => {
                    const value = row.cells[colIndex] ?? "";
                    const selected = isRouteCellSelected(selection, rowIndex, colIndex);
                    const matched = matchKeys.has(`${rowIndex}:${colIndex}`);
                    const metric = columnMetrics[colIndex] || { widthPx: 120 };
                    const baseClass = kind === "header"
                      ? "bg-slate-800 font-bold text-white dark:bg-slate-800 dark:text-white"
                      : kind === "section"
                        ? "bg-orange-50 font-bold text-brand-700 dark:bg-orange-950/35 dark:text-orange-300"
                        : blank
                          ? "bg-slate-50/70 text-slate-300 dark:bg-slate-950/50 dark:text-slate-700"
                          : rowIndex % 2 === 0
                            ? "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-300"
                            : "bg-slate-50/65 text-slate-700 dark:bg-slate-900/80 dark:text-slate-300";
                    return <td
                      id={`route-cell-${rowIndex}-${colIndex}`}
                      key={colIndex}
                      style={{ width: metric.widthPx, minWidth: metric.widthPx, maxWidth: metric.widthPx }}
                      onPointerDown={event => selectCell(event, rowIndex, colIndex)}
                      onPointerEnter={() => extendSelection(rowIndex, colIndex)}
                      className={`relative select-none whitespace-pre-wrap border-b border-r border-slate-200 align-middle transition dark:border-slate-800 ${blank ? "h-3 px-1 py-0" : "px-2.5 py-2 leading-[1.25rem]"} ${selected ? "!bg-cyan-100 !text-cyan-950 ring-2 ring-inset ring-cyan-500 dark:!bg-cyan-950/80 dark:!text-cyan-50" : matched ? "!bg-amber-100 !text-slate-900 dark:!bg-amber-950/60 dark:!text-white" : baseClass}`}
                    >
                      {isUrl(value) ? <a href={String(value)} target="_blank" rel="noreferrer" onPointerDown={event => event.stopPropagation()} className={`inline-flex items-center gap-1 break-all font-semibold underline underline-offset-2 ${kind === "header" ? "text-cyan-200 decoration-cyan-300/50" : kind === "section" ? "text-brand-700 decoration-orange-300 dark:text-orange-300" : "text-blue-600 decoration-blue-300 dark:text-blue-300"}`}><span>{String(value)}</span><ExternalLink size={11} className="shrink-0"/></a> : String(value)}
                    </td>;
                  })}
                </tr>;
              })}
            </tbody>
          </table> : <div className="grid min-h-[480px] place-items-center text-sm text-slate-400"><div className="text-center"><FileSpreadsheet className="mx-auto mb-3" size={34}/><p>Chưa có sheet dữ liệu.</p></div></div>}
        </div>
      </div>
    </div>

    <SheetDialog dialog={dialog} onClose={() => !busy && setDialog(null)} onSubmit={submitDialog} busy={busy}/>
  </section>;
}
