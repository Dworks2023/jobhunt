import {
  BarChart3,
  Briefcase,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "./UI";

const navigation = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/candidates", label: "Candidates", icon: Users },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

type LayoutProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export default function Layout({
  title,
  subtitle,
  actions,
  children,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[262px] border-r border-sidebar-border bg-sidebar px-4 py-6 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* LOGO */}
        <Link
          to="/"
          className="mb-8 flex items-center gap-3 px-2"
          onClick={() => setSidebarOpen(false)}
        >
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Briefcase className="size-5" />
          </span>

          <span>
            <span className="block text-base font-semibold leading-tight">
              Dworks
            </span>

            <span className="block text-xs text-muted-foreground">
              Job Hunt Support
            </span>
          </span>
        </Link>

        {/* NAVIGATION */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            const active =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="lg:pl-[262px]">
        {/* HEADER */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-4 backdrop-blur">
          {/* MOBILE MENU */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen((value) => !value)}
          >
            <Menu className="size-5" />
          </Button>
        </header>

        {/* PAGE */}
        <main className="px-5 py-7 lg:px-8">
          {/* PAGE TITLE */}
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight lg:text-[28px]">
                {title}
              </h1>

              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>

            {/* PAGE ACTIONS */}
            {actions && (
              <div className="flex flex-wrap gap-2">
                {actions}
              </div>
            )}
          </div>

          {/* PAGE CONTENT */}
          {children}
        </main>
      </div>
    </div>
  );
}
