"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Car,
  Users,
  CalendarCheck,
  CreditCard,
  Settings,
  Building2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  companyOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, companyOnly: true },
  { label: "Vehicles", href: "/vehicles", icon: Car, companyOnly: true },
  { label: "Customers", href: "/customers", icon: Users, companyOnly: true },
  { label: "Bookings", href: "/bookings", icon: CalendarCheck, companyOnly: true },
  { label: "Payments", href: "/payments", icon: CreditCard, companyOnly: true },
  { label: "Settings", href: "/settings", icon: Settings, companyOnly: true },
  { label: "Companies", href: "/admin/companies", icon: Building2, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isSuperadmin = session?.user?.role === "superadmin";

  const visible = navItems.filter((item) => {
    if (item.adminOnly) return isSuperadmin;
    if (item.companyOnly) return !isSuperadmin;
    return true;
  });

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Car className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900">
            {isSuperadmin ? "Admin HQ" : (session?.user?.companySlug ?? "FleetMS")}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {visible.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-blue-700" : "text-gray-400 group-hover:text-gray-600"
                    )}
                  />
                  {item.label}
                  {active && (
                    <ChevronRight className="ml-auto h-3 w-3 text-blue-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3">
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs font-medium text-gray-900 truncate">
            {session?.user?.firstName} {session?.user?.lastName}
          </p>
          <p className="text-xs text-gray-500 capitalize truncate">
            {session?.user?.role}
          </p>
        </div>
      </div>
    </aside>
  );
}
