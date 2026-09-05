import { Save, UserPlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../components/Layout";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/UI";

import { domains, plans, team } from "../data";

export default function AddCandidate() {
  const navigate = useNavigate();

  const [plan, setPlan] = useState("Growth");
  const [welcomeEmail, setWelcomeEmail] = useState(true);

  const selectedPlan = plans.find((item) => item.name === plan);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    alert("Candidate enrolled successfully (demo)");

    navigate("/candidates");
  }

  function saveDraft() {
    alert("Draft saved successfully (demo)");
  }

  return (
    <Layout
      title="Add Candidate"
      subtitle="Manually enroll a newly onboarded candidate into the program"
    >
      <form
        onSubmit={handleSubmit}
        className="grid gap-5 lg:grid-cols-[1fr_320px]"
      >
        {/* LEFT SIDE */}
        <div className="space-y-5">
          {/* CANDIDATE DETAILS */}
          <Card>
            <CardHeader>
              <CardTitle>Candidate details</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Full name"
                  name="name"
                  placeholder="e.g. Neha Kapoor"
                  required
                />

                <Field
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="name@email.com"
                  required
                />

                <Field
                  label="Phone"
                  name="phone"
                  placeholder="+91 98765 43210"
                />

                <Field
                  label="Location"
                  name="location"
                  placeholder="City, Country"
                />

                {/* DOMAIN */}
                <SelectField
                  label="Domain"
                  name="domain"
                  options={domains}
                  defaultValue={domains[0]}
                />

                <Field
                  label="Target role"
                  name="role"
                  placeholder="e.g. Senior Data Analyst"
                />

                {/* EXPERIENCE */}
                <SelectField
                  label="Experience"
                  name="experience"
                  options={[
                    "0-2 yrs",
                    "3-5 yrs",
                    "6-8 yrs",
                    "9+ yrs",
                  ]}
                  defaultValue="3-5 yrs"
                />

                <Field
                  label="Start date"
                  name="start"
                  type="date"
                  defaultValue="2026-08-21"
                />
              </div>
            </CardContent>
          </Card>

          {/* PLAN & SUPPORT */}
          <Card>
            <CardHeader>
              <CardTitle>Plan &amp; support</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* PLAN */}
                <div className="space-y-2">
                  <label
                    htmlFor="plan"
                    className="text-sm font-medium"
                  >
                    Plan
                  </label>

                  <select
                    id="plan"
                    value={plan}
                    onChange={(event) =>
                      setPlan(event.target.value)
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
                  >
                    {plans.map((item) => (
                      <option
                        key={item.id}
                        value={item.name}
                      >
                        {item.name} · {item.durationMonths} months
                      </option>
                    ))}
                  </select>
                </div>

                {/* CREDITS */}
                <Field
                  label="Credits allocated"
                  name="credits"
                  type="number"
                  value={String(selectedPlan?.credits ?? 0)}
                  readOnly
                />

                {/* SPECIALIST */}
                <SelectField
                  label="Assigned specialist"
                  name="specialist"
                  options={team.map(
                    (member) =>
                      `${member.name} — ${member.role}`,
                  )}
                  defaultValue={`${team[0].name} — ${team[0].role}`}
                />

                {/* WELCOME EMAIL */}
                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 sm:col-span-2">
                  <div>
                    <p className="text-sm font-medium">
                      Send welcome email
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Shares the onboarding checklist and
                      specialist introduction.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setWelcomeEmail((value) => !value)
                    }
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      welcomeEmail
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                    aria-label="Toggle welcome email"
                  >
                    <span
                      className={`absolute top-1 size-4 rounded-full bg-white transition-transform ${
                        welcomeEmail
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* NOTES */}
                <div className="space-y-2 sm:col-span-2">
                  <label
                    htmlFor="notes"
                    className="text-sm font-medium"
                  >
                    Internal notes
                  </label>

                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    placeholder="Anything the support team should know?"
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE — ENROLLMENT SUMMARY */}
        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Enrollment summary</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <SummaryRow
              label="Plan"
              value={plan}
            />

            <SummaryRow
              label="Duration"
              value={`${selectedPlan?.durationMonths} months`}
            />

            <SummaryRow
              label="Credits"
              value={String(selectedPlan?.credits)}
            />

            <SummaryRow
              label="Program fee"
              value={`$${selectedPlan?.price}`}
            />

            <SummaryRow
              label="Status on save"
              value="Active"
            />

            <Button
              type="submit"
              className="mt-2 w-full"
            >
              <UserPlus className="size-4" />
              Enroll candidate
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={saveDraft}
            >
              <Save className="size-4" />
              Save as draft
            </Button>
          </CardContent>
        </Card>
      </form>
    </Layout>
  );
}

/* -----------------------------
   Reusable field
----------------------------- */

function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  value,
  readOnly,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="text-sm font-medium"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        readOnly={readOnly}
        required={required}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

/* -----------------------------
   Reusable select
----------------------------- */

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="text-sm font-medium"
      >
        {label}
      </label>

      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

/* -----------------------------
   Summary row
----------------------------- */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/70 pb-2 last:border-0">
      <span className="text-muted-foreground">
        {label}
      </span>

      <span className="font-medium">
        {value}
      </span>
    </div>
  );
}
