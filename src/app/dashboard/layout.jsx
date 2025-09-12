// src/app/dashboard/layout.jsx
"use client";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import SiteHeader from "@/components/site-header";
import { useSession } from "next-auth/react";
import Footer from "@/components/Footer";
export default function DashboardLayout({ children }) {
  const { data: session } = useSession();
  const user = {
    isLoggedIn: !!session?.user,
    name: session?.user?.name || "Loading...",
    image: session?.user?.image || "/profile-user.png",
  };
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col h-screen overflow-hidden">
          <SiteHeader user={user} className=" bg-white shadow" />
          <main className="flex-1 flex flex-col bg-gray-50 p-4 overflow-auto">
            <div className="flex-1">{children}</div>
            <Footer />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
