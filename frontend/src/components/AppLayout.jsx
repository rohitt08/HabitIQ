import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import MobileNav from "./MobileNav.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";
import AIChat from "./AIChat.jsx";

export default function AppLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Sidebar />
      <MobileNav />
      <main className="md:ml-64 px-4 sm:px-6 md:px-8 py-6 md:py-8 pb-24 md:pb-10 min-h-screen transition-all duration-300">
        <div className="max-w-[1400px] mx-auto w-full">
          <Suspense fallback={<div className="h-full w-full flex items-center justify-center py-20"><LoadingSpinner /></div>}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <AIChat />
    </div>
  );
}
