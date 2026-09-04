import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../AuthContext";
import { createSavedReport } from "../services/savedReportService";
import ConfirmDialog from "./ConfirmDialog";

export default function SaveReportButton({ type, title, form, disabled, className = "" }) {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await createSavedReport({ type, startDate: form.startDate, endDate: form.endDate, employees: form.employees, results: form.results }, auth);
      setOpen(false);
      toast.success("Đã lưu báo cáo vào tài khoản của bạn");
    } catch (error) {
      toast.error(error.message || "Không thể lưu báo cáo");
    } finally { setBusy(false); }
  };
  return <><button type="button" className={`secondary-button !border-amber-100 !bg-amber-50 !text-amber-700 hover:!bg-amber-100 dark:!border-amber-900 dark:!bg-amber-950/50 dark:!text-amber-300 dark:hover:!bg-amber-900/60 ${className}`} disabled={disabled || busy} onClick={() => setOpen(true)}><Save size={18}/>Lưu báo cáo</button>{open && <ConfirmDialog title={`Lưu ${title}?`} description={`Báo cáo từ ${form.startDate} đến ${form.endDate} sẽ được lưu trên Firebase và hiển thị trong “Báo cáo đã lưu”.`} confirmLabel="Lưu báo cáo" busy={busy} onClose={() => setOpen(false)} onConfirm={save}/>}</>;
}
