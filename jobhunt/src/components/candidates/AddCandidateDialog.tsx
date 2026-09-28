import { UserPlus, X } from "lucide-react";
import { useState } from "react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../UI";

import {
  domains,
  plans,
  team,
} from "../../data";

export type CandidateFormData = {
  name: string;
  email: string;
  phone: string;
  location: string;
  targetRole: string;
  experience: string;
  domain: string;
  plan: string;
  assignedSpecialist: string;
  startDate: string;
  programDays: string;
  status: string;
  notes: string;
};

type AddCandidateDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (candidate: CandidateFormData) => void | Promise<void>;
  saving?: boolean;
};

function createInitialForm(): CandidateFormData {
  return {
    name: "",
    email: "",
    phone: "",
    location: "",
    targetRole: "",
    experience: "0-2 yrs",
    domain: domains[0] || "",
    plan: plans[0]?.name || "Basic",
    assignedSpecialist: team[0]?.name || "",
    startDate: new Date().toISOString().split("T")[0],
    programDays: "45",
    status: "Active",
    notes: "",
  };
}

export default function AddCandidateDialog({
  open,
  onClose,
  onSubmit,
  saving = false,
}: AddCandidateDialogProps) {
  const [formData, setFormData] =
    useState<CandidateFormData>(
      createInitialForm(),
    );

  if (!open) {
    return null;
  }

  function handleInputChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const programDays =
      Number(formData.programDays);

    if (
      !Number.isFinite(programDays) ||
      programDays <= 0
    ) {
      alert(
        "Please enter a valid number of Program Days.",
      );
      return;
    }

    const candidate = {
      ...formData,
      programDays: String(programDays),
    };

    await onSubmit(candidate);

    setFormData(createInitialForm());
  }

  function handleClose() {
    if (saving) {
      return;
    }

    setFormData(createInitialForm());
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
        {/* HEADER */}

        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              Add Candidate
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Enroll a new candidate into the Job Hunt program.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-md p-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* ====================================== */}
            {/* CANDIDATE DETAILS */}
            {/* ====================================== */}

            <div>
              <h3 className="mb-3 font-medium">
                Candidate Details
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />

                <FormInput
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />

                <FormInput
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />

                <FormInput
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />

                <FormInput
                  label="Target Role"
                  name="targetRole"
                  value={formData.targetRole}
                  onChange={handleInputChange}
                />

                <FormInput
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* ====================================== */}
            {/* PROGRAM DETAILS */}
            {/* ====================================== */}

            <div>
              <h3 className="mb-3 font-medium">
                Program Details
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* DOMAIN */}

                <SelectField
                  label="Domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  options={domains}
                />

                {/* EXPERIENCE */}

                <SelectField
                  label="Experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  options={[
                    "0-2 yrs",
                    "3-5 yrs",
                    "6-8 yrs",
                    "9+ yrs",
                  ]}
                />

                {/* PLAN */}

                <SelectField
                  label="Plan"
                  name="plan"
                  value={formData.plan}
                  onChange={handleInputChange}
                  options={plans.map(
                    (plan) => plan.name,
                  )}
                />

                {/* ASSIGNED SPECIALIST */}

                <SelectField
                  label="Assigned Specialist"
                  name="assignedSpecialist"
                  value={
                    formData.assignedSpecialist
                  }
                  onChange={handleInputChange}
                  options={team.map(
                    (member) => member.name,
                  )}
                />

                {/* ================================= */}
                {/* PROGRAM DAYS */}
                {/* ================================= */}

                <FormInput
                  label="Program Days"
                  name="programDays"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.programDays}
                  onChange={handleInputChange}
                  required
                />

                {/* STATUS */}

                <SelectField
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  options={[
                    "Active",
                    "Expiring Soon",
                    "Completed",
                    "Paused",
                  ]}
                />
              </div>
            </div>

            {/* ====================================== */}
            {/* NOTES */}
            {/* ====================================== */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Notes
              </label>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Add any notes about the candidate..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* ====================================== */}
            {/* PROGRAM SUMMARY */}
            {/* ====================================== */}

            <div className="rounded-xl border bg-muted/30 p-4">
              <h3 className="font-medium">
                Program Summary
              </h3>

              <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Plan
                  </p>

                  <p className="mt-1 font-medium">
                    {formData.plan || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Program Days
                  </p>

                  <p className="mt-1 font-medium">
                    {formData.programDays || "0"} days
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Credits
                  </p>

                  <p className="mt-1 font-medium">
                    {plans.find(
                      (plan) =>
                        plan.name ===
                        formData.plan,
                    )?.credits ?? 0}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Status
                  </p>

                  <p className="mt-1 font-medium">
                    {formData.status}
                  </p>
                </div>
              </div>
            </div>

            {/* ====================================== */}
            {/* ACTIONS */}
            {/* ====================================== */}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={saving}
              >
                <UserPlus className="size-4" />

                {saving
                  ? "Adding..."
                  : "Add Candidate"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ========================================= */
/* FORM INPUT */
/* ========================================= */

function FormInput({
  label,
  ...props
}: {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <input
        {...props}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

/* ========================================= */
/* SELECT FIELD */
/* ========================================= */

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}