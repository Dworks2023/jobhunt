import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import Layout from "../components/Layout";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/UI";

export default function Import() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [imported, setImported] = useState(false);

  function selectFile(selectedFile: File | undefined) {
    if (!selectedFile) return;

    const valid =
      selectedFile.name.endsWith(".xlsx") ||
      selectedFile.name.endsWith(".xls") ||
      selectedFile.name.endsWith(".csv");

    if (!valid) {
      alert("Please select an Excel or CSV file.");
      return;
    }

    setFile(selectedFile);
    setImported(false);
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    selectFile(event.target.files?.[0]);
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    setDragging(false);

    selectFile(event.dataTransfer.files?.[0]);
  }

  function removeFile() {
    setFile(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function importFile() {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    setImported(true);
  }

  function downloadTemplate() {
    alert("Template download started (demo)");
  }

  return (
    <Layout
      title="Import Data"
      subtitle="Import candidate information from an Excel or CSV file"
      actions={
        <Button
          variant="outline"
          onClick={downloadTemplate}
        >
          <Download className="size-4" />
          Download Template
        </Button>
      }
    >
      <div className="mx-auto max-w-4xl space-y-5">
        {/* UPLOAD CARD */}
        <Card>
          <CardHeader>
            <CardTitle>Import candidates</CardTitle>
          </CardHeader>

          <CardContent>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-accent/30"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Upload className="size-6" />
              </div>

              <h3 className="mt-4 font-semibold">
                Drop your file here
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                or click to browse from your computer
              </p>

              <p className="mt-3 text-xs text-muted-foreground">
                Supported formats: .xlsx, .xls, .csv
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SELECTED FILE */}
        {file && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileSpreadsheet className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {file.name}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={removeFile}
                  className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Remove file"
                >
                  <X className="size-4" />
                </button>
              </div>

              <Button
                className="mt-5 w-full"
                onClick={importFile}
              >
                <Upload className="size-4" />
                Import Candidates
              </Button>
            </CardContent>
          </Card>
        )}

        {/* SUCCESS */}
        {imported && (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />

            <div>
              <p className="font-medium">
                Import completed successfully
              </p>

              <p className="mt-1 text-sm">
                Candidate data was imported successfully.
                This is currently a demo import flow.
              </p>
            </div>
          </div>
        )}

        {/* INSTRUCTIONS */}
        <Card>
          <CardHeader>
            <CardTitle>Before importing</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Instruction
                number="1"
                title="Download template"
                text="Use the provided template to keep your candidate data in the expected format."
              />

              <Instruction
                number="2"
                title="Add candidates"
                text="Fill in candidate details, plan, domain, specialist and program information."
              />

              <Instruction
                number="3"
                title="Upload file"
                text="Upload the completed Excel or CSV file and start the import."
              />
            </div>
          </CardContent>
        </Card>

        {/* BACK */}
        <div>
          <Button variant="outline" asChild>
            <Link to="/candidates">
              Back to Candidates
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}

function Instruction({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {number}
      </div>

      <p className="mt-3 font-medium">{title}</p>

      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {text}
      </p>
    </div>
  );
}