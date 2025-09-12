"use client";
import React from "react";
import { useParams } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import dynamic from "next/dynamic";

// ✅ Load components client-side only (avoid hydration mismatch)
const RepaymentForm = dynamic(() => import("./RepaymentForm"), {
  ssr: false,
});
const AllCustomerTable = dynamic(() => import("@/components/AllCustomerTable"), {
  ssr: false,
});

// (Optional) If you still need AppSidebar / SiteHeader later, import dynamically too
// const AppSidebar = dynamic(() => import("@/components/app-sidebar"), { ssr: false });
// const SiteHeader = dynamic(() => import("@/components/site-header"), { ssr: false });

const user = { name: "Admin", image: "/profile-user.png", isLoggedIn: true };

const RepaymentFormPage = () => {
  const { customerId } = useParams(); // get ID from URL

  return (
    <SidebarProvider>
      <div className="p-6">
        <div>
          {/* Pass customerId to the form */}
          <RepaymentForm customerId={customerId} />
        </div>
        <div>
          <AllCustomerTable />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default RepaymentFormPage;
