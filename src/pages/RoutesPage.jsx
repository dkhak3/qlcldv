import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Columns3,
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
  const canManage = auth.role === "admin" || auth.role === "superadmin";
  const [sheets, setSheets] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
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

  if (loading) return <section className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-4"><div className="text-center text-slate-500"><LoaderCircle className="mx-auto animate-spin text-cyan-600" size={36}/><p className="mt-3 text-sm">Đang tải dữ liệu Tuyến...</p></div></section>;

  return <section className="mx-auto max-w-[1600px] px-3 py-6 sm:px-5 sm:py-9 lg:px-8">
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-blue-50 px-5 py-5 dark:border-slate-800 dark:from-cyan-950/30 dark:via-slate-900 dark:to-blue-950/30 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-cyan-700 dark:text-cyan-300"><Waypoints size={16}/>Dữ liệu tuyến</span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink dark:text-white">Tuyến</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">Dữ liệu được chuyển từ file Excel sang bảng trực tuyến. Kéo chọn ô như Excel, sau đó Copy để dán theo hàng dọc hoặc theo vùng.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canManage && <button type="button" onClick={() => setManageMode(value => !value)} className={manageMode ? "primary-button !bg-violet-600 hover:!bg-violet-700" : "secondary-button"}><Settings2 size={17}/>{manageMode ? "Đang quản lý" : "Quản lý dữ liệu"}</button>}
            <button type="button" onClick={copySelection} disabled={!selection} className="primary-button !bg-cyan-600 hover:!bg-cyan-700 disabled:opacity-40"><ClipboardCopy size={17}/>Copy vùng chọn {selectedCount ? `(${selectedCount})` : ""}</button>
          </div>
        </div>
      </div>

      <div className="grid min-h-[680px] lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/40 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-2 px-2 py-2">
            <div><b className="text-sm text-slate-700 dark:text-slate-200">Sheets</b><span className="ml-2 text-xs text-slate-400">{sheets.length}</span></div>
            {manageMode && canManage && <button type="button" title="Thêm sheet" onClick={() => setDialog({ type: "add", title: "Thêm sheet mới", description: "Tạo một sheet trống để nhập dữ liệu mới." })} className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-600 text-white transition hover:bg-cyan-700"><Plus size={17}/></button>}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:max-h-[590px] lg:space-y-1.5 lg:overflow-y-auto lg:overflow-x-hidden">
            {sheets.map(sheet => <button key={sheet.id} type="button" onClick={() => setActiveId(sheet.id)} className={`min-w-56 rounded-2xl border px-3 py-3 text-left transition lg:min-w-0 lg:w-full ${activeSheet?.id === sheet.id ? "border-cyan-200 bg-white shadow-sm ring-1 ring-cyan-100 dark:border-cyan-800 dark:bg-slate-900 dark:ring-cyan-900/50" : "border-transparent hover:border-slate-200 hover:bg-white dark:hover:border-slate-800 dark:hover:bg-slate-900"}`}>
              <span className="flex items-start gap-2.5"><Sheet className={activeSheet?.id === sheet.id ? "mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-300" : "mt-0.5 shrink-0 text-slate-400"} size={17}/><span className="min-w-0"><b className="block truncate text-xs text-slate-700 dark:text-slate-200">{sheet.name}</b><small className="mt-1 block text-[10px] text-slate-400">{sheet.rows.length} hàng · {sheet.columnCount} cột</small></span></span>
            </button>)}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="border-b border-slate-200 p-3 dark:border-slate-800 sm:p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17}/>
                <input className="field-input !pl-10" placeholder="Tìm số tuyến, tên tuyến, chi nhánh, điều độ..." value={searchQuery} onChange={event => { setSearchQuery(event.target.value); setMatchIndex(0); }}/>
              </div>
              <div className="flex items-center gap-2">
                <span className="min-w-28 text-center text-xs font-semibold text-slate-400">{searchQuery ? `${matches.length ? matchIndex + 1 : 0}/${matches.length} kết quả` : "Chưa tìm kiếm"}</span>
                <button type="button" disabled={!matches.length} onClick={() => goToMatch(-1)} className="secondary-button !h-10 !w-10 !px-0"><ChevronLeft size={17}/></button>
                <button type="button" disabled={!matches.length} onClick={() => goToMatch(1)} className="secondary-button !h-10 !w-10 !px-0"><ChevronRight size={17}/></button>
              </div>
            </div>

            {manageMode && canManage && activeSheet && <div className="mt-3 rounded-2xl border border-violet-100 bg-violet-50/70 p-3 dark:border-violet-900/50 dark:bg-violet-950/20">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
                <label className="min-w-0 flex-1"><span className="field-label"><Pencil size={15}/>Ô đang chọn {selectedCell ? `${routeColumnName(selectedCell.col)}${selectedCell.row + 1}` : "—"}</span><textarea className="field-input min-h-20 resize-y py-2.5" disabled={!selectedCell} value={cellDraft} onChange={event => setCellDraft(event.target.value)} placeholder="Chọn một ô để sửa dữ liệu"/></label>
                <button type="button" disabled={busy || !selectedCell} className="primary-button xl:mb-0.5" onClick={saveCell}>{busy ? <LoaderCircle className="animate-spin" size={17}/> : <Save size={17}/>}Lưu ô</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="secondary-button !h-9" disabled={busy} onClick={() => mutateStructure("add-row")}><Rows3 size={16}/>Thêm hàng</button>
                <button type="button" className="secondary-button !h-9 !text-rose-600 dark:!text-rose-300" disabled={busy || !selectedCell} onClick={() => mutateStructure("delete-row")}><Trash2 size={16}/>Xóa hàng</button>
                <button type="button" className="secondary-button !h-9" disabled={busy} onClick={() => mutateStructure("add-col")}><Columns3 size={16}/>Thêm cột</button>
                <button type="button" className="secondary-button !h-9 !text-rose-600 dark:!text-rose-300" disabled={busy || !selectedCell} onClick={() => mutateStructure("delete-col")}><Trash2 size={16}/>Xóa cột</button>
                <span className="mx-1 hidden h-9 w-px bg-violet-200 dark:bg-violet-900 sm:block"/>
                <button type="button" className="secondary-button !h-9" onClick={() => setDialog({ type: "rename", title: "Đổi tên sheet", description: "Tên mới sẽ hiển thị trong danh sách sheet.", initialName: activeSheet.name })}><Pencil size={16}/>Đổi tên sheet</button>
                <button type="button" className="secondary-button !h-9 !text-rose-600 dark:!text-rose-300" disabled={sheets.length <= 1} onClick={() => setDialog({ type: "delete", title: "Xóa sheet", description: "Thao tác này không thể hoàn tác.", initialName: activeSheet.name })}><Trash2 size={16}/>Xóa sheet</button>
              </div>
            </div>}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-400">
              <span><b className="text-slate-600 dark:text-slate-300">Cách copy:</b> kéo chuột chọn các ô theo chiều dọc → bấm Copy hoặc Ctrl/Cmd+C.</span>
              {selection && <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-bold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">Đã chọn {selectedCount} ô</span>}
              {activeSheet?.source === "excel-seed" && <span className="rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">Dữ liệu gốc từ Excel</span>}
            </div>
          </div>

          <div ref={gridRef} className="max-h-[690px] overflow-auto bg-white dark:bg-slate-900">
            {activeSheet ? <table className="border-separate border-spacing-0 text-xs">
              <thead className="sticky top-0 z-20">
                <tr>
                  <th className="sticky left-0 z-30 h-9 min-w-12 border-b border-r border-slate-200 bg-slate-100 text-center font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-800">#</th>
                  {Array.from({ length: activeSheet.columnCount }, (_, col) => <th key={col} className="h-9 min-w-44 border-b border-r border-slate-200 bg-slate-100 px-3 text-center font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{routeColumnName(col)}</th>)}
                </tr>
              </thead>
              <tbody>
                {activeSheet.rows.map((row, rowIndex) => <tr key={rowIndex}>
                  <th className="sticky left-0 z-10 h-11 min-w-12 border-b border-r border-slate-200 bg-slate-100 px-2 text-center font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800">{rowIndex + 1}</th>
                  {Array.from({ length: activeSheet.columnCount }, (_, colIndex) => {
                    const value = row.cells[colIndex] ?? "";
                    const selected = isRouteCellSelected(selection, rowIndex, colIndex);
                    const matched = matchKeys.has(`${rowIndex}:${colIndex}`);
                    return <td
                      id={`route-cell-${rowIndex}-${colIndex}`}
                      key={colIndex}
                      onPointerDown={event => selectCell(event, rowIndex, colIndex)}
                      onPointerEnter={() => extendSelection(rowIndex, colIndex)}
                      className={`relative h-11 min-w-44 max-w-80 select-none whitespace-pre-wrap border-b border-r px-3 py-2 align-middle leading-5 transition dark:border-slate-800 ${selected ? "bg-cyan-100 text-cyan-950 ring-1 ring-inset ring-cyan-400 dark:bg-cyan-950/60 dark:text-cyan-100 dark:ring-cyan-600" : matched ? "bg-amber-100/80 text-slate-700 dark:bg-amber-950/40 dark:text-slate-200" : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70"}`}
                    >
                      {isUrl(value) ? <a href={String(value)} target="_blank" rel="noreferrer" onPointerDown={event => event.stopPropagation()} className="inline-flex items-center gap-1 break-all font-semibold text-blue-600 underline decoration-blue-300 underline-offset-2 dark:text-blue-300"><span>{String(value)}</span><ExternalLink size={12} className="shrink-0"/></a> : String(value)}
                    </td>;
                  })}
                </tr>)}
              </tbody>
            </table> : <div className="grid min-h-[500px] place-items-center text-sm text-slate-400"><div className="text-center"><FileSpreadsheet className="mx-auto mb-3" size={34}/><p>Chưa có sheet dữ liệu.</p></div></div>}
          </div>
        </div>
      </div>
    </div>

    <SheetDialog dialog={dialog} onClose={() => !busy && setDialog(null)} onSubmit={submitDialog} busy={busy}/>
  </section>;
}
