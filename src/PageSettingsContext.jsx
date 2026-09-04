import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { DEFAULT_SITE_PAGES } from "./data/sitePages";
import { getSitePages } from "./services/sitePageService";

const PageSettingsContext = createContext(null);

export function PageSettingsProvider({ children }) {
  const auth = useAuth();
  const [pages, setPages] = useState(DEFAULT_SITE_PAGES);
  useEffect(() => {
    if (!auth.user) { setPages(DEFAULT_SITE_PAGES); return undefined; }
    let active = true;
    getSitePages().then(data => { if (active) setPages(data); }).catch(() => { if (active) setPages(DEFAULT_SITE_PAGES); });
    return () => { active = false; };
  }, [auth.user?.uid]);
  const value = useMemo(() => ({
    pages,
    getPage: key => pages.find(item => item.key === key) || DEFAULT_SITE_PAGES.find(item => item.key === key),
    pathFor: key => `/${pages.find(item => item.key === key)?.slug || DEFAULT_SITE_PAGES.find(item => item.key === key)?.slug || ""}`,
    refresh: async () => setPages(await getSitePages()),
  }), [pages]);
  return <PageSettingsContext.Provider value={value}>{children}</PageSettingsContext.Provider>;
}

export function usePageSettings() {
  const context = useContext(PageSettingsContext);
  if (!context) throw new Error("usePageSettings phải nằm trong PageSettingsProvider");
  return context;
}
