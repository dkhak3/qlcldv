import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import CameraPage from "./pages/CameraPage";
import CameraVehicleDetailPage from "./pages/CameraVehicleDetailPage";
import GpsPage from "./pages/GpsPage";
import GpsVehicleDetailPage from "./pages/GpsVehicleDetailPage";
import TxdlPage from "./pages/TxdlPage";
import Speed4hPage from "./pages/Speed4hPage";
import GsttPage from "./pages/GsttPage";
import BlogPage from "./pages/BlogPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import BlogAdminPage from "./pages/BlogAdminPage";
import LoginPage from "./pages/LoginPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import UserAdminPage from "./pages/UserAdminPage";
import ReportBoxAdminPage from "./pages/ReportBoxAdminPage";
import DynamicReportPage from "./pages/DynamicReportPage";
import BootstrapPage from "./pages/BootstrapPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import NotFoundPage from "./pages/NotFoundPage";
import CategoryAdminPage from "./pages/CategoryAdminPage";
import DonatePage from "./pages/DonatePage";
import DonationAdminPage from "./pages/DonationAdminPage";
import SavedReportsPage from "./pages/SavedReportsPage";
import PageSettingsAdminPage from "./pages/PageSettingsAdminPage";
import ManagedPageResolver from "./pages/ManagedPageResolver";
import ManagedPageGate from "./components/ManagedPageGate";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/khoi-tao-superadmin" element={<BootstrapPage />} />
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/bao-cao-camera" element={<ProtectedRoute><CameraPage /></ProtectedRoute>} />
        <Route path="/bao-cao-camera/chi-tiet" element={<ProtectedRoute><CameraVehicleDetailPage /></ProtectedRoute>} />
        <Route path="/bao-cao-gps" element={<ProtectedRoute><GpsPage /></ProtectedRoute>} />
        <Route path="/bao-cao-gps/chi-tiet" element={<ProtectedRoute><GpsVehicleDetailPage /></ProtectedRoute>} />
        <Route path="/bao-cao-txdl" element={<ProtectedRoute><TxdlPage /></ProtectedRoute>} />
        <Route path="/bao-cao-toc-do-4h" element={<ProtectedRoute><Speed4hPage /></ProtectedRoute>} />
        <Route path="/bao-cao-ho-tro-gstt" element={<ProtectedRoute><GsttPage /></ProtectedRoute>} />
        <Route path="/blog" element={<ProtectedRoute><ManagedPageGate pageKey="blog"><BlogPage /></ManagedPageGate></ProtectedRoute>} />
        <Route path="/blog/:slug" element={<ProtectedRoute><BlogDetailPage /></ProtectedRoute>} />
        <Route path="/donate" element={<ProtectedRoute><ManagedPageGate pageKey="donate"><DonatePage /></ManagedPageGate></ProtectedRoute>} />
        <Route path="/bao-cao-da-luu" element={<ProtectedRoute><ManagedPageGate pageKey="saved-reports"><SavedReportsPage /></ManagedPageGate></ProtectedRoute>} />
        <Route path="/cap-nhat-mat-khau" element={<ProtectedRoute><UpdatePasswordPage /></ProtectedRoute>} />
        <Route path="/admin/blog" element={<ProtectedRoute roles={["admin", "superadmin"]}><ManagedPageGate pageKey="blog-admin"><BlogAdminPage /></ManagedPageGate></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute roles={["admin", "superadmin"]}><ManagedPageGate pageKey="category-admin"><CategoryAdminPage /></ManagedPageGate></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={["admin", "superadmin"]}><ManagedPageGate pageKey="user-admin"><UserAdminPage /></ManagedPageGate></ProtectedRoute>} />
        <Route path="/admin/report-boxes" element={<ProtectedRoute roles={["admin", "superadmin"]}><ManagedPageGate pageKey="box-admin"><ReportBoxAdminPage /></ManagedPageGate></ProtectedRoute>} />
        <Route path="/admin/donate" element={<ProtectedRoute roles={["superadmin"]}><ManagedPageGate pageKey="donate-admin"><DonationAdminPage /></ManagedPageGate></ProtectedRoute>} />
        <Route path="/admin/pages" element={<ProtectedRoute roles={["superadmin"]}><ManagedPageGate pageKey="page-admin"><PageSettingsAdminPage /></ManagedPageGate></ProtectedRoute>} />
        <Route path="/bao-cao/:slug" element={<ProtectedRoute><DynamicReportPage /></ProtectedRoute>} />
        <Route path="/:managedSlug" element={<ManagedPageResolver />} />
        <Route path="*" element={<ProtectedRoute><NotFoundPage /></ProtectedRoute>} />
      </Routes>
    </Layout>
  );
}
