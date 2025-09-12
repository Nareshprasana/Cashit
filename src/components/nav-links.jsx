"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NavLinks = ({ items, userRole }) => {
  const pathname = usePathname();

  const filteredItems = items.map((section) => ({
    ...section,
    links: section.links.filter((link) => {
      if (userRole !== "admin" && link.name === "Add Users") return true;
      if (userRole === "agent" && link.name === "Report") return false;
      return true;
    }),
  }));

  return (
    <>
      {filteredItems.map((section, index) => (
        <SidebarGroup key={index}>
          {section.title && (
            <SidebarGroupLabel className="text-[14px] font-semibold text-gray-900 px-3 pt-3 pb-4">
              {section.title}
            </SidebarGroupLabel>
          )}
          <SidebarMenu>
            {section.links.map((link) => {
              const isActive = pathname === link.url;
              return (
                <SidebarMenuItem key={link.name}>
                  <SidebarMenuButton asChild tooltip={link.name}>
                    <Link
                      href={link.url}
                      className={`flex items-center gap-2 px-2 py-2 rounded transition-none
                        ${isActive ? "!bg-black !text-white" : "!text-gray-800"}
                      `}
                    >
                      {link.icon && (
                        <link.icon
                          className={`h-4 w-4 ${
                            isActive ? "!text-white" : "!text-gray-800"
                          }`}
                        />
                      )}
                      <span className="text-sm">{link.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
};

export default NavLinks;
