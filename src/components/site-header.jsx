"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function SiteHeader({ user }) {
  const pathname = usePathname();
  const pathSegments = pathname?.split("/").filter(Boolean) || [];

  // Current page (last segment in URL)
  const currentPage = pathSegments[pathSegments.length - 1] || "";
  const formattedPage =
    currentPage && currentPage.toLowerCase() !== "dashboard"
      ? currentPage.charAt(0).toUpperCase() + currentPage.slice(1)
      : "";

  const isDashboard = pathname === "/dashboard";

  return (
    <header className="h-16 border-1 bg-white shrink-0 px-4 transition-all ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center justify-between h-full gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div className="hidden md:block">
            <Breadcrumb>
              <BreadcrumbList>
                {/* Always show Dashboard link */}
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>

                {/* Show only if not on /dashboard and page is not "dashboard" */}
                {formattedPage && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{formattedPage}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Title fallback on small screens */}
          <div className="block md:hidden font-semibold text-base truncate">
            {formattedPage || "Dashboard"}
          </div>
        </div>

        {/* RIGHT: Welcome + Avatar */}
        <div className="flex items-center gap-2 max-w-[50%] overflow-hidden">
          <span className="text-sm text-muted-foreground whitespace-nowrap text-ellipsis overflow-hidden">
            Welcome, {user?.isLoggedIn ? user.name : "Guest"}
          </span>
          <Image
            src={user?.image || "/profile-user.png"}
            alt="Profile"
            width={36}
            height={36}
            className="rounded-full border object-cover shrink-0"
          />
        </div>
      </div>
    </header>
  );
}
