import { useEffect, useRef, useState } from "react";
import { BookOpenText, ChevronDown, ClipboardCheck, Clapperboard, FileClock, HandCoins, Home, Link2, LogIn, LogOut, Moon, Settings2, Sun, Tags, UsersRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../AuthContext";
import { usePageSettings } from "../PageSettingsContext";
import { useTheme } from "../ThemeContext";

const roleLabels = { user: "User", admin: "Admin", superadmin: "SuperAdmin" };
const menuClass = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pages = usePageSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const dark = theme === "dark";
  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOutside = event => { if (!menuRef.current?.contains(event.target)) setMenuOpen(false); };
    const closeEscape = event => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("pointerdown", closeOutside); document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, [menuOpen]);
  const logout = async () => {
    try { await auth.signOut(); toast.success("Đã đăng xuất"); navigate("/login", { replace: true }); }
    catch (error) { toast.error(error.message || "Không thể đăng xuất"); }
  };
  const displayName = auth.profile?.fullName || auth.profile?.username || "Tài khoản";
  const pageVisible = key => !pages.getPage(key)?.hidden;
  const pageLink = (key, icon, fallback) => pageVisible(key) && <Link to={pages.pathFor(key)} className={menuClass}>{icon}{pages.getPage(key)?.title || fallback}</Link>;

  return <div className="flex min-h-screen flex-col bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex shrink-0 items-center gap-3 text-ink no-underline dark:text-white"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-amber-400 text-white shadow-lg shadow-orange-200 transition group-hover:scale-105 dark:shadow-orange-950/40"><ClipboardCheck size={24}/></span><span className="hidden min-[420px]:block"><b className="block text-lg font-bold tracking-tight">QLCL-DV</b><small className="hidden text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:block">Hệ thống báo cáo tuần</small></span></Link>
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {auth.user && location.pathname !== "/" && <Link to="/" title="Trang chính" className="inline-flex h-10 items-center gap-2 rounded-xl px-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white sm:px-3"><Home size={17}/><span className="hidden lg:inline">Trang chính</span></Link>}
          {auth.user && pageVisible("blog") && <Link to={pages.pathFor("blog")} title="Blog" className={`inline-flex h-10 items-center gap-2 rounded-xl px-2.5 text-sm font-semibold transition sm:px-3 ${location.pathname === pages.pathFor("blog") || location.pathname.startsWith("/blog/") ? "bg-orange-50 text-brand-600 dark:bg-orange-950/50 dark:text-orange-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}><BookOpenText size={17}/><span className="hidden md:inline">{pages.getPage("blog")?.title || "Blog"}</span></Link>}
          {auth.user && pageVisible("donate") && <Link to={pages.pathFor("donate")} title="Donate" className={`inline-flex h-10 items-center gap-2 rounded-xl px-2.5 text-sm font-semibold transition sm:px-3 ${location.pathname === pages.pathFor("donate") ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}><HandCoins size={17}/><span className="hidden md:inline">{pages.getPage("donate")?.title || "Donate"}</span></Link>}
          <button type="button" onClick={toggleTheme} aria-pressed={dark} aria-label={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:px-3">{dark ? <Sun size={18}/> : <Moon size={18}/>}<span className="hidden xl:inline">{dark ? "Sáng" : "Tối"}</span></button>
          {!auth.loading && (auth.user ? <div className="relative" ref={menuRef}><button type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white pl-1.5 pr-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-amber-400 text-xs font-bold text-white">{displayName.charAt(0).toUpperCase()}</span><span className="hidden max-w-28 truncate xl:block">{displayName}</span><ChevronDown className={`transition ${menuOpen ? "rotate-180" : ""}`} size={14}/></button>{menuOpen && <div className="absolute right-0 top-12 max-h-[calc(100vh-90px)] w-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900"><div className="border-b border-slate-100 px-3 py-3 dark:border-slate-800"><b className="block truncate text-sm text-slate-800 dark:text-white">{displayName}</b><span className="mt-1 block truncate text-xs text-slate-400">@{auth.profile?.username}</span><span className="mt-2 inline-flex rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold uppercase text-brand-700 dark:bg-orange-950/50 dark:text-orange-300">{roleLabels[auth.role]}</span></div>{pageLink("blog", <BookOpenText size={17}/>, "Blog")}{pageLink("donate", <HandCoins size={17}/>, "Donate")}{pageLink("saved-reports", <FileClock size={17}/>, "Báo cáo đã lưu")}{auth.canManageBlog && <><div className="my-1 border-t border-slate-100 dark:border-slate-800"/>{pageLink("blog-admin", <Settings2 size={17}/>, "Quản lý Blog")}{pageLink("category-admin", <Tags size={17}/>, "Quản lý chuyên mục")}</>}{auth.canManageReports && pageLink("box-admin", <Clapperboard size={17}/>, "Quản lý Box báo cáo")}{auth.canManageUsers && pageLink("user-admin", <UsersRound size={17}/>, "Quản lý User")}{auth.isSuperAdmin && <>{pageLink("donate-admin", <HandCoins size={17}/>, "Quản lý Donate")}{pageLink("page-admin", <Link2 size={17}/>, "Quản lý trang & slug")}</>}<Link to="/cap-nhat-mat-khau" className={menuClass}><Settings2 size={17}/>Đổi mật khẩu của tôi</Link><button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/50"><LogOut size={17}/>Đăng xuất</button></div>}</div> : <Link to="/login" className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white transition hover:bg-brand-600 dark:bg-white dark:text-slate-900"><LogIn size={17}/><span className="hidden lg:inline">Đăng nhập</span></Link>)}
        </nav>
      </div>
    </header>
    <main className="flex-1">{children}</main>
    <footer className="border-t border-slate-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-900"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:px-6 lg:px-8"><span>© {new Date().getFullYear()} Hệ thống báo cáo QLCL-DV</span><span>Phát triển bởi <b className="font-semibold text-slate-700 dark:text-slate-200">Nguyễn Hữu Duy Kha</b></span></div></footer>
  </div>;
}
