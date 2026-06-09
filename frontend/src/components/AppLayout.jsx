import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import MobileNav from "./MobileNav.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";

export default function AppLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Sidebar />
      <MobileNav />
      <main className="md:ml-64 px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-10 max-w-6xl mx-auto">
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center py-20"><LoadingSpinner /></div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
