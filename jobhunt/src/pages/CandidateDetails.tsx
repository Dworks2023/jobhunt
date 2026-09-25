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
  Send,
  Video,
  Trophy,
  CheckCircle2,
  BriefcaseBusiness,
  UserRound,
  CalendarDays,
  Layers,
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

  programDays?: number;

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

  uploadedBy?: string;

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
  updatedBy?: string;
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

function getProgramEndDate(
  startDate?: string,
  programDays?: number,
): string {
  if (!startDate || !programDays || programDays < 1) {
    return "-";
  }

  const [year, month, day] = startDate
    .slice(0, 10)
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return "-";
  }

  const endDate = new Date(year, month - 1, day);

  // Include the start date as the first program day
  endDate.setDate(endDate.getDate() + programDays - 1);

  const endYear = endDate.getFullYear();
  const endMonth = String(endDate.getMonth() + 1).padStart(2, "0");
  const endDay = String(endDate.getDate()).padStart(2, "0");

  return `${endYear}-${endMonth}-${endDay}`;
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


      programDays:
  Number(
    candidate?.programDays ??
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


    uploadedBy:
      report?.uploadedBy ||
      report?.updatedBy ||
      "",    

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


    updatedBy:
  report?.updatedBy ||
  report?.uploadedBy ||
  "",    

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

  const [applicationsPage, setApplicationsPage] = useState(1);
const applicationsPerPage = 8;

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

   


    const [reportsPage, setReportsPage] = useState(1);
const reportsPerPage = 8;


    const [uploadedBy, setUploadedBy] = useState("");

  const [
    uploadedMARReports,
    setUploadedMARReports,
  ] =
    useState<
      UploadedMARReport[]
    >([]);

    // MAR Pagination

    const [marPage, setMarPage] = useState(1);
const marPerPage = 8;

// MAR Upload Modal States
    const [isMARModalOpen, setIsMARModalOpen] = useState(false);

const [marUpdatedBy, setMarUpdatedBy] = useState("");

const [marSelectedFile, setMarSelectedFile] = useState<File | null>(null);

const [isMARUploading, setIsMARUploading] = useState(false);


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

    const result = await addDailyApplications(
  candidateId,
  {
    applications,
    date: applicationDate,
    updatedBy:
      applicationUpdatedBy.trim() ||
      candidate?.owner ||
      candidate?.assignedSpecialist ||
      "Unassigned",
  }
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

          daysRemaining:
             result.daysRemaining,
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

    if (!uploadedBy.trim()) {
    alert("Please enter Updated By name.");
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

    formData.append(
  "uploadedBy",
  uploadedBy.trim(),
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

    setReportsPage(1);

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
  setMarUpdatedBy("");
  setMarSelectedFile(null);
  setIsMARModalOpen(true);
}


  /*
  |--------------------------------------------------------------------------
  | UPLOAD MAR
  |--------------------------------------------------------------------------
  */


async function handleMARUpload() {
  if (!candidateId) {
    alert("Candidate ID is missing.");
    return;
  }

  if (!marUpdatedBy.trim()) {
    alert("Please enter your name.");
    return;
  }

  if (!marSelectedFile) {
    alert("Please select a PDF file.");
    return;
  }

  if (
  !marSelectedFile.name
    .toLowerCase()
    .endsWith(".txt")
) {
  alert("Please upload a TXT file.");
  return;
}

  const file = marSelectedFile;

  setIsMARUploading(true);

  try {
    const formData = new FormData();

    formData.append("file", file);
    formData.append(
      "updatedBy",
      marUpdatedBy.trim()
    );
    formData.append("uploadType", "mar");

    const response = await fetch(
      `${API_BASE_URL}/api/candidates/${candidateId}/mar`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        errorText ||
          `MAR upload failed (${response.status})`
      );
    }

    const data = await response.json();

    const newMARReport = {
  ...normalizeMARReport(data),
  updatedBy:
    data?.updatedBy ||
    data?.report?.updatedBy ||
    marUpdatedBy.trim(),
};

    newMARReport.fileUrl =
      resolveFileUrl(newMARReport.fileUrl);

    // Add the uploaded report to the table
    setUploadedMARReports((previous) => [
      newMARReport,
      ...previous,
    ]);

    setMarPage(1);

    // Close the modal and clear fields
    setIsMARModalOpen(false);
    setMarUpdatedBy("");
    setMarSelectedFile(null);

    alert(`${file.name} uploaded successfully.`);
  } catch (err) {
    console.error("MAR upload error:", err);

    alert(
      err instanceof Error
        ? err.message
        : "Unable to upload the MAR report."
    );
  } finally {
    setIsMARUploading(false);
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
        variant="outline"
        size="default"
        className="group mt-6 h-11 rounded-xl border-border/70 bg-card px-4 shadow-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow-md"
        asChild
      >
        <Link
  to="/candidates"
  className="group mt-6 inline-flex h-12 items-center gap-3 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 px-5 text-sm font-semibold text-emerald-400 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-500 hover:text-white hover:shadow-lg"
>
  <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/20 transition-colors group-hover:bg-white/20">
    <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1" />
  </span>

  <span>Back to Candidates</span>
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


    /*
|-----------------------------------------
| UPLOADED INTERVIEW AND REPORT COUNTS
|-----------------------------------------
*/

const interviewCallsCount =
  uploadedReports.filter(
    (item) => item.type === "Interview Call"
  ).length;

const reportsCount =
  uploadedReports.filter(
    (item) => item.type === "Report"
  ).length;


  // ADD PAGINATION CODE HERE
const totalReportsPages = Math.ceil(
  uploadedReports.length / reportsPerPage
);

const paginatedReports = uploadedReports.slice(
  (reportsPage - 1) * reportsPerPage,
  reportsPage * reportsPerPage
);

// ADD DAILY MAR PAGINATION HERE

const totalMARPages = Math.ceil(
  uploadedMARReports.length / marPerPage
);

const paginatedMARReports = uploadedMARReports.slice(
  (marPage - 1) * marPerPage,
  marPage * marPerPage
);

const totalApplicationsPages = Math.ceil(
  applicationHistory.length / applicationsPerPage
);

const paginatedApplications = applicationHistory.slice(
  (applicationsPage - 1) * applicationsPerPage,
  applicationsPage * applicationsPerPage
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


          
        </div>


       {/* ==================================================
    OVERVIEW
================================================== */}

{activeTab === "overview" && (
  <div className="mt-5 space-y-6">

    {/* ================================================
        PROGRAM PERFORMANCE
    ================================================= */}

    <div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          Program Performance
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Overall job hunt progress and results.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* APPLICATIONS */}

        <Card className="rounded-xl">
          <CardContent className="p-5">

            <div className="flex items-start justify-between">

              <p className="text-sm text-muted-foreground">
                Applications
              </p>

              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500">
                <Send className="size-5" />
              </div>

            </div>

            <p className="mt-1 text-3xl font-semibold">
  {creditsRemaining} / {creditsTotal}
</p>

<p className="mt-3 text-xs text-muted-foreground">
  Applications remaining / Total plan
</p>

          </CardContent>
        </Card>


        {/* INTERVIEWS */}

        <Card className="rounded-xl">
          <CardContent className="p-5">

            <div className="flex items-start justify-between">

              <p className="text-sm text-muted-foreground">
                Interviews
              </p>

              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-500">
                <Video className="size-5" />
              </div>

            </div>

            <p className="mt-1 text-3xl font-semibold">
              {interviewCallsCount}
            </p>

            <p className="mt-3 text-xs text-muted-foreground">
              Interview calls
            </p>

          </CardContent>
        </Card>


        {/* OFFERS */}

        <Card className="rounded-xl">
          <CardContent className="p-5">

            <div className="flex items-start justify-between">

              <p className="text-sm text-muted-foreground">
                Offers
              </p>

              <div className="rounded-xl bg-amber-500/10 p-3 text-amber-500">
                <Trophy className="size-5" />
              </div>

            </div>

            <p className="mt-1 text-3xl font-semibold">
              {totals.offers}
            </p>

            <p className="mt-3 text-xs text-muted-foreground">
              Offers received
            </p>

          </CardContent>
        </Card>


        {/* REPORTS */}

        <Card className="rounded-xl">
          <CardContent className="p-5">

            <div className="flex items-start justify-between">

              <p className="text-sm text-muted-foreground">
                Reports
              </p>

              <div className="rounded-xl bg-purple-500/10 p-3 text-purple-500">
                <FileText className="size-5" />
              </div>

            </div>

            <p className="mt-1 text-3xl font-semibold">
              {reportsCount}
            </p>

            <p className="mt-3 text-xs text-muted-foreground">
              Uploaded reports
            </p>

          </CardContent>
        </Card>

      </div>

    </div>


    {/* ================================================
        CANDIDATE INFORMATION + PROGRAM OVERVIEW
    ================================================= */}

    <div className="grid gap-5 xl:grid-cols-3">

      {/* ================================================
          CANDIDATE INFORMATION
      ================================================= */}

      <Card className="overflow-hidden rounded-xl xl:col-span-2">

        <CardHeader className="border-b px-6 py-5">

          <CardTitle>
            Candidate Information
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Contact and professional details
          </p>

        </CardHeader>


        <CardContent className="p-5">

          <div className="grid gap-3 sm:grid-cols-2">

            {/* EMAIL */}

            <div className="flex items-center gap-3 rounded-xl border p-4">

              <div className="shrink-0 rounded-lg bg-blue-500/10 p-3 text-blue-500">
                <Mail className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Email
                </p>

                <p className="mt-1 break-all text-sm font-medium">
                  {c.email || "-"}
                </p>
              </div>

            </div>


            {/* PHONE */}

            <div className="flex items-center gap-3 rounded-xl border p-4">

              <div className="shrink-0 rounded-lg bg-emerald-500/10 p-3 text-emerald-500">
                <Phone className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Phone
                </p>

                <p className="mt-1 text-sm font-medium">
                  {c.phone || "-"}
                </p>
              </div>

            </div>


            {/* LOCATION */}

            <div className="flex items-center gap-3 rounded-xl border p-4">

              <div className="shrink-0 rounded-lg bg-rose-500/10 p-3 text-rose-500">
                <MapPin className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Location
                </p>

                <p className="mt-1 text-sm font-medium">
                  {c.location || "-"}
                </p>
              </div>

            </div>


            {/* EXPERIENCE */}

            <div className="flex items-center gap-3 rounded-xl border p-4">

              <div className="shrink-0 rounded-lg bg-amber-500/10 p-3 text-amber-500">
                <BriefcaseBusiness className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Experience
                </p>

                <p className="mt-1 text-sm font-medium">
                  {c.experience || "-"}
                </p>
              </div>

            </div>


            {/* DOMAIN */}

            <div className="flex items-center gap-3 rounded-xl border p-4">

              <div className="shrink-0 rounded-lg bg-purple-500/10 p-3 text-purple-500">
                <Layers className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Domain
                </p>

                <p className="mt-1 text-sm font-medium">
                  {c.domain || "-"}
                </p>
              </div>

            </div>


            {/* TARGET ROLE */}

            <div className="flex items-center gap-3 rounded-xl border p-4">

              <div className="shrink-0 rounded-lg bg-cyan-500/10 p-3 text-cyan-500">
                <Target className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Target Role
                </p>

                <p className="mt-1 text-sm font-medium">
                  {c.targetRole || "-"}
                </p>
              </div>

            </div>


            {/* ASSIGNED SPECIALIST */}

            <div className="flex items-center gap-3 rounded-xl border p-4">

              <div className="shrink-0 rounded-lg bg-fuchsia-500/10 p-3 text-fuchsia-500">
                <UserRound className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Assigned Specialist
                </p>

                <p className="mt-1 text-sm font-medium">
                  {c.owner ||
                    c.assignedSpecialist ||
                    "Unassigned"}
                </p>
              </div>

            </div>


            {/* APPLICATIONS REMAINING */}

            <div className="flex items-center gap-3 rounded-xl border p-4">

              <div className="shrink-0 rounded-lg bg-orange-500/10 p-3 text-orange-500">
                <Coins className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Applications Remaining
                </p>

                <p className="mt-1 text-sm font-medium">
                  {creditsRemaining} / {creditsTotal}
                </p>
              </div>

            </div>

          </div>

        </CardContent>

      </Card>


      {/* ================================================
          PROGRAM OVERVIEW
      ================================================= */}

      <Card className="h-fit overflow-hidden rounded-xl">

        <CardHeader className="border-b px-6 py-5">

          <div className="flex items-center justify-between">

            <div>
              <CardTitle>
                Program Overview
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Subscription and application status
              </p>
            </div>

            <CheckCircle2 className="size-5 text-emerald-500" />

          </div>

        </CardHeader>


        <CardContent className="space-y-5 p-5">

          {/* APPLICATION PROGRESS */}

          <div className="rounded-xl border p-4">

            <p className="text-xs font-medium uppercase text-muted-foreground">
              Applications
            </p>

            <div className="mt-2 flex items-end justify-between gap-3">

              <div>
                <p className="text-2xl font-semibold">
                  {creditsRemaining}
                </p>

                <p className="text-sm text-muted-foreground">
                  remaining
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                {creditsRemaining} / {creditsTotal}
              </p>

            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">

              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${creditPercentage}%`,
                }}
              />

            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              {creditPercentage.toFixed(0)}% of plan remaining
            </p>

          </div>


          {/* START DATE + END DATE */}

          <div className="grid grid-cols-2 gap-3">

            <div className="rounded-xl border p-3">

              <div className="flex items-center gap-2 text-muted-foreground">

                <CalendarDays className="size-4" />

                <p className="text-xs">
                  Start Date
                </p>

              </div>

              <p className="mt-2 break-words text-sm font-medium">
                {c.startDate || "-"}
              </p>

            </div>


            <div className="rounded-xl border p-3">

              <div className="flex items-center gap-2 text-muted-foreground">

                <CalendarDays className="size-4" />

                <p className="text-xs">
                  End Date
                </p>

              </div>

              <p className="mt-2 break-words text-sm font-medium">
                {c.endDate ||
  getProgramEndDate(
    c.startDate,
    c.programDays
  )}
              </p>

            </div>

          </div>


          {/* DAYS REMAINING + STATUS */}

          <div className="rounded-xl border p-4">

            <div className="flex items-center justify-between gap-3">

              <div>

                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Days Remaining
                </p>

                <p className="mt-2 text-xl font-semibold">
                  {c.daysRemaining ?? 0}
                </p>

              </div>

              <StatusBadge
                status={c.status || "Active"}
              />

            </div>

          </div>


          {/* NOTES */}

          {c.notes && (

            <div className="border-t pt-4">

              <p className="text-xs font-medium uppercase text-muted-foreground">
                Notes
              </p>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
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
  {applicationHistory.length > 0 ? (
    <>
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
            {paginatedApplications.map((item) => (
              <tr
                key={
                  item.id ||
                  item._id ||
                  `${item.date}-${item.applications}`
                }
                className="border-b border-border/70 last:border-0"
              >
                <td className="px-6 py-4">
                  {item.date}
                </td>

                <td className="px-6 py-4">
                  <span className="font-semibold">
                    {item.applications}
                  </span>
                </td>

                <td className="px-6 py-4 text-muted-foreground">
                  {item.updatedBy || "Unassigned"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* APPLICATIONS PAGINATION */}
      {applicationHistory.length > applicationsPerPage && (
        <div className="flex items-center justify-between mt-4 px-6">
          <p className="text-sm text-muted-foreground">
            Page {applicationsPage} of {totalApplicationsPages}
            {" · "}
            {applicationHistory.length} application records
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={applicationsPage === 1}
              onClick={() =>
                setApplicationsPage((prev) =>
                  Math.max(1, prev - 1)
                )
              }
            >
              Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={
                applicationsPage >= totalApplicationsPages
              }
              onClick={() =>
                setApplicationsPage((prev) =>
                  Math.min(
                    totalApplicationsPages,
                    prev + 1
                  )
                )
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
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
            new Date().toISOString().split("T")[0]
          );

          setApplicationUpdatedBy(
            candidate?.owner ||
            candidate?.assignedSpecialist ||
            ""
          );

          setApplicationModalOpen(true);
        }}
      >
        <Plus className="size-4" />
        Add Applications
      </Button>
    </div>
  )}
</CardContent>

    </Card>


  </div>

)}


        {/* ==================================================
            DAILY MAR
        ================================================== */}

       
   

{activeTab === "daily-mar" && (
  <Card className="mt-5">
    <CardHeader className="flex-row items-center justify-between">
      <div>
        <CardTitle>Daily MAR Report</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload today's MAR report and enter the uploader's name.
        </p>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setMarUpdatedBy("");
          setMarSelectedFile(null);
          setIsMARModalOpen(true);
        }}
      >
        <Upload className="size-4" />
        Upload MAR Report
      </Button>
    </CardHeader>

    <CardContent className="px-0">
  {uploadedMARReports.length > 0 ? (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px] text-sm">
          <thead>
            <tr className="border-y bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Updated By</th>
              <th className="px-6 py-3 font-medium">Report</th>
              <th className="px-6 py-3 text-center font-medium">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {paginatedMARReports.map((report) => (
              <tr
                key={report.id}
                className="border-b border-border/70 last:border-0"
              >
                <td className="whitespace-nowrap px-6 py-3 text-muted-foreground">
                  {report.date || "-"}
                </td>

                <td className="whitespace-nowrap px-6 py-3">
                  <span className="font-medium">
                    {report.updatedBy || "-"}
                  </span>
                </td>

                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />

                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {report.fileName}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Daily MAR Report • PDF
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-3 text-center">
                  <button
                    type="button"
                    className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
                    onClick={() => openMARReport(report)}
                    title="View MAR report"
                  >
                    <Eye className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DAILY MAR PAGINATION START */}
      {uploadedMARReports.length > marPerPage && (
        <div className="mt-4 flex items-center justify-between px-6">
          <p className="text-sm text-muted-foreground">
            Page {marPage} of {totalMARPages}
            {" · "}
            {uploadedMARReports.length} MAR reports
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={marPage === 1}
              onClick={() =>
                setMarPage((prev) => Math.max(1, prev - 1))
              }
            >
              Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={marPage >= totalMARPages}
              onClick={() =>
                setMarPage((prev) =>
                  Math.min(totalMARPages, prev + 1)
                )
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
      {/* DAILY MAR PAGINATION END */}
    </>
  ) : (
    <div className="border-t px-6 py-10 text-center">
      <FileText className="mx-auto size-10 text-muted-foreground" />

      <p className="mt-3 text-sm font-medium">
        No Daily MAR reports uploaded
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        Upload today's PDF report.
      </p>

      <Button
        className="mt-4"
        variant="outline"
        onClick={() => {
          setMarUpdatedBy("");
          setMarSelectedFile(null);
          setIsMARModalOpen(true);
        }}
      >
        <Upload className="size-4" />
        Upload MAR Report
      </Button>
    </div>
  )}
</CardContent>

    {/* UPLOAD MAR MODAL */}
    {isMARModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Upload Daily MAR
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your name and select the MAR PDF.
              </p>
            </div>

            <button
              type="button"
              className="rounded-md p-2 hover:bg-muted"
              onClick={() => setIsMARModalOpen(false)}
              disabled={isMARUploading}
              title="Close"
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* NAME FIELD */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Updated By (Name) *
              </label>

              <input
                type="text"
                value={marUpdatedBy}
                onChange={(e) => setMarUpdatedBy(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* PDF FILE FIELD */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
  Upload Daily MAR Text File *
</label>

              <input
  type="file"
  accept=".txt,text/plain"
  onChange={(e) => {
    const file = e.target.files?.[0];

    if (
      file &&
      !file.name.toLowerCase().endsWith(".txt")
    ) {
      alert("Please select a TXT file.");
      e.target.value = "";
      setMarSelectedFile(null);
      return;
    }

    setMarSelectedFile(file || null);
  }}
  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
  required
/>

              {marSelectedFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {marSelectedFile.name}
                </p>
              )}
            </div>
          </div>

          {/* MODAL ACTIONS */}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isMARUploading}
              onClick={() => setIsMARModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={
                isMARUploading ||
                !marUpdatedBy.trim() ||
                !marSelectedFile
              }
             onClick={handleMARUpload}
            >
              {isMARUploading ? "Uploading..." : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    )}
  </Card>
)}


        {/* ==================================================
            REPORTS
        ================================================== */}

       
{activeTab === "reports" && (
  <Card className="mt-5">
    <CardHeader className="flex-row items-center justify-between">
      <CardTitle>Reports & Interview Calls</CardTitle>

      <Button
        size="sm"
        variant="outline"
        onClick={openFilePicker}
      >
        <Upload className="size-4" />
        Upload File
      </Button>
    </CardHeader>

    <CardContent className="px-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
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

              <th className="px-6 py-3 font-medium">
                Uploaded By
              </th>

              <th className="px-6 py-3 text-center font-medium">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
           {paginatedReports.map((report) => (
              <tr
                key={report.id}
                className="border-b border-border/70 last:border-0"
              >
                <td className="px-6 py-3 text-muted-foreground">
                  {report.date}
                </td>

                <td className="px-6 py-3">
                  <span className="rounded-full border bg-muted/60 px-2.5 py-0.5 text-xs">
                    {report.type}
                  </span>
                </td>

                <td className="px-6 py-3">
                  {getReportDetail(report)}
                </td>

                <td className="px-6 py-3">
                  <span className="font-medium">
                   {report.uploadedBy ||
    report.updatedBy ||
    "—"}
                  </span>
                </td>

                <td className="px-6 py-3 text-center">
                  <button
                    type="button"
                    className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted"
                    onClick={() => openUploadedReport(report)}
                    title="View file"
                  >
                    <Eye className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>



      {/* PAGINATION START */}
      {uploadedReports.length > 8 && (
        <div className="flex items-center justify-between mt-4 px-6">
          <p className="text-sm text-muted-foreground">
            Page {reportsPage} of {totalReportsPages}
            {" · "}
            {uploadedReports.length} reports
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={reportsPage === 1}
              onClick={() =>
                setReportsPage((prev) => Math.max(1, prev - 1))
              }
            >
              Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={reportsPage >= totalReportsPages}
              onClick={() =>
                setReportsPage((prev) =>
                  Math.min(totalReportsPages, prev + 1)
                )
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
      {/* PAGINATION END */}

     

      {uploadedReports.length === 0 && (
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

      {/* HEADER */}

      <div className="border-b px-6 py-5">

        <h2 className="text-xl font-semibold">
          Upload File
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Upload an interview call image or program report.
        </p>

      </div>

      {/* CONTENT */}

      <div className="space-y-5 p-6">

        {/* SELECT TYPE */}

        <div>

          <label className="text-sm font-medium">
            Upload Type
          </label>

          <select
            value={uploadType}
            onChange={(event) => {

              const value =
                event.target.value as ReportType;

              setUploadType(value);

              setSelectedFile(null);

              setCompanyName("");

              setRoleName("");

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

        {/* INTERVIEW FIELDS */}

        {uploadType === "Interview Call" && (
          <>

            <div>

              <label className="text-sm font-medium">
                Company Name
              </label>

              <input
                type="text"
                value={companyName}
                onChange={(event) =>
                  setCompanyName(event.target.value)
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
                  setRoleName(event.target.value)
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
                onClick={openUploadFileSelector}
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

        {/* REPORT FIELDS */}

        {uploadType === "Report" && (
          <>

            <div>

              <label className="text-sm font-medium">
                Report Type
              </label>

              <select
                value={reportType}
                onChange={(event) =>
                  setReportType(event.target.value)
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
                onClick={openUploadFileSelector}
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

        {/* UPDATED BY - COMMON FOR BOTH TYPES */}

        <div className="space-y-2">

          <label
            htmlFor="uploadedBy"
            className="text-sm font-medium"
          >
            Updated By <span className="text-destructive">*</span>
          </label>

          <input
            id="uploadedBy"
            type="text"
            value={uploadedBy}
            onChange={(event) =>
              setUploadedBy(event.target.value)
            }
            placeholder="Enter the name of the person updating"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            required
          />

        </div>

        {/* SELECTED FILE */}

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

        {/* BUTTONS */}

        <div className="flex justify-end gap-3 pt-2">

          <Button
            variant="outline"
            onClick={closeUploadModal}
            disabled={uploading}
          >
            Cancel
          </Button>

          <Button
            onClick={saveUploadedFile}
            disabled={
              uploading ||
              !selectedFile ||
              !uploadedBy.trim()
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