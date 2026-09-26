import { useRef, useState } from "react";
import {
  FileSpreadsheet,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { Button } from "../UI";
import { importCandidates } from "../../api/candidate";

type ImportCandidatesDialogProps = {
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
};

export function ImportCandidatesDialog({
  open,
  onClose,
  onImported,
}: ImportCandidatesDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /*
   * ========================================
   * RESET DIALOG
   * ========================================
   */

  function resetDialog() {
    setFile(null);
    setError("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  /*
   * ========================================
   * GENERATE UNIQUE IMPORT BATCH ID
   * ========================================
   *
   * This is useful for backend logging/tracking.
   * It is NOT the candidate ID.
   */

  function generateImportBatchId() {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }

    return `import-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}`;
  }

  /*
   * ========================================
   * HANDLE IMPORT
   * ========================================
   */

  async function handleImport() {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    try {
      setImporting(true);
      setError("");
      setSuccess("");

      /*
       * Generate a unique ID for this import operation.
       *
       * IMPORTANT:
       * This is only the import batch ID.
       * Each candidate must still receive its own
       * unique database _id in the backend.
       */

      const importBatchId = generateImportBatchId();

      console.log("Starting candidate import:", {
        importBatchId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      /*
       * Send Excel / CSV file to backend.
       *
       * If your API supports a second parameter,
       * pass importBatchId to it:
       *
       * await importCandidates(file, importBatchId);
       *
       * For backward compatibility with the current
       * API, only the file is passed here.
       */

      const result = await importCandidates(file);

      /*
       * ========================================
       * IMPORT SUCCESS
       * ========================================
       */

      if (result.imported > 0) {
  const createdMessage =
    result.created > 0
      ? `${result.created} candidate(s) created.`
      : "";

  const updatedMessage =
    result.updated > 0
      ? ` ${result.updated} candidate(s) updated.`
      : "";

  const skippedMessage =
    result.skipped > 0
      ? ` ${result.skipped} row(s) skipped.`
      : "";

  setSuccess(
    `${createdMessage}${updatedMessage}${skippedMessage}`,
  );

  onImported?.();

  setTimeout(() => {
    resetDialog();
    onClose();
  }, 800);

  return;
}

      /*
       * ========================================
       * NOTHING IMPORTED
       * ========================================
       */

      if (result.skipped > 0) {
        setError(
          `No new candidates were imported. ${result.skipped} row(s) were skipped because they already exist or were invalid.`,
        );
      } else {
        setError("No candidates were imported.");
      }
    } catch (error) {
      console.error(
        "Failed to import candidates:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to import candidates. Please try again.",
      );
    } finally {
      setImporting(false);
    }
  }

  /*
   * ========================================
   * HANDLE FILE SELECTION
   * ========================================
   */

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile =
      event.target.files?.[0] ?? null;

    setError("");
    setSuccess("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    /*
     * Validate extension.
     */

    const extension =
      selectedFile.name
        .split(".")
        .pop()
        ?.toLowerCase();

    const allowedExtensions = [
      "xlsx",
      "xls",
      "csv",
    ];

    if (
      !extension ||
      !allowedExtensions.includes(extension)
    ) {
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setError(
        "Please select a valid Excel or CSV file (.xlsx, .xls, or .csv).",
      );

      return;
    }

    /*
     * Validate empty file.
     */

    if (selectedFile.size === 0) {
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setError(
        "The selected file is empty. Please choose a valid file.",
      );

      return;
    }

    /*
     * Optional file size protection.
     *
     * 10 MB maximum.
     */

    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setError(
        "File size must be less than 10 MB.",
      );

      return;
    }

    /*
     * File is valid.
     */

    setFile(selectedFile);
  }

  /*
   * ========================================
   * REMOVE SELECTED FILE
   * ========================================
   */

  function handleRemoveFile() {
    if (importing) {
      return;
    }

    setFile(null);
    setError("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  /*
   * ========================================
   * CLOSE DIALOG
   * ========================================
   */

  function handleClose() {
    if (importing) {
      return;
    }

    resetDialog();
    onClose();
  }

  /*
   * ========================================
   * FORMAT FILE SIZE
   * ========================================
   */

  function formatFileSize(size: number) {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  /*
   * ========================================
   * DO NOT RENDER WHEN CLOSED
   * ========================================
   */

  if (!open) {
    return null;
  }

  /*
   * ========================================
   * UI
   * ========================================
   */

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border bg-background shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* ========================================
            HEADER
        ======================================== */}

        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold">
              Import Candidates
            </h2>

            <p className="text-sm text-muted-foreground">
              Upload an Excel or CSV file
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={importing}
            aria-label="Close"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* ========================================
            CONTENT
        ======================================== */}

        <div className="p-6">
          {/* ERROR MESSAGE */}

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />

              <span>{error}</span>
            </div>
          )}

          {/* SUCCESS MESSAGE */}

          {success && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

              <span>{success}</span>
            </div>
          )}

          {/* ========================================
              FILE SELECTOR
          ======================================== */}

          <label
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition ${
              importing
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:bg-muted/40"
            }`}
          >
            <FileSpreadsheet className="mb-4 size-12 text-muted-foreground" />

            <p className="font-medium">
              {file
                ? file.name
                : "Choose an Excel or CSV file"}
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Supported formats: .xlsx, .xls, .csv
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Maximum file size: 10 MB
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              disabled={importing}
              onChange={handleFileChange}
            />
          </label>

          {/* ========================================
              SELECTED FILE
          ======================================== */}

          {file && (
            <div className="mt-4 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FileSpreadsheet className="size-5 shrink-0 text-muted-foreground" />

                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Selected file
                    </p>

                    <p className="truncate font-medium">
                      {file.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  disabled={importing}
                  aria-label="Remove file"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ========================================
              IMPORT INFORMATION
          ======================================== */}

          <div className="mt-4 rounded-lg bg-muted/40 p-4 text-sm">
            <p className="font-medium">
              Import requirements
            </p>

            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>
                • Name and email are required.
              </li>

              <li>
                • Existing candidates with the same
                email will be skipped.
              </li>

              <li>
                • Each imported candidate must be
                created as a separate database record.
              </li>

              <li>
                • Each candidate must have a unique
                database ID.
              </li>
            </ul>
          </div>

          {/* ========================================
              IMPORTANT DATABASE NOTE
          ======================================== */}

          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              Import safety
            </p>

            <p className="mt-1 text-muted-foreground">
              Every imported candidate is expected to
              have its own unique candidate ID. Candidate
              actions such as edit, delete, status update,
              and filtering must use that unique ID.
            </p>
          </div>
        </div>

        {/* ========================================
            FOOTER
        ======================================== */}

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={importing}
          >
            Cancel
          </Button>

          <Button
            onClick={handleImport}
            disabled={!file || importing}
          >
            <Upload className="size-4" />

            {importing
              ? "Importing..."
              : "Import Data"}
          </Button>
        </div>
      </div>
    </div>
  );
}