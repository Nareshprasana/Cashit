"use client";

import React from "react";
import { useParams } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import SiteHeader from "@/components/site-header";
import RepaymentForm from "../RepaymentForm"; // adjust path if needed

const user = {
  name: "Admin",
  image: "/profile-user.png",
  isLoggedIn: true,
};

const RepaymentFormForCustomer = () => {
  const { customerId } = useParams(); // gets ID from URL

  if (!customerId) return <div className="p-4">Customer not found.</div>;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <SiteHeader user={user} />
          <div className="p-6">
            {/* Pass customerId to RepaymentForm */}
            <RepaymentForm customerId={customerId} />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default RepaymentFormForCustomer;
