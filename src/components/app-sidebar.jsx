"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { BiSolidLeaf } from "react-icons/bi";
import { FiUsers } from "react-icons/fi";
import { FaHandHoldingDollar } from "react-icons/fa6";
import { RiUserAddLine } from "react-icons/ri";
import { NavUser } from "@/components/nav-user";
import { TbLayoutDashboard } from "react-icons/tb";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar, // ← Add this
} from "@/components/ui/sidebar";
import { FaCoins } from "react-icons/fa";
import { LuWallet } from "react-icons/lu";
import { GoCreditCard } from "react-icons/go";
import { Banknote, Repeat2 } from "lucide-react";
import NavLinks from "./nav-links";

export function AppSidebar({ ...props }) {
  const { data: session } = useSession();
  const role = session?.user?.role || "";
  
  // Use the sidebar context
  const { setOpen, open, isMobile } = useSidebar();

  const user = {
    name: session?.user?.name || "Loading...",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "/avatars/profile-user.png",
  };

  // Define all links (same as before)
  const navlinks = [
    {
      title: null,
      links: [
        {
          name: "Dashboard",
          url: "/dashboard",
          icon: TbLayoutDashboard,
        },
      ],
    },
    {
      title: "CUSTOMER & LOAN",
      links: [
        {
          name: "Customer",
          url: "/dashboard/customer",
          icon: FiUsers,
          roles: ["ADMIN"],
        },
        {
          name: "Add Loan",
          url: "/dashboard/newloanform",
          icon: Banknote,
          roles: ["ADMIN"],
        },
      ],
    },
    {
      title: "REPAYMENT & DUE",
      links: [
        {
          name: "Add Repayment",
          url: "/dashboard/repayment",
          icon: Repeat2,
          roles: ["ADMIN", "AGENT"],
        },
        {
          name: "Report",
          url: "/dashboard/Report",
          icon: LuWallet,
          roles: ["ADMIN"],
        },
        {
          name: "Expense",
          url: "/dashboard/Expense",
          icon: GoCreditCard,
          roles: ["ADMIN"],
        },
      ],
    },
    {
      title: "ADD USERS / AGENTS",
      links: [
        {
          name: "Add Customer",
          url: "/dashboard/addNewCustomer",
          icon: RiUserAddLine,
          roles: ["ADMIN"],
        },
        {
          name: "Add Users",
          url: "/dashboard/addUser",
          icon: RiUserAddLine,
          roles: ["ADMIN"],
        },
      ],
    },
  ];

  const filteredNavLinks = navlinks.map((section) => ({
    ...section,
    links: section.links.filter(
      (link) => !link.roles || link.roles.includes(role)
    ),
  }));

  // Close sidebar on link click (mobile only)
  const handleLinkClick = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="KALIYAMMAN FINANCE."
              className="data-[slot=sidebar-menu-button]:!p-2"
            >
              <a href="/dashboard" onClick={handleLinkClick}>
                <BiSolidLeaf className="!size-5 text-green-700" />
                <span className="text-base font-semibold ml-2">
                  KALIYAMMAN FINANCE.
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavLinks items={filteredNavLinks} onLinkClick={handleLinkClick} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}