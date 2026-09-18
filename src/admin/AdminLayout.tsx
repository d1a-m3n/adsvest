import { Outlet } from "react-router-dom";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";

export default function AdminLayout() {
  return (
    <div className="admin-layout flex h-screen overflow-hidden bg-[#0f1015] text-gray-100">
      <AdminSidebar />

      <main className="admin-scroll min-w-0 flex-1 overflow-y-auto">
        <div className="p-6">
          <AdminHeader />
          <Outlet />
        </div>
      </main>
    </div>
  );
}