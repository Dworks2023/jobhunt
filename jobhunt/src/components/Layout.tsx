import {
  Activity,
  BarChart3,
  Bell,
  Briefcase,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button, Input } from "./UI";

const navigation = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/candidates", label: "Candidates", icon: Users },
  { path: "/add-candidate", label: "Add Candidate", icon: UserPlus },
  { path: "/import", label: "Import Data", icon: Upload },
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
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[262px] border-r bg-sidebar px-4 py-6 transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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

        <div className="absolute inset-x-4 bottom-6 rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Program credits
          </p>
          <p className="mt-1 text-xl font-semibold">1,092</p>
          <p className="text-xs text-muted-foreground">
            remaining this cycle
          </p>
        </div>
      </aside>

      <div className="lg:pl-[262px]">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/90 px-5 py-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen((value) => !value)}
          >
            <Menu className="size-5" />
          </Button>

          <div className="relative hidden max-w-sm flex-1 md:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Search candidates, plans, reports..."
              className="pl-9"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Bell className="size-5" />
            </Button>

            <div className="flex items-center gap-2 rounded-full border py-1 pl-1 pr-3">
              <span className="grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold">
                AM
              </span>

              <span className="hidden text-sm font-medium sm:block">
                Aarav Menon
              </span>
            </div>
          </div>
        </header>

        <main className="px-5 py-7 lg:px-8">
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

            {actions && (
              <div className="flex flex-wrap gap-2">{actions}</div>
            )}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}