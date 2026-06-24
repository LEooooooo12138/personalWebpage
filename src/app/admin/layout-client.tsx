"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <div className="cursor-auto">{children}</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[256px_1fr] min-h-screen cursor-auto">
      <AdminSidebar />
      <main className="bg-gray-50/50 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
