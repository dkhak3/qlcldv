import { useParams } from "react-router-dom";
import { usePageSettings } from "../PageSettingsContext";
import ManagedPageGate from "../components/ManagedPageGate";
import { ProtectedRoute } from "../components/ProtectedRoute";
import BlogAdminPage from "./BlogAdminPage";
import BlogPage from "./BlogPage";
import CategoryAdminPage from "./CategoryAdminPage";
import DonatePage from "./DonatePage";
import DonationAdminPage from "./DonationAdminPage";
import NotFoundPage from "./NotFoundPage";
import PageSettingsAdminPage from "./PageSettingsAdminPage";
import ReportBoxAdminPage from "./ReportBoxAdminPage";
import SavedReportsPage from "./SavedReportsPage";
import UserAdminPage from "./UserAdminPage";

const COMPONENTS = {
  blog: BlogPage,
  donate: DonatePage,
  "saved-reports": SavedReportsPage,
  "blog-admin": BlogAdminPage,
  "category-admin": CategoryAdminPage,
  "box-admin": ReportBoxAdminPage,
  "user-admin": UserAdminPage,
  "donate-admin": DonationAdminPage,
  "page-admin": PageSettingsAdminPage,
};

export default function ManagedPageResolver() {
  const { managedSlug } = useParams();
  const { pages } = usePageSettings();
  const page = pages.find(item => item.slug === managedSlug);
  const Component = page && COMPONENTS[page.key];
  if (!Component || page.hidden) return <NotFoundPage/>;
  return <ProtectedRoute roles={page.roles}><ManagedPageGate pageKey={page.key}><Component/></ManagedPageGate></ProtectedRoute>;
}
