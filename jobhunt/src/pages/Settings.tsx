import {
  Bell,
  Building2,
  Check,
  CreditCard,
  Save,
  Shield,
  Users,
} from "lucide-react";
import { useState } from "react";

import Layout from "../components/Layout";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/UI";

export default function Settings() {
  const [programName, setProgramName] = useState(
    "Dworks Job Hunt Support",
  );

  const [emailNotifications, setEmailNotifications] =
    useState(true);

  const [expiringAlerts, setExpiringAlerts] =
    useState(true);

  const [weeklyReports, setWeeklyReports] =
    useState(true);

  const [saved, setSaved] = useState(false);

  function saveSettings() {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  return (
    <Layout
      title="Settings"
      subtitle="Manage program preferences, notifications and team settings"
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* PROGRAM SETTINGS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                Program settings
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="programName"
                  className="text-sm font-medium"
                >
                  Program name
                </label>

                <input
                  id="programName"
                  value={programName}
                  onChange={(event) =>
                    setProgramName(event.target.value)
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                />

                <p className="text-xs text-muted-foreground">
                  This name is displayed throughout the JobHunt
                  dashboard.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="timezone"
                  className="text-sm font-medium"
                >
                  Timezone
                </label>

                <select
                  id="timezone"
                  defaultValue="America/Chicago"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="America/Chicago">
                    Central Time (US)
                  </option>

                  <option value="America/New_York">
                    Eastern Time (US)
                  </option>

                  <option value="America/Denver">
                    Mountain Time (US)
                  </option>

                  <option value="America/Los_Angeles">
                    Pacific Time (US)
                  </option>

                  <option value="Asia/Kolkata">
                    India Standard Time
                  </option>

                  <option value="Europe/London">
                    London
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="currency"
                  className="text-sm font-medium"
                >
                  Currency
                </label>

                <select
                  id="currency"
                  defaultValue="USD"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="USD">
                    USD — US Dollar
                  </option>

                  <option value="INR">
                    INR — Indian Rupee
                  </option>

                  <option value="EUR">
                    EUR — Euro
                  </option>

                  <option value="GBP">
                    GBP — British Pound
                  </option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* NOTIFICATIONS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-5 text-primary" />
                Notifications
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-1">
              <SettingToggle
                title="Email notifications"
                description="Receive important program updates by email."
                checked={emailNotifications}
                onChange={setEmailNotifications}
              />

              <SettingToggle
                title="Expiring program alerts"
                description="Get notified when a candidate has fewer than 30 days remaining."
                checked={expiringAlerts}
                onChange={setExpiringAlerts}
              />

              <SettingToggle
                title="Weekly reports"
                description="Receive a weekly summary of candidate activity and program performance."
                checked={weeklyReports}
                onChange={setWeeklyReports}
              />
            </CardContent>
          </Card>

          {/* SECURITY */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5 text-primary" />
                Security
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">
                  Password
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Change the password used to access the
                  JobHunt program.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() =>
                  alert("Password change opened (demo)")
                }
              >
                Change password
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          {/* ACCOUNT */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                Account
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-full bg-accent text-sm font-semibold">
                  AM
                </div>

                <div>
                  <p className="font-medium">
                    Aarav Menon
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Support Lead
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Email
                  </span>

                  <span className="font-medium">
                    aarav@dworks.io
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Team members
                  </span>

                  <span className="font-medium">
                    4
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BILLING */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5 text-primary" />
                Program credits
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-3xl font-semibold">
                892
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                credits remaining this cycle
              </p>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: "63%",
                  }}
                />
              </div>

              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>Used: 1,528</span>
                <span>Total: 2,420</span>
              </div>

              <Button
                variant="outline"
                className="mt-5 w-full"
                onClick={() =>
                  alert("Credit management opened (demo)")
                }
              >
                Manage credits
              </Button>
            </CardContent>
          </Card>

          {/* SAVE */}
          <Card>
            <CardContent className="p-5">
              <Button
                className="w-full"
                onClick={saveSettings}
              >
                {saved ? (
                  <>
                    <Check className="size-4" />
                    Settings saved
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Save settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

/* --------------------------------
   Toggle
-------------------------------- */

function SettingToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-border/70 py-4 last:border-0">
      <div>
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked
            ? "bg-primary"
            : "bg-muted"
        }`}
        aria-label={title}
      >
        <span
          className={`absolute top-1 size-4 rounded-full bg-white transition-transform ${
            checked
              ? "translate-x-6"
              : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}