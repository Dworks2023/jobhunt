import {
  ArrowLeft,
  Calendar,
  Coins,
  Eye,
  FileText,
  Mail,
  MapPin,
  Phone,
  Plus,
  Target,
  Upload,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import Layout from "../components/Layout";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  StatusBadge,
} from "../components/UI";

import {
  addDailyApplications,
  getApplicationHistory,
  type ApplicationHistoryItem,
} from "../api/candidate";


const API_BASE_URL =
  "http://localhost:5000";


/*
|--------------------------------------------------------------------------
| TABS
|--------------------------------------------------------------------------
*/

const tabs = [
  "overview",
  "applications",
  "daily-mar",
  "reports",
  "activity",
] as const;

type Tab =
  (typeof tabs)[number];


/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type ReportType =
  | "Interview Call"
  | "Report";


type ActivityItem = {
  id: string;
  _id?: string;
  text: string;
  date: string;
};


type Candidate = {
  id: string;

  _id?: string;

  candidateId?: string;

  name: string;

  email: string;

  phone?: string;

  location?: string;

  domain?: string;

  experience?: string;

  targetRole?: string;

  startDate?: string;

  endDate?: string;

  plan?: string;

  owner?: string;

  assignedSpecialist?: string;

  status?: string;

    creditsTotal?: number;

  creditsUsed?: number;

  creditsRemaining?: number;

  applicationHistory?:
    ApplicationHistoryItem[];

  daysRemaining?: number;

  monthly?: {
    month: string;
    applications: number;
    interviews: number;
    offers: number;
  }[];

  activity?: ActivityItem[];
};


type UploadedReport = {
  id: string;

  _id?: string;

  date: string;

  type: ReportType;

  title: string;

  company?: string;

  role?: string;

  reportType?: string;

  outcome?: string;

  fileName: string;

  fileUrl: string;

  fileType: string;
};


type UploadedMARReport = {
  id: string;

  _id?: string;

  date: string;

  fileName: string;

  fileUrl: string;

  fileType: string;
};


type ApplicationHistoryRecord =
  ApplicationHistoryItem;


/*
|--------------------------------------------------------------------------
| FILE URL HELPER
|--------------------------------------------------------------------------
*/

function resolveFileUrl(
  fileUrl?: string,
) {
  if (!fileUrl) {
    return "";
  }

  if (
    fileUrl.startsWith(
      "http://",
    ) ||
    fileUrl.startsWith(
      "https://",
    ) ||
    fileUrl.startsWith(
      "blob:",
    )
  ) {
    return fileUrl;
  }

  if (
    fileUrl.startsWith(
      "/",
    )
  ) {
    return `${API_BASE_URL}${fileUrl}`;
  }

  return `${API_BASE_URL}/${fileUrl}`;
}


/*
|--------------------------------------------------------------------------
| NORMALIZE CANDIDATE
|--------------------------------------------------------------------------
*/

function normalizeCandidate(
  data: any,
): Candidate {
  const candidate =
    data?.candidate ||
    data?.data ||
    data;

  return {
    ...candidate,

    id:
      candidate?.id ||
      candidate?._id ||
      candidate?.candidateId ||
      "",

    _id:
      candidate?._id,

    candidateId:
      candidate?.candidateId ||
      candidate?.id ||
      candidate?._id,

    name:
      candidate?.name ||
      "Unnamed Candidate",

    email:
      candidate?.email ||
      "",

    phone:
      candidate?.phone ||
      "",

    location:
      candidate?.location ||
      "",

    domain:
      candidate?.domain ||
      "",

    experience:
      candidate?.experience ||
      "",

    targetRole:
      candidate?.targetRole ||
      "",

    startDate:
      candidate?.startDate ||
      "",

    endDate:
      candidate?.endDate ||
      "",

    plan:
      candidate?.plan ||
      "",

    owner:
      candidate?.owner ||
      candidate?.assignedSpecialist ||
      "Unassigned",

    assignedSpecialist:
      candidate?.assignedSpecialist ||
      candidate?.owner ||
      "",

    status:
      candidate?.status ||
      "Active",

    creditsRemaining:
      Number(
        candidate?.creditsRemaining ??
          0,
      ),

    creditsTotal:
      Number(
        candidate?.creditsTotal ??
          0,
      ),

    daysRemaining:
      Number(
        candidate?.daysRemaining ??
          0,
      ),

    monthly:
      Array.isArray(
        candidate?.monthly,
      )
        ? candidate.monthly
        : [],

    activity:
      Array.isArray(
        candidate?.activity,
      )
        ? candidate.activity
        : [],
  };
}


/*
|--------------------------------------------------------------------------
| NORMALIZE REPORT
|--------------------------------------------------------------------------
*/

function normalizeReport(
  data: any,
): UploadedReport {
  const report =
    data?.report ||
    data?.data ||
    data;

  return {
    id:
      report?.id ||
      report?._id ||
      `report-${Date.now()}`,

    _id:
      report?._id,

    date:
      report?.date ||
      new Date()
        .toISOString()
        .split("T")[0],

    type:
      report?.type ===
      "Report"
        ? "Report"
        : "Interview Call",

    title:
      report?.title ||
      report?.fileName ||
      "Uploaded File",

    company:
      report?.company,

    role:
      report?.role,

    reportType:
      report?.reportType,

    outcome:
      report?.outcome ||
      "File uploaded",

    fileName:
      report?.fileName ||
      report?.originalname ||
      report?.originalName ||
      "Uploaded File",

    fileUrl:
      report?.fileUrl ||
      report?.url ||
      report?.path ||
      "",

    fileType:
      report?.fileType ||
      report?.mimetype ||
      report?.mimeType ||
      "",
  };
}


/*
|--------------------------------------------------------------------------
| NORMALIZE MAR REPORT
|--------------------------------------------------------------------------
*/

function normalizeMARReport(
  data: any,
): UploadedMARReport {
  const report =
    data?.report ||
    data?.data ||
    data;

  return {
    id:
      report?.id ||
      report?._id ||
      `mar-${Date.now()}`,

    _id:
      report?._id,

    date:
      report?.date ||
      new Date()
        .toISOString()
        .split("T")[0],

    fileName:
      report?.fileName ||
      report?.originalname ||
      report?.originalName ||
      "MAR Report",

    fileUrl:
      report?.fileUrl ||
      report?.url ||
      report?.path ||
      "",

    fileType:
      report?.fileType ||
      report?.mimetype ||
      report?.mimeType ||
      "text/plain",
  };
}


/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function CandidateDetails() {

  const {
    id,
    candidateId: routeCandidateId,
  } = useParams();

  const candidateId =
    routeCandidateId ||
    id ||
    "";


  /*
  |--------------------------------------------------------------------------
  | MAIN STATES
  |--------------------------------------------------------------------------
  */

  const [
    candidate,
    setCandidate,
  ] =
    useState<Candidate | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<Tab>(
      "overview",
    );

    /*
|--------------------------------------------------------------------------
| APPLICATION STATES
|--------------------------------------------------------------------------
*/

const [
  applicationHistory,
  setApplicationHistory,
] =
  useState<
    ApplicationHistoryRecord[]
  >([]);

const [
  applicationCredits,
  setApplicationCredits,
] =
  useState({
    total: 0,
    used: 0,
    remaining: 0,
  });

const [
  applicationModalOpen,
  setApplicationModalOpen,
] =
  useState(false);

const [
  applicationCount,
  setApplicationCount,
] =
  useState("");

const [
  applicationDate,
  setApplicationDate,
] =
  useState(
    new Date()
      .toISOString()
      .split("T")[0],
  );

const [
  applicationUpdatedBy,
  setApplicationUpdatedBy,
] =
  useState("");

const [
  savingApplications,
  setSavingApplications,
] =
  useState(false);

const [
  applicationError,
  setApplicationError,
] =
  useState("");

  /*
  |--------------------------------------------------------------------------
  | REPORT STATES
  |--------------------------------------------------------------------------
  */

  const [
    uploadedReports,
    setUploadedReports,
  ] =
    useState<
      UploadedReport[]
    >([]);

  const [
    uploadedMARReports,
    setUploadedMARReports,
  ] =
    useState<
      UploadedMARReport[]
    >([]);


  /*
  |--------------------------------------------------------------------------
  | FILE INPUTS
  |--------------------------------------------------------------------------
  */

  const fileInputRef =
    useRef<
      HTMLInputElement | null
    >(null);

  const marFileInputRef =
    useRef<
      HTMLInputElement | null
    >(null);


  /*
  |--------------------------------------------------------------------------
  | UPLOAD MODAL
  |--------------------------------------------------------------------------
  */

  const [
    uploadModalOpen,
    setUploadModalOpen,
  ] =
    useState(false);

  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    uploadType,
    setUploadType,
  ] =
    useState<ReportType>(
      "Interview Call",
    );

  const [
    companyName,
    setCompanyName,
  ] =
    useState("");

  const [
    roleName,
    setRoleName,
  ] =
    useState("");

  const [
    reportType,
    setReportType,
  ] =
    useState(
      "15 Days Report",
    );

  const [
    uploading,
    setUploading,
  ] =
    useState(false);


  /*
  |--------------------------------------------------------------------------
  | PREVIEW STATES
  |--------------------------------------------------------------------------
  */

  const [
    previewFile,
    setPreviewFile,
  ] =
    useState<
      UploadedReport | null
    >(null);

  const [
    previewMAR,
    setPreviewMAR,
  ] =
    useState<
      UploadedMARReport | null
    >(null);

  const [
    marContent,
    setMarContent,
  ] =
    useState("");

  const [
    loadingMAR,
    setLoadingMAR,
  ] =
    useState(false);


  /*
  |--------------------------------------------------------------------------
  | LOAD CANDIDATE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (!candidateId) {
      setError(
        "Candidate ID is missing.",
      );

      setLoading(false);

      return;
    }

    async function loadCandidate() {

      try {

        setLoading(true);

        setError("");

        const response =
          await fetch(
            `${API_BASE_URL}/api/candidates/${candidateId}`,
          );

        if (!response.ok) {
          throw new Error(
            `Unable to load candidate (${response.status})`,
          );
        }

        const data =
          await response.json();

        setCandidate(
          normalizeCandidate(
            data,
          ),
        );

      } catch (err) {

        console.error(
          "Candidate loading error:",
          err,
        );

        setError(
          "Unable to load candidate details.",
        );

      } finally {

        setLoading(false);

      }
    }

    loadCandidate();

  }, [
    candidateId,
  ]);


  /*
  |--------------------------------------------------------------------------
  | LOAD REPORTS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (!candidateId) {
      return;
    }

    async function loadReports() {

      try {

        const response =
          await fetch(
            `${API_BASE_URL}/api/candidates/${candidateId}/reports`,
          );

        if (!response.ok) {
          console.warn(
            "Reports endpoint returned:",
            response.status,
          );

          return;
        }

        const data =
          await response.json();

        const list =
          Array.isArray(data)
            ? data
            : Array.isArray(
                data?.reports,
              )
              ? data.reports
              : Array.isArray(
                  data?.data,
                )
                ? data.data
                : [];

        setUploadedReports(
          list.map(
            normalizeReport,
          ),
        );

      } catch (err) {

        console.error(
          "Reports loading error:",
          err,
        );
      }
    }

    loadReports();

  }, [
    candidateId,
  ]);


  /*
  |--------------------------------------------------------------------------
  | LOAD DAILY MAR REPORTS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (!candidateId) {
      return;
    }

    async function loadMARReports() {

      try {

        const response =
          await fetch(
            `${API_BASE_URL}/api/candidates/${candidateId}/mar`,
          );

        if (!response.ok) {
          console.warn(
            "MAR endpoint returned:",
            response.status,
          );

          return;
        }

        const data =
          await response.json();

        const list =
          Array.isArray(data)
            ? data
            : Array.isArray(
                data?.reports,
              )
              ? data.reports
              : Array.isArray(
                  data?.data,
                )
                ? data.data
                : [];

        setUploadedMARReports(
          list.map(
            normalizeMARReport,
          ),
        );

      } catch (err) {

        console.error(
          "MAR loading error:",
          err,
        );
      }
    }

    loadMARReports();

  }, [
    candidateId,
  ]);


  /*
  |--------------------------------------------------------------------------
  | LOAD ACTIVITY
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (!candidateId) {
      return;
    }

    async function loadActivity() {

      try {

        const response =
          await fetch(
            `${API_BASE_URL}/api/candidates/${candidateId}/activity`,
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        const list =
          Array.isArray(data)
            ? data
            : Array.isArray(
                data?.activity,
              )
              ? data.activity
              : Array.isArray(
                  data?.data,
                )
                ? data.data
                : [];

        setCandidate(
          (previous) =>
            previous
              ? {
                  ...previous,

                  activity:
                    list.map(
                      (
                        item: any,
                      ) => ({
                        id:
                          item.id ||
                          item._id ||
                          `activity-${Date.now()}`,

                        _id:
                          item._id,

                        text:
                          item.text ||
                          item.description ||
                          "",

                        date:
                          item.date ||
                          item.createdAt ||
                          "",
                      }),
                    ),
                }
              : previous,
        );

      } catch (err) {

        console.error(
          "Activity loading error:",
          err,
        );
      }
    }

    loadActivity();

  }, [
    candidateId,
  ]);

/*
|--------------------------------------------------------------------------
| LOAD APPLICATION HISTORY
|--------------------------------------------------------------------------
*/

async function loadApplicationHistory() {

  if (!candidateId) {
    return;
  }

  try {

    setApplicationError("");

    const data =
      await getApplicationHistory(
        candidateId,
      );

    setApplicationHistory(
      Array.isArray(
        data.data,
      )
        ? data.data
        : [],
    );

    setApplicationCredits({
      total:
        Number(
          data.creditsTotal,
        ) || 0,

      used:
        Number(
          data.creditsUsed,
        ) || 0,

      remaining:
        Number(
          data.creditsRemaining,
        ) || 0,
    });

  } catch (error) {

    console.error(
      "Failed to load application history:",
      error,
    );

    setApplicationError(
      error instanceof Error
        ? error.message
        : "Failed to load application history.",
    );

  }

}


/*
|--------------------------------------------------------------------------
| LOAD APPLICATIONS WHEN TAB OPENS
|--------------------------------------------------------------------------
*/

useEffect(() => {

  if (
    activeTab ===
      "applications" &&
    candidateId
  ) {

    loadApplicationHistory();

  }

}, [
  activeTab,
  candidateId,
]);


/*
|--------------------------------------------------------------------------
| SAVE DAILY APPLICATIONS
|--------------------------------------------------------------------------
*/

async function saveDailyApplications() {

  setApplicationError("");

  const applications =
    Number(
      applicationCount,
    );

  if (
    !Number.isInteger(
      applications,
    ) ||
    applications <= 0
  ) {

    setApplicationError(
      "Please enter a valid number of applications.",
    );

    return;

  }

  if (!candidateId) {

    setApplicationError(
      "Candidate ID is missing.",
    );

    return;

  }

  try {

    setSavingApplications(
      true,
    );

    const result =
      await addDailyApplications(
        candidateId,
        {
          applications,

          date:
            applicationDate,

          updatedBy:
            applicationUpdatedBy.trim() ||
            candidate?.owner ||
            candidate?.assignedSpecialist ||
            "Unassigned",
        },
      );

    setApplicationCredits({
      total:
        Number(
          result.creditsTotal,
        ) || 0,

      used:
        Number(
          result.creditsUsed,
        ) || 0,

      remaining:
        Number(
          result.creditsRemaining,
        ) || 0,
    });

    await loadApplicationHistory();

    setCandidate(
      (current) => {

        if (!current) {
          return current;
        }

        return {
          ...current,

          creditsTotal:
            result.creditsTotal,

          creditsUsed:
            result.creditsUsed,

          creditsRemaining:
            result.creditsRemaining,
        };

      },
    );

    setApplicationCount("");

    setApplicationDate(
      new Date()
        .toISOString()
        .split("T")[0],
    );

    setApplicationUpdatedBy("");

    setApplicationModalOpen(
      false,
    );

  } catch (error) {

    console.error(
      "Failed to save applications:",
      error,
    );

    setApplicationError(
      error instanceof Error
        ? error.message
        : "Failed to save applications.",
    );

  } finally {

    setSavingApplications(
      false,
    );

  }

}


  /*
  |--------------------------------------------------------------------------
  | FILE PICKER
  |--------------------------------------------------------------------------
  */

  function openFilePicker() {
  setSelectedFile(null);

  setCompanyName("");

  setRoleName("");

  setReportType("15 Days Report");

  setUploadType("Interview Call");

  setUploadModalOpen(true);
}

function openUploadFileSelector() {
  fileInputRef.current?.click();
}


  function handleFileSelection(
  event: React.ChangeEvent<HTMLInputElement>,
) {
  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  /*
  ========================================
  INTERVIEW CALL VALIDATION
  ========================================
  */

  if (
    uploadType ===
    "Interview Call"
  ) {
    if (
      !file.type.startsWith(
        "image/",
      )
    ) {
      alert(
        "Interview Call uploads must be image files only.",
      );

      event.target.value = "";

      return;
    }
  }

  /*
  ========================================
  REPORT VALIDATION
  ========================================
  */

  if (
    uploadType ===
    "Report"
  ) {
    const isPDF =
      file.type ===
        "application/pdf" ||
      file.name
        .toLowerCase()
        .endsWith(".pdf");

    if (!isPDF) {
      alert(
        "Reports must be uploaded as PDF files only.",
      );

      event.target.value = "";

      return;
    }
  }

  setSelectedFile(
    file,
  );

  event.target.value =
    "";
}


  /*
  |--------------------------------------------------------------------------
  | SAVE NORMAL REPORT
  |--------------------------------------------------------------------------
  */

  async function saveUploadedFile() {
  if (!selectedFile) {
    alert(
      "Please select a file.",
    );

    return;
  }

  if (!candidateId) {
    alert(
      "Candidate ID is missing.",
    );

    return;
  }

  /*
  ========================================
  INTERVIEW VALIDATION
  ========================================
  */

  if (
    uploadType ===
    "Interview Call"
  ) {
    if (
      !companyName.trim()
    ) {
      alert(
        "Please enter company name.",
      );

      return;
    }

    if (
      !roleName.trim()
    ) {
      alert(
        "Please enter role.",
      );

      return;
    }

    if (
      !selectedFile.type.startsWith(
        "image/",
      )
    ) {
      alert(
        "Interview Call must be an image file.",
      );

      return;
    }
  }

  /*
  ========================================
  REPORT VALIDATION
  ========================================
  */

  if (
    uploadType ===
    "Report"
  ) {
    const isPDF =
      selectedFile.type ===
        "application/pdf" ||
      selectedFile.name
        .toLowerCase()
        .endsWith(".pdf");

    if (!isPDF) {
      alert(
        "Report must be a PDF file.",
      );

      return;
    }
  }

  try {
    setUploading(
      true,
    );

    const formData =
      new FormData();

    formData.append(
      "file",
      selectedFile,
    );

    formData.append(
      "type",
      uploadType,
    );

    /*
    ========================================
    INTERVIEW DATA
    ========================================
    */

    if (
      uploadType ===
      "Interview Call"
    ) {
      formData.append(
        "company",
        companyName.trim(),
      );

      formData.append(
        "role",
        roleName.trim(),
      );
    }

    /*
    ========================================
    REPORT DATA
    ========================================
    */

    if (
      uploadType ===
      "Report"
    ) {
      formData.append(
        "reportType",
        reportType,
      );
    }

    const response =
      await fetch(
        `${API_BASE_URL}/api/candidates/${candidateId}/reports`,
        {
          method: "POST",

          body: formData,
        },
      );

    if (!response.ok) {
      const text =
        await response.text();

      throw new Error(
        text ||
          `Upload failed (${response.status})`,
      );
    }

    const data =
      await response.json();

    const newReport =
      normalizeReport(
        data,
      );

    newReport.fileUrl =
      resolveFileUrl(
        newReport.fileUrl,
      );

    /*
    ========================================
    UPDATE LIST
    ========================================
    */

    setUploadedReports(
      (previous) => [
        newReport,
        ...previous,
      ],
    );

    alert(
      `${selectedFile.name} uploaded successfully.`,
    );

    closeUploadModal();

  } catch (err) {
    console.error(
      "Report upload error:",
      err,
    );

    alert(
      err instanceof Error
        ? err.message
        : "Unable to upload the file.",
    );

  } finally {
    setUploading(
      false,
    );
  }
}


  /*
  |--------------------------------------------------------------------------
  | CLOSE UPLOAD MODAL
  |--------------------------------------------------------------------------
  */

  function closeUploadModal() {

    setUploadModalOpen(
      false,
    );

    setSelectedFile(
      null,
    );

    setCompanyName(
      "",
    );

    setRoleName(
      "",
    );

    setReportType(
      "15 Days Report",
    );

    setUploadType(
      "Interview Call",
    );
  }


  /*
  |--------------------------------------------------------------------------
  | MAR FILE PICKER
  |--------------------------------------------------------------------------
  */

  function openMARFilePicker() {
    marFileInputRef.current?.click();
  }


  /*
  |--------------------------------------------------------------------------
  | UPLOAD MAR
  |--------------------------------------------------------------------------
  */

  async function handleMARUpload(
    event: React.ChangeEvent<
      HTMLInputElement
    >,
  ) {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith(
          ".txt",
        )
    ) {

      alert(
        "Please upload a .txt file for the Daily MAR Report.",
      );

      event.target.value =
        "";

      return;
    }

    if (!candidateId) {
      return;
    }

    try {

      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      formData.append(
        "uploadType",
        "mar",
      );

      const response =
        await fetch(
          `${API_BASE_URL}/api/candidates/${candidateId}/mar`,
          {
            method:
              "POST",

            body:
              formData,
          },
        );

      if (!response.ok) {

        const text =
          await response.text();

        throw new Error(
          text ||
            `MAR upload failed (${response.status})`,
        );
      }

      const data =
        await response.json();

      const newMARReport =
        normalizeMARReport(
          data,
        );

      newMARReport.fileUrl =
        resolveFileUrl(
          newMARReport.fileUrl,
        );

      setUploadedMARReports(
        (previous) => [
          ...previous,
          newMARReport,
        ],
      );

      const reader =
        new FileReader();

      reader.onload = () => {

        const text =
          typeof reader.result ===
          "string"
            ? reader.result
            : "";

        setMarContent(
          text,
        );

        setPreviewMAR(
          newMARReport,
        );
      };

      reader.readAsText(
        file,
      );

      alert(
        `${file.name} uploaded successfully.`,
      );

    } catch (err) {

      console.error(
        "MAR upload error:",
        err,
      );

      alert(
        err instanceof Error
          ? err.message
          : "Unable to upload the MAR report.",
      );

    } finally {

      event.target.value =
        "";
    }
  }


  /*
  |--------------------------------------------------------------------------
  | OPEN MAR REPORT
  |--------------------------------------------------------------------------
  */

  async function openMARReport(
    report: UploadedMARReport,
  ) {

    try {

      setLoadingMAR(
        true,
      );

      const fileUrl =
        resolveFileUrl(
          report.fileUrl,
        );

      if (!fileUrl) {
        throw new Error(
          "MAR file URL is missing.",
        );
      }

      const response =
        await fetch(
          fileUrl,
        );

      if (!response.ok) {
        throw new Error(
          `Unable to load file (${response.status})`,
        );
      }

      const text =
        await response.text();

      setMarContent(
        text,
      );

      setPreviewMAR({
        ...report,
        fileUrl,
      });

    } catch (err) {

      console.error(
        "MAR preview error:",
        err,
      );

      alert(
        "Unable to open this MAR report. Please make sure the backend is running and the uploaded file exists.",
      );

    } finally {

      setLoadingMAR(
        false,
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | OPEN NORMAL REPORT
  |--------------------------------------------------------------------------
  */

  function openUploadedReport(
    report: UploadedReport,
  ) {

    const fileUrl =
      resolveFileUrl(
        report.fileUrl,
      );

    if (!fileUrl) {

      alert(
        "The uploaded file URL is missing.",
      );

      return;
    }

    setPreviewFile({
      ...report,
      fileUrl,
    });
  }


  /*
  |--------------------------------------------------------------------------
  | REPORT DETAIL
  |--------------------------------------------------------------------------
  */

  function getReportDetail(
    report: UploadedReport,
  ) {

    if (
      report.type ===
      "Interview Call"
    ) {

      return (
        <>
          <p className="font-medium">
            {report.role ||
              "Interview"}
          </p>

          <p className="text-xs text-muted-foreground">
            {report.company ||
              "Company not specified"}
          </p>
        </>
      );
    }

    return (
      <>
        <p className="font-medium">
          {report.reportType ||
            "Report"}
        </p>

        <p className="text-xs text-muted-foreground">
          Report
        </p>
      </>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {

    return (
      <Layout
        title="Candidate"
        subtitle="Loading candidate details..."
      >
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Loading candidate details...
            </p>
          </CardContent>
        </Card>
      </Layout>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (
    !candidate ||
    error
  ) {

    return (
      <Layout
        title="Candidate unavailable"
        subtitle="The requested candidate could not be found"
      >
        <Card>
          <CardContent className="p-8 text-center">

            <h2 className="text-lg font-semibold">
              Candidate not found
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              {error ||
                "This candidate does not exist in the database."}
            </p>

            <Button
              className="mt-5"
              asChild
            >
              <Link to="/candidates">
                <ArrowLeft className="size-4" />
                Back to Candidates
              </Link>
            </Button>

          </CardContent>
        </Card>
      </Layout>
    );
  }


  const c =
    candidate;


  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  const totals =
    (
      c.monthly || []
    ).reduce(
      (
        total,
        month,
      ) => ({
        applications:
          total.applications +
          Number(
            month.applications ||
              0,
          ),

        interviews:
          total.interviews +
          Number(
            month.interviews ||
              0,
          ),

        offers:
          total.offers +
          Number(
            month.offers ||
              0,
          ),
      }),
      {
        applications:
          0,

        interviews:
          0,

        offers:
          0,
      },
    );


  const creditsTotal =
    Number(
      c.creditsTotal ||
        0,
    );

  const creditsRemaining =
    Number(
      c.creditsRemaining ||
        0,
    );

  const creditPercentage =
    creditsTotal > 0
      ? (
          creditsRemaining /
          creditsTotal
        ) *
        100
      : 0;


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
  <>
    <Layout>
      <div className="mb-5">
        <Button
          variant="ghost"
          size="sm"
          asChild
        >
          <Link to="/candidates">
            <ArrowLeft className="size-4" />
            Back to Candidates
          </Link>
        </Button>
      </div>


        {/* ==================================================
            CANDIDATE HEADER
        ================================================== */}

        <Card>
          <CardContent className="p-6">

            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">

              <div>

                <div className="flex flex-wrap items-center gap-3">

                  <h2 className="text-2xl font-semibold">
                    {c.name}
                  </h2>

                  <StatusBadge
                    status={
                      c.status ||
                      "Active"
                    }
                  />

                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  {c.targetRole ||
                    "Target role not specified"}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {c.candidateId ||
                    c.id}
                </p>

              </div>


              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">

                <div>
                  <p className="text-xs text-muted-foreground">
                    Plan
                  </p>

                  <p className="mt-1 font-medium">
                    {c.plan ||
                      "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Credits Left
                  </p>

                  <p className="mt-1 font-medium">
                    {creditsRemaining}
                    {" / "}
                    {creditsTotal}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Days Left
                  </p>

                  <p className="mt-1 font-medium">
                    {c.daysRemaining ??
                      0}
                  </p>
                </div>

              </div>

            </div>

          </CardContent>
        </Card>


        {/* ==================================================
            TABS
        ================================================== */}

        <div className="mt-5 flex flex-wrap gap-2">

          <Button
            variant={
              activeTab ===
              "overview"
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() =>
              setActiveTab(
                "overview",
              )
            }
          >
            Overview
          </Button>
<Button
  variant={
    activeTab ===
    "applications"
      ? "default"
      : "outline"
  }
  size="sm"
  onClick={() =>
    setActiveTab(
      "applications",
    )
  }
>
  Applications
</Button>

          <Button
            variant={
              activeTab ===
              "daily-mar"
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() =>
              setActiveTab(
                "daily-mar",
              )
            }
          >
            Daily MAR
          </Button>


          <Button
            variant={
              activeTab ===
              "reports"
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() =>
              setActiveTab(
                "reports",
              )
            }
          >
            Reports & Interviews
          </Button>


          <Button
            variant={
              activeTab ===
              "activity"
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() =>
              setActiveTab(
                "activity",
              )
            }
          >
            Activity
          </Button>

        </div>


        {/* ==================================================
    OVERVIEW
================================================== */}

{activeTab === "overview" && (
  <div className="mt-5 space-y-5">

    {/* ================================================
        PROGRAM PERFORMANCE
    ================================================= */}

    <div>

      <div className="mb-3">
        <h2 className="text-lg font-semibold">
          Program Performance
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Overall job hunt progress and results.
        </p>
      </div>


      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* APPLICATIONS */}

        <Card>
          <CardContent className="p-5">

            <p className="text-sm text-muted-foreground">
              Applications
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {totals.applications}
            </p>

          </CardContent>
        </Card>


        {/* INTERVIEWS */}

        <Card>
          <CardContent className="p-5">

            <p className="text-sm text-muted-foreground">
              Interviews
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {totals.interviews}
            </p>

          </CardContent>
        </Card>


        {/* OFFERS */}

        <Card>
          <CardContent className="p-5">

            <p className="text-sm text-muted-foreground">
              Offers
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {totals.offers}
            </p>

          </CardContent>
        </Card>

        {/* REPORTS */}
<Card>
  <CardContent className="p-5">
    <p className="text-sm text-muted-foreground">
      Reports
    </p>

    <p className="mt-2 text-3xl font-semibold">
      {uploadedReports.length}
    </p>
  </CardContent>
</Card>

      </div>

    </div>


    {/* ================================================
        CANDIDATE DETAILS + PROGRAM SUMMARY
    ================================================= */}

    <div className="grid gap-5 lg:grid-cols-3">


      {/* ================================================
          LEFT SIDE - CANDIDATE DETAILS
      ================================================= */}

      <Card className="lg:col-span-2">

        <CardHeader>
          <CardTitle>
            Candidate Details
          </CardTitle>
        </CardHeader>


        <CardContent>

          <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">


            {/* ============================================
                LEFT COLUMN
            ============================================= */}

            <div className="space-y-6">


              {/* EMAIL */}

              <div className="flex items-start gap-3">

                <Mail className="mt-0.5 size-5 text-muted-foreground" />

                <div>

                  <p className="text-sm text-muted-foreground">
                    Email
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {c.email || "-"}
                  </p>

                </div>

              </div>


              {/* PHONE */}

              <div className="flex items-start gap-3">

                <Phone className="mt-0.5 size-5 text-muted-foreground" />

                <div>

                  <p className="text-sm text-muted-foreground">
                    Phone
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {c.phone || "-"}
                  </p>

                </div>

              </div>


              {/* LOCATION */}

              <div className="flex items-start gap-3">

                <MapPin className="mt-0.5 size-5 text-muted-foreground" />

                <div>

                  <p className="text-sm text-muted-foreground">
                    Location
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {c.location || "-"}
                  </p>

                </div>

              </div>


              {/* EXPERIENCE */}

              <div className="flex items-start gap-3">

                <Target className="mt-0.5 size-5 text-muted-foreground" />

                <div>

                  <p className="text-sm text-muted-foreground">
                    Experience
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {c.experience || "-"}
                  </p>

                </div>

              </div>

            </div>


            {/* ============================================
                RIGHT COLUMN
            ============================================= */}

            <div className="space-y-6">


              {/* DOMAIN */}

              <div className="flex items-start gap-3">

                <Target className="mt-0.5 size-5 text-muted-foreground" />

                <div>

                  <p className="text-sm text-muted-foreground">
                    Domain
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {c.domain || "-"}
                  </p>

                </div>

              </div>


              {/* TARGET ROLE */}

              <div className="flex items-start gap-3">

                <Target className="mt-0.5 size-5 text-muted-foreground" />

                <div>

                  <p className="text-sm text-muted-foreground">
                    Target Role
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {c.targetRole || "-"}
                  </p>

                </div>

              </div>


              {/* ASSIGNED SPECIALIST */}

              <div className="flex items-start gap-3">

                <Target className="mt-0.5 size-5 text-muted-foreground" />

                <div>

                  <p className="text-sm text-muted-foreground">
                    Assigned Specialist
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {c.owner ||
                      c.assignedSpecialist ||
                      "Unassigned"}
                  </p>

                </div>

              </div>


              {/* CREDITS */}

              <div className="flex items-start gap-3">

                <Coins className="mt-0.5 size-5 text-muted-foreground" />

                <div>

                  <p className="text-sm text-muted-foreground">
                    Applications Remaining
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {creditsRemaining} / {creditsTotal}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </CardContent>

      </Card>


      {/* ================================================
          RIGHT SIDE - PROGRAM SUMMARY
      ================================================= */}

      <Card className="h-fit">

        <CardHeader>
          <CardTitle>
            Program Summary
          </CardTitle>
        </CardHeader>


        <CardContent className="space-y-6">


          {/* PLAN */}

          <div>

            <p className="text-sm text-muted-foreground">
              Plan
            </p>

            <p className="mt-1 text-base font-semibold">

              {c.plan
                ? `${c.plan} Applications`
                : "-"}

            </p>

          </div>


          {/* START DATE */}

          <div>

            <p className="text-sm text-muted-foreground">
              Start Date
            </p>

            <p className="mt-1 text-base font-medium">
              {c.startDate || "-"}
            </p>

          </div>


          {/* END DATE */}

          <div>

            <p className="text-sm text-muted-foreground">
              End Date
            </p>

            <p className="mt-1 text-base font-medium">
              {c.endDate || "-"}
            </p>

          </div>


          {/* DAYS REMAINING */}

          <div>

            <p className="text-sm text-muted-foreground">
              Days Remaining
            </p>

            <p className="mt-1 text-base font-medium">
              {c.daysRemaining ?? 0}
            </p>

          </div>


          {/* PROGRAM STATUS */}

          <div>

            <p className="text-sm text-muted-foreground">
              Program Status
            </p>

            <div className="mt-2">

              <StatusBadge
                status={
                  c.status ||
                  "Active"
                }
              />

            </div>

          </div>


          {/* NOTES */}

          {c.notes && (

            <div className="border-t pt-5">

              <p className="text-sm text-muted-foreground">
                Notes
              </p>

              <p className="mt-2 text-sm">
                {c.notes}
              </p>

            </div>

          )}

        </CardContent>

      </Card>

    </div>

  </div>
)}


{/* ==================================================
    APPLICATIONS
================================================== */}

{activeTab ===
  "applications" && (

  <div className="mt-5 space-y-5">


    {/* APPLICATION CREDIT SUMMARY */}

    <Card>

      <CardHeader className="flex flex-row items-center justify-between gap-4">

        <div>

          <CardTitle>
            Application Credits
          </CardTitle>

          <p className="mt-1 text-sm text-muted-foreground">
            Track daily job applications and credit usage.
          </p>

        </div>


        <Button
          onClick={() => {

            setApplicationError("");

            setApplicationCount("");

            setApplicationDate(
              new Date()
                .toISOString()
                .split("T")[0],
            );

            setApplicationUpdatedBy(
              candidate?.owner ||
              candidate?.assignedSpecialist ||
              "",
            );

            setApplicationModalOpen(
              true,
            );

          }}
        >

          <Plus className="size-4" />

          Add Applications

        </Button>

      </CardHeader>


      <CardContent>

        <div className="grid gap-4 md:grid-cols-3">


          {/* TOTAL CREDITS */}

          <div className="rounded-xl border p-5">

            <p className="text-sm text-muted-foreground">
              Total Credits
            </p>

            <p className="mt-2 text-3xl font-semibold">

              {
                applicationCredits.total
              }

            </p>

          </div>


          {/* USED */}

          <div className="rounded-xl border p-5">

            <p className="text-sm text-muted-foreground">
              Applications Used
            </p>

            <p className="mt-2 text-3xl font-semibold">

              {
                applicationCredits.used
              }

            </p>

          </div>


          {/* REMAINING */}

          <div className="rounded-xl border p-5">

            <p className="text-sm text-muted-foreground">
              Credits Remaining
            </p>

            <p className="mt-2 text-3xl font-semibold">

              {
                applicationCredits.remaining
              }

            </p>

          </div>


        </div>


        {/* CREDIT PROGRESS */}

        {
          applicationCredits.total >
          0 && (

            <div className="mt-6">

              <div className="mb-2 flex justify-between text-sm">

                <span className="text-muted-foreground">
                  Credit Usage
                </span>

                <span className="font-medium">

                  {
                    applicationCredits.used
                  }

                  {" / "}

                  {
                    applicationCredits.total
                  }

                </span>

              </div>


              <Progress
                value={
                  Math.min(
                    (
                      applicationCredits.used /
                      applicationCredits.total
                    ) * 100,
                    100,
                  )
                }
              />

            </div>

          )
        }


      </CardContent>

    </Card>


    {/* APPLICATION HISTORY */}

    <Card>

      <CardHeader className="flex flex-row items-center justify-between">

        <div>

          <CardTitle>
            Application History
          </CardTitle>

          <p className="mt-1 text-sm text-muted-foreground">
            Daily application entries for this candidate.
          </p>

        </div>

      </CardHeader>


      <CardContent className="px-0">


        {
          applicationHistory.length >
          0 ? (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[650px] text-sm">

                <thead>

                  <tr className="border-y bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">

                    <th className="px-6 py-3 font-medium">
                      Date
                    </th>

                    <th className="px-6 py-3 font-medium">
                      Applications
                    </th>

                    <th className="px-6 py-3 font-medium">
                      Applied By
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {
                    applicationHistory.map(
                      (
                        item,
                      ) => (

                        <tr
                          key={
                            item.id ||
                            item._id ||
                            `${item.date}-${item.applications}`
                          }
                          className="border-b border-border/70 last:border-0"
                        >

                          <td className="px-6 py-4">

                            {
                              item.date
                            }

                          </td>


                          <td className="px-6 py-4">

                            <span className="font-semibold">

                              {
                                item.applications
                              }

                            </span>

                          </td>


                          <td className="px-6 py-4 text-muted-foreground">

                            {
                              item.updatedBy ||
                              "Unassigned"
                            }

                          </td>


                        </tr>

                      ),
                    )
                  }

                </tbody>

              </table>

            </div>

          ) : (

            <div className="py-12 text-center">


              <Coins className="mx-auto size-10 text-muted-foreground" />


              <p className="mt-4 text-sm font-semibold">

                No applications recorded yet

              </p>


              <p className="mt-1 text-sm text-muted-foreground">

                Start recording daily job applications for this candidate.

              </p>


              <Button
                className="mt-5"
                variant="outline"
                onClick={() => {

                  setApplicationError("");

                  setApplicationCount("");

                  setApplicationDate(
                    new Date()
                      .toISOString()
                      .split("T")[0],
                  );

                  setApplicationUpdatedBy(
                    candidate?.owner ||
                    candidate?.assignedSpecialist ||
                    "",
                  );

                  setApplicationModalOpen(
                    true,
                  );

                }}
              >

                <Plus className="size-4" />

                Add Applications

              </Button>


            </div>

          )
        }


      </CardContent>

    </Card>


  </div>

)}


        {/* ==================================================
            DAILY MAR
        ================================================== */}

        {activeTab ===
          "daily-mar" && (

          <Card className="mt-5">

            <CardHeader className="flex-row items-center justify-between">

              <div>

                <CardTitle>
                  Daily MAR Report
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Upload today's .txt or PDF MAR report from your PC or drive.
                </p>

              </div>


              <Button
                size="sm"
                variant="outline"
                onClick={
                  openMARFilePicker
                }
              >
                <Upload className="size-4" />
                Upload MAR Report
              </Button>

            </CardHeader>


            <CardContent className="px-0">

              {uploadedMARReports.length >
              0 ? (

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[600px] text-sm">

                    <thead>

                      <tr className="border-y bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">

                        <th className="px-6 py-3 font-medium">
                          Date
                        </th>

                        <th className="px-6 py-3 font-medium">
                          Report
                        </th>

                        <th className="px-6 py-3 text-center font-medium">
                          Action
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {uploadedMARReports.map(
                        (
                          report,
                        ) => (

                          <tr
                            key={
                              report.id
                            }
                            className="border-b border-border/70 last:border-0"
                          >

                            <td className="px-6 py-3 text-muted-foreground">
                              {
                                report.date
                              }
                            </td>


                            <td className="px-6 py-3">

                              <div className="flex items-center gap-3">

                                <FileText className="size-4 text-muted-foreground" />

                                <div className="min-w-0">

                                  <p className="truncate font-medium">
                                    {
                                      report.fileName
                                    }
                                  </p>

                                  <p className="text-xs text-muted-foreground">
  Daily MAR Report •{" "}
  {report.fileFormat ||
    (report.fileName
      ?.toLowerCase()
      .endsWith(".pdf")
      ? "PDF"
      : "TXT")}
</p>

                                </div>

                              </div>

                            </td>


                            <td className="px-6 py-3 text-center">

                              <button
                                type="button"
                                className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
                                onClick={() =>
                                  openMARReport(
                                    report,
                                  )
                                }
                                title="View MAR report"
                              >
                                <Eye className="size-4" />
                              </button>

                            </td>

                          </tr>
                        ),
                      )}

                    </tbody>

                  </table>

                </div>

              ) : (

                <div className="border-t px-6 py-10 text-center">

                  <FileText className="mx-auto size-10 text-muted-foreground" />

                  <p className="mt-3 text-sm font-medium">
                    No Daily MAR reports uploaded
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Upload today's .txt MAR report from your PC or drive.
                  </p>

                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={
                      openMARFilePicker
                    }
                  >
                    <Upload className="size-4" />
                    Upload .txt Report
                  </Button>

                </div>

              )}

            </CardContent>

          </Card>
        )}


        {/* ==================================================
            REPORTS
        ================================================== */}

        {activeTab ===
          "reports" && (

          <Card className="mt-5">

            <CardHeader className="flex-row items-center justify-between">

              <CardTitle>
                Reports & Interview Calls
              </CardTitle>


              <Button
                size="sm"
                variant="outline"
                onClick={
                  openFilePicker
                }
              >
                <Upload className="size-4" />
                Upload File
              </Button>

            </CardHeader>


            <CardContent className="px-0">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[760px] text-sm">

                  <thead>

                    <tr className="border-y bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">

                      <th className="px-6 py-3 font-medium">
                        Date
                      </th>

                      <th className="px-6 py-3 font-medium">
                        Type
                      </th>

                      <th className="px-6 py-3 font-medium">
                        Detail
                      </th>

                      <th className="px-6 py-3 text-center font-medium">
                        Action
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {uploadedReports.map(
                      (
                        report,
                      ) => (

                        <tr
                          key={
                            report.id
                          }
                          className="border-b border-border/70 last:border-0"
                        >

                          <td className="px-6 py-3 text-muted-foreground">
                            {
                              report.date
                            }
                          </td>


                          <td className="px-6 py-3">

                            <span className="rounded-full border bg-muted/60 px-2.5 py-0.5 text-xs">
                              {
                                report.type
                              }
                            </span>

                          </td>


                          <td className="px-6 py-3">
                            {getReportDetail(
                              report,
                            )}
                          </td>


                          <td className="px-6 py-3 text-center">

                            <button
                              type="button"
                              className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
                              onClick={() =>
                                openUploadedReport(
                                  report,
                                )
                              }
                              title="View file"
                            >
                              <Eye className="size-4" />
                            </button>

                          </td>

                        </tr>
                      ),
                    )}

                  </tbody>

                </table>

              </div>


              {uploadedReports.length ===
                0 && (

                <div className="border-t px-6 py-8 text-center">

                  <FileText className="mx-auto size-8 text-muted-foreground" />

                  <p className="mt-2 text-sm font-medium">
                    No uploaded files yet
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Upload an interview call image or report to add it here.
                  </p>

                </div>
              )}

            </CardContent>

          </Card>
        )}


        {/* ==================================================
            ACTIVITY
        ================================================== */}

        {activeTab ===
          "activity" && (

          <Card className="mt-5">

            <CardHeader>

              <CardTitle>
                Activity
              </CardTitle>

            </CardHeader>


            <CardContent>

              {(
                c.activity || []
              ).length > 0 ? (

                <div className="space-y-4">

                  {(
                    c.activity || []
                  ).map(
                    (
                      item,
                    ) => (

                      <div
                        key={
                          item.id
                        }
                        className="flex gap-4 border-b pb-4 last:border-0 last:pb-0"
                      >

                        <div className="mt-1 size-2 rounded-full bg-primary" />

                        <div>

                          <p className="text-sm">
                            {
                              item.text
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {
                              item.date
                            }
                          </p>

                        </div>

                      </div>
                    ),
                  )}

                </div>

              ) : (

                <p className="py-8 text-center text-sm text-muted-foreground">
                  No activity available yet.
                </p>

              )}

            </CardContent>

          </Card>
        )}


        {/* ==================================================
            HIDDEN FILE INPUTS
        ================================================== */}

        <input
          ref={
            fileInputRef
          }
          type="file"
          className="hidden"
          onChange={
            handleFileSelection
          }
        />


        <input
          ref={
            marFileInputRef
          }
          type="file"
          accept=".txt,.pdf,text/plain,application/pdf"
          className="hidden"
          onChange={
            handleMARUpload
          }
        />

      </Layout>


      {/* ==================================================
          UPLOAD MODAL
      ================================================== */}

      {uploadModalOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

    <div className="w-full max-w-lg rounded-2xl border bg-background shadow-2xl">

      {/* ======================================== */}
      {/* HEADER */}
      {/* ======================================== */}

      <div className="border-b px-6 py-5">

        <h2 className="text-xl font-semibold">
          Upload File
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Upload an interview call image or program report.
        </p>

      </div>


      {/* ======================================== */}
      {/* CONTENT */}
      {/* ======================================== */}

      <div className="space-y-5 p-6">

        {/* ======================================== */}
        {/* SELECT TYPE */}
        {/* ======================================== */}

        <div>

          <label className="text-sm font-medium">
            Upload Type
          </label>

          <select
            value={uploadType}
            onChange={(event) => {

              const value =
                event.target.value as ReportType;

              setUploadType(
                value,
              );

              setSelectedFile(
                null,
              );

              setCompanyName(
                "",
              );

              setRoleName(
                "",
              );

            }}
            className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >

            <option value="Interview Call">
              Interview Call
            </option>

            <option value="Report">
              Report
            </option>

          </select>

        </div>


        {/* ======================================== */}
        {/* INTERVIEW FIELDS */}
        {/* ======================================== */}

        {uploadType ===
          "Interview Call" && (
          <>

            <div>

              <label className="text-sm font-medium">
                Company Name
              </label>

              <input
                type="text"
                value={companyName}
                onChange={(event) =>
                  setCompanyName(
                    event.target.value,
                  )
                }
                placeholder="Enter company name"
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />

            </div>


            <div>

              <label className="text-sm font-medium">
                Role
              </label>

              <input
                type="text"
                value={roleName}
                onChange={(event) =>
                  setRoleName(
                    event.target.value,
                  )
                }
                placeholder="Enter job role"
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />

            </div>


            <div>

              <label className="text-sm font-medium">
                Upload Interview Call
              </label>

              <button
                type="button"
                onClick={
                  openUploadFileSelector
                }
                className="mt-2 flex min-h-[120px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition hover:bg-muted/50"
              >

                <Upload className="mb-3 size-8 text-muted-foreground" />

                <p className="text-sm font-medium">
                  Click to upload image
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  JPG, JPEG, PNG or WEBP only
                </p>

              </button>

            </div>

          </>
        )}


        {/* ======================================== */}
        {/* REPORT FIELDS */}
        {/* ======================================== */}

        {uploadType ===
          "Report" && (
          <>

            <div>

              <label className="text-sm font-medium">
                Report Type
              </label>

              <select
                value={reportType}
                onChange={(event) =>
                  setReportType(
                    event.target.value,
                  )
                }
                className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >

                <option value="15 Days Report">
                  15 Days Report
                </option>

                <option value="Monthly Report">
                  Monthly Report
                </option>

                <option value="Final Report">
                  Final Report
                </option>

              </select>

            </div>


            <div>

              <label className="text-sm font-medium">
                Upload Report
              </label>

              <button
                type="button"
                onClick={
                  openUploadFileSelector
                }
                className="mt-2 flex min-h-[120px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition hover:bg-muted/50"
              >

                <Upload className="mb-3 size-8 text-muted-foreground" />

                <p className="text-sm font-medium">
                  Click to upload PDF
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  PDF files only
                </p>

              </button>

            </div>

          </>
        )}


        {/* ======================================== */}
        {/* SELECTED FILE */}
        {/* ======================================== */}

        {selectedFile && (
          <div className="rounded-xl border bg-muted/40 p-4">

            <p className="text-xs text-muted-foreground">
              Selected File
            </p>

            <p className="mt-1 truncate text-sm font-medium">
              {selectedFile.name}
            </p>

          </div>
        )}


        {/* ======================================== */}
        {/* BUTTONS */}
        {/* ======================================== */}

        <div className="flex justify-end gap-3 pt-2">

          <Button
            variant="outline"
            onClick={
              closeUploadModal
            }
            disabled={
              uploading
            }
          >
            Cancel
          </Button>


          <Button
            onClick={
              saveUploadedFile
            }
            disabled={
              uploading ||
              !selectedFile
            }
          >

            <Upload className="size-4" />

            {uploading
              ? "Uploading..."
              : "Upload File"}

          </Button>

        </div>

      </div>

    </div>

  </div>
)}

{/* ======================================== */}
      {/* ADD APPLICATIONS MODAL */}
      {/* ======================================== */}

      {applicationModalOpen && (

        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border bg-background shadow-2xl">


            {/* HEADER */}

            <div className="flex items-start justify-between border-b px-6 py-5">

              <div>

                <h2 className="text-xl font-semibold">
                  Add Applications
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Record daily job applications for this candidate.
                </p>

              </div>


              <button
                type="button"
                disabled={savingApplications}
                onClick={() =>
                  setApplicationModalOpen(false)
                }
                className="rounded-md p-2 hover:bg-muted"
              >
                <X className="size-5" />
              </button>

            </div>


            {/* CONTENT */}

            <div className="space-y-5 p-6">


              {/* ERROR */}

              {applicationError && (

                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">

                  {applicationError}

                </div>

              )}


              {/* NUMBER OF APPLICATIONS */}

              <div>

                <label className="text-sm font-medium">
                  Number of Applications
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={applicationCount}
                  onChange={(event) =>
                    setApplicationCount(
                      event.target.value,
                    )
                  }
                  placeholder="Example: 10"
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />

              </div>


              {/* DATE */}

              <div>

                <label className="text-sm font-medium">
                  Date
                </label>

                <input
                  type="date"
                  value={applicationDate}
                  onChange={(event) =>
                    setApplicationDate(
                      event.target.value,
                    )
                  }
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />

              </div>


              {/* UPDATED BY */}

              <div>

                <label className="text-sm font-medium">
  Applied By
</label>

                <input
                  type="text"
                  value={applicationUpdatedBy}
                  onChange={(event) =>
                    setApplicationUpdatedBy(
                      event.target.value,
                    )
                  }
                  placeholder="Assigned specialist"
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />

              </div>


              {/* BUTTONS */}

              <div className="flex justify-end gap-3 pt-2">

                <Button
                  variant="outline"
                  disabled={savingApplications}
                  onClick={() =>
                    setApplicationModalOpen(false)
                  }
                >
                  Cancel
                </Button>


                <Button
                  onClick={
                    saveDailyApplications
                  }
                  disabled={
                    savingApplications
                  }
                >

                  <Plus className="size-4" />

                  {savingApplications
                    ? "Saving..."
                    : "Save Applications"}

                </Button>

              </div>


            </div>

          </div>

        </div>

      )}


      {/* ==================================================
          REPORT PREVIEW
      ================================================== */}

      {previewFile && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">

            <div className="flex shrink-0 items-center justify-between border-b px-5 py-3">

              <div className="flex min-w-0 items-center gap-3">

                <FileText className="size-5 shrink-0 text-muted-foreground" />

                <div className="min-w-0">

                  <p className="truncate text-sm font-medium">
                    {
                      previewFile.fileName
                    }
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {
                      previewFile.type
                    }
                  </p>

                </div>

              </div>


              <button
                type="button"
                className="rounded-md p-2 hover:bg-muted"
                onClick={() =>
                  setPreviewFile(
                    null,
                  )
                }
              >
                <X className="size-4" />
              </button>

            </div>


            <div className="min-h-0 flex-1 overflow-auto p-4">

              {previewFile.fileType.startsWith(
                "image/",
              ) && (

                <img
                  src={resolveFileUrl(
                    previewFile.fileUrl,
                  )}
                  alt={
                    previewFile.fileName
                  }
                  className="mx-auto max-h-full max-w-full rounded-lg"
                />

              )}


              {previewFile.fileType ===
                "application/pdf" && (

                <iframe
                  src={resolveFileUrl(
                    previewFile.fileUrl,
                  )}
                  title={
                    previewFile.fileName
                  }
                  className="h-full min-h-[70vh] w-full rounded-lg border bg-background"
                />

              )}


              {previewFile.fileType.startsWith(
                "text/",
              ) && (

                <iframe
                  src={resolveFileUrl(
                    previewFile.fileUrl,
                  )}
                  title={
                    previewFile.fileName
                  }
                  className="h-full min-h-[70vh] w-full rounded-lg border bg-background"
                />

              )}


              {!previewFile.fileType.startsWith(
                "image/",
              ) &&
                previewFile.fileType !==
                  "application/pdf" &&
                !previewFile.fileType.startsWith(
                  "text/",
                ) && (

                  <div className="flex min-h-full items-center justify-center">

                    <div className="text-center">

                      <FileText className="mx-auto size-12 text-muted-foreground" />

                      <p className="mt-3 text-sm font-medium">
                        Preview is not available for this file type.
                      </p>

                      <Button
                        className="mt-4"
                        asChild
                      >
                        <a
                          href={resolveFileUrl(
                            previewFile.fileUrl,
                          )}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open File
                        </a>
                      </Button>

                    </div>

                  </div>

                )}

            </div>


            <div className="flex shrink-0 justify-end border-t px-5 py-3">

              <Button
                variant="outline"
                onClick={() =>
                  setPreviewFile(
                    null,
                  )
                }
              >
                Close
              </Button>

            </div>

          </div>

        </div>
      )}


      {/* ==================================================
          MAR PREVIEW
      ================================================== */}

      {previewMAR && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">

            <div className="flex shrink-0 items-center justify-between border-b px-5 py-3">

              <div className="flex min-w-0 items-center gap-3">

                <FileText className="size-5 shrink-0 text-muted-foreground" />

                <div className="min-w-0">

                  <p className="truncate text-sm font-medium">
                    {
                      previewMAR.fileName
                    }
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Daily MAR Report ·{" "}
                    {
                      previewMAR.date
                    }
                  </p>

                </div>

              </div>


              <button
                type="button"
                className="rounded-md p-2 hover:bg-muted"
                onClick={() => {
                  setPreviewMAR(
                    null,
                  );

                  setMarContent(
                    "",
                  );
                }}
              >
                <X className="size-4" />
              </button>

            </div>


            <div className="min-h-0 flex-1 overflow-auto p-5">

              {loadingMAR ? (

                <p className="text-sm text-muted-foreground">
                  Loading MAR report...
                </p>

              ) : (

                <pre className="whitespace-pre-wrap break-words rounded-lg border bg-muted/20 p-5 text-sm leading-6">
                  {marContent ||
                    "No content available."}
                </pre>

              )}

            </div>


            <div className="flex shrink-0 justify-end border-t px-5 py-3">

              <Button
                variant="outline"
                onClick={() => {
                  setPreviewMAR(
                    null,
                  );

                  setMarContent(
                    "",
                  );
                }}
              >
                Close
              </Button>

            </div>

          </div>

        </div>
      )}

    </>
  );
}