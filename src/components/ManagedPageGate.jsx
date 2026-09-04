import NotFoundPage from "../pages/NotFoundPage";
import { usePageSettings } from "../PageSettingsContext";

export default function ManagedPageGate({ pageKey, children }) {
  const { getPage } = usePageSettings();
  return getPage(pageKey)?.hidden ? <NotFoundPage/> : children;
}
