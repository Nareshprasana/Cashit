"use client"; // ✅ make this a Client Component

import React from "react";
import UpdateProfile from "./UpdateProfile";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import SiteHeader from "@/components/site-header";

export default function UpdateProfilePage() {
  const user = {
    name: "Admin",
    image: "/profile-user.png",
    isLoggedIn: true,
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content */}
        <SidebarInset>
          <SiteHeader user={user} />

          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Update Profile</h1>
            <UpdateProfile />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
