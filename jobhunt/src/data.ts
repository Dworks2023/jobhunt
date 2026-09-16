export type Status =
  | "Active"
  | "Completed"
  | "Expiring Soon"
  | "Paused";

export type Plan = {
  id: string;
  name: string;
  durationMonths: number;
  credits: number;
  price: number;
  active: boolean;
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  domain: string;
  plan: string;
  experience: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  creditsTotal: number;
  creditsRemaining: number;
  status: Status;
  owner: string;
  location: string;
  targetRole: string;

  monthly: {
    month: string;
    applications: number;
    interviews: number;
    offers: number;
    progress: number;
    note: string;
  }[];

  reports: {
    id: string;
    date: string;
    type:
      | "Weekly Report"
      | "Interview Call"
      | "Monthly Review";
    title: string;
    company?: string;
    outcome: string;
  }[];

  feedback: {
    id: string;
    date: string;
    author: string;
    area: string;
    note: string;
    action: string;
  }[];

  activity: {
    id: string;
    date: string;
    text: string;
  }[];
};

/*
========================================
APPLICATION PLANS
========================================
*/

export const plans: Plan[] = [
  {
    id: "PL-01",
    name: "100 Applications",
    durationMonths: 3,
    credits: 100,
    price: 299,
    active: true,
  },
  {
    id: "PL-02",
    name: "250 Applications",
    durationMonths: 6,
    credits: 250,
    price: 549,
    active: true,
  },
  {
    id: "PL-03",
    name: "500 Applications",
    durationMonths: 9,
    credits: 500,
    price: 799,
    active: true,
  },
  {
    id: "PL-04",
    name: "1000 Applications",
    durationMonths: 12,
    credits: 1000,
    price: 1099,
    active: true,
  },
];

/*
========================================
DOMAINS
========================================
*/

export const domains = [
  "Data Analytics",
  "Software Engineering",
  "Cloud & DevOps",
  "Cybersecurity",
  "Product Management",
  "QA Automation",
];

/*
========================================
TEAM
========================================
*/

export const team = [
  {
    id: "T-1",
    name: "Aarav Menon",
    role: "Support Lead",
    email: "aarav@dworks.io",
    load: 14,
  },
  {
    id: "T-2",
    name: "Nadia Rahman",
    role: "Job Hunt Specialist",
    email: "nadia@dworks.io",
    load: 11,
  },
  {
    id: "T-3",
    name: "Tom Beckett",
    role: "Job Hunt Specialist",
    email: "tom@dworks.io",
    load: 9,
  },
  {
    id: "T-4",
    name: "Priya Kulkarni",
    role: "Reports Analyst",
    email: "priya@dworks.io",
    load: 7,
  },
];

const months = [
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
];

function makeMonthly(
  seed: number,
  count: number,
) {
  return months
    .slice(0, count)
    .map((month, i) => {
      const applications =
        18 + ((seed * (i + 3)) % 22);

      const interviews =
        2 + ((seed + i) % 6);

      const offers =
        i >= count - 2
          ? (seed + i) % 2
          : 0;

      return {
        month,
        applications,
        interviews,
        offers,

        progress: Math.min(
          100,
          45 + i * 9 + (seed % 10),
        ),

        note:
          offers > 0
            ? "Offer stage reached — negotiating compensation."
            : `Applied to ${applications} curated roles, ${interviews} screening calls booked.`,
      };
    });
}

/*
========================================
SAMPLE CANDIDATES

IMPORTANT:
Plan names must match the plans array above.
========================================
*/

const rawCandidates: Array<
  [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    number,
    number,
    Status,
    string,
    string,
    string,
  ]
> = [
  [
    "JH-1042",
    "Ishaan Verma",
    "ishaan.verma@gmail.com",
    "+91 98204 11223",
    "Data Analytics",
    "250 Applications",
    "4 yrs",
    92,
    250,
    "Active",
    "Aarav Menon",
    "Pune, IN",
    "Senior Data Analyst",
  ],

  [
    "JH-1043",
    "Meera Nair",
    "meera.nair@outlook.com",
    "+91 99870 55412",
    "Software Engineering",
    "500 Applications",
    "6 yrs",
    168,
    500,
    "Active",
    "Nadia Rahman",
    "Bengaluru, IN",
    "Backend Engineer",
  ],

  [
    "JH-1044",
    "Daniel Cruz",
    "daniel.cruz@proton.me",
    "+1 415 220 8871",
    "Cloud & DevOps",
    "100 Applications",
    "3 yrs",
    11,
    100,
    "Expiring Soon",
    "Tom Beckett",
    "Austin, US",
    "DevOps Engineer",
  ],

  [
    "JH-1045",
    "Sara Khalid",
    "sara.khalid@gmail.com",
    "+971 50 771 2210",
    "Cybersecurity",
    "250 Applications",
    "5 yrs",
    61,
    250,
    "Active",
    "Aarav Menon",
    "Dubai, AE",
    "SOC Analyst L2",
  ],

  [
    "JH-1046",
    "Rohit Bansal",
    "rohit.bansal@yahoo.com",
    "+91 90045 78120",
    "Product Management",
    "500 Applications",
    "8 yrs",
    0,
    500,
    "Completed",
    "Nadia Rahman",
    "Gurugram, IN",
    "Product Manager",
  ],

  [
    "JH-1047",
    "Elena Petrova",
    "elena.petrova@gmail.com",
    "+49 151 2244 9087",
    "QA Automation",
    "100 Applications",
    "2 yrs",
    24,
    100,
    "Active",
    "Tom Beckett",
    "Berlin, DE",
    "SDET",
  ],

  [
    "JH-1048",
    "Kwame Asante",
    "kwame.asante@gmail.com",
    "+44 7700 993 118",
    "Data Analytics",
    "250 Applications",
    "4 yrs",
    8,
    250,
    "Expiring Soon",
    "Priya Kulkarni",
    "London, UK",
    "Analytics Engineer",
  ],

  [
    "JH-1049",
    "Ananya Rao",
    "ananya.rao@gmail.com",
    "+91 98455 66021",
    "Software Engineering",
    "250 Applications",
    "3 yrs",
    118,
    250,
    "Active",
    "Nadia Rahman",
    "Hyderabad, IN",
    "Full Stack Engineer",
  ],

  [
    "JH-1050",
    "Marco Bianchi",
    "marco.bianchi@gmail.com",
    "+39 340 771 2299",
    "Cloud & DevOps",
    "500 Applications",
    "7 yrs",
    203,
    500,
    "Active",
    "Aarav Menon",
    "Milan, IT",
    "Platform Engineer",
  ],

  [
    "JH-1051",
    "Fatima Zahra",
    "fatima.zahra@gmail.com",
    "+212 661 220 118",
    "Cybersecurity",
    "100 Applications",
    "2 yrs",
    0,
    100,
    "Completed",
    "Priya Kulkarni",
    "Casablanca, MA",
    "Security Analyst",
  ],

  [
    "JH-1052",
    "Jonas Weber",
    "jonas.weber@gmail.com",
    "+49 170 556 2201",
    "Product Management",
    "250 Applications",
    "6 yrs",
    74,
    250,
    "Paused",
    "Tom Beckett",
    "Munich, DE",
    "Senior PM",
  ],

  [
    "JH-1053",
    "Divya Menon",
    "divya.menon@gmail.com",
    "+91 97411 30021",
    "QA Automation",
    "250 Applications",
    "5 yrs",
    133,
    250,
    "Active",
    "Nadia Rahman",
    "Kochi, IN",
    "QA Lead",
  ],
];

/*
========================================
START DATES
========================================
*/

const startDates = [
  "2026-03-02",
  "2026-02-16",
  "2025-12-01",
  "2026-03-18",
  "2025-09-05",
  "2026-04-08",
  "2025-11-20",
  "2026-05-11",
  "2026-01-26",
  "2025-08-14",
  "2026-02-02",
  "2026-04-27",
];

/*
========================================
GENERATE SAMPLE CANDIDATES
========================================
*/

export const candidates: Candidate[] =
  rawCandidates.map((c, i) => {
    const [
      id,
      name,
      email,
      phone,
      domain,
      plan,
      experience,
      creditsRemaining,
      creditsTotal,
      status,
      owner,
      location,
      targetRole,
    ] = c;

    /*
    Find matching plan.
    The fallback prevents the app
    from crashing if an old candidate
    has an invalid plan.
    */

    const planDef =
      plans.find(
        (p) => p.name === plan,
      ) ?? plans[0];

    const startDate =
      startDates[i] ?? startDates[0];

    const start =
      new Date(startDate);

    const end =
      new Date(start);

    end.setMonth(
      end.getMonth() +
        planDef.durationMonths,
    );

    const daysRemaining =
      status === "Completed"
        ? 0
        : Math.max(
            0,
            Math.round(
              (end.getTime() -
                new Date(
                  "2026-08-21",
                ).getTime()) /
                86400000,
            ),
          );

    const monthCount =
      status === "Completed"
        ? 6
        : 3 + (i % 4);

    return {
      id,
      name,
      email,
      phone,
      domain,
      plan,
      experience,

      startDate,

      endDate: end
        .toISOString()
        .slice(0, 10),

      daysRemaining,

      creditsTotal,

      creditsRemaining,

      status,

      owner,

      location,

      targetRole,

      monthly: makeMonthly(
        i + 2,
        monthCount,
      ),

      reports: [
        {
          id: `${id}-R1`,
          date: "2026-08-14",
          type: "Weekly Report",
          title:
            "Week 33 application summary",
          outcome:
            "12 applications, 3 recruiter replies",
        },
        {
          id: `${id}-R2`,
          date: "2026-08-11",
          type: "Interview Call",
          title: `${targetRole} — technical round`,
          company: "Nimbus Labs",
          outcome:
            "Cleared, moved to round 2",
        },
        {
          id: `${id}-R3`,
          date: "2026-08-04",
          type: "Interview Call",
          title: `${targetRole} — HR screening`,
          company: "Vertex Systems",
          outcome:
            "On hold — budget freeze",
        },
        {
          id: `${id}-R4`,
          date: "2026-07-30",
          type: "Monthly Review",
          title:
            "Month 4 review call",
          outcome:
            "Resume refreshed, target list expanded",
        },
      ],

      feedback: [
        {
          id: `${id}-F1`,
          date: "2026-08-12",
          author: owner,
          area: "Resume",
          note:
            "Impact metrics missing in last two roles.",
          action:
            "Rewrite bullets with measurable outcomes",
        },
        {
          id: `${id}-F2`,
          date: "2026-08-05",
          author:
            "Priya Kulkarni",
          area: "Interview",
          note:
            "System design answers lack structure.",
          action:
            "2 mock sessions scheduled",
        },
        {
          id: `${id}-F3`,
          date: "2026-07-22",
          author: owner,
          area: "Targeting",
          note:
            "Applying too broadly across seniority levels.",
          action:
            "Focus on mid-senior postings only",
        },
      ],

      activity: [
        {
          id: `${id}-A1`,
          date: "2026-08-20",
          text:
            "8 application credits used for curated applications",
        },
        {
          id: `${id}-A2`,
          date: "2026-08-18",
          text:
            "Interview call logged — Nimbus Labs",
        },
        {
          id: `${id}-A3`,
          date: "2026-08-15",
          text:
            "Monthly progress updated by " +
            owner,
        },
        {
          id: `${id}-A4`,
          date: startDate,
          text: `Enrolled in ${plan}`,
        },
      ],
    };
  });

/*
========================================
STATS
========================================
*/

export const stats = {
  total: candidates.length,

  active: candidates.filter(
    (c) => c.status === "Active",
  ).length,

  completed: candidates.filter(
    (c) => c.status === "Completed",
  ).length,

  expiring: candidates.filter(
    (c) =>
      c.status === "Expiring Soon",
  ).length,

  credits: candidates.reduce(
    (sum, candidate) =>
      sum +
      candidate.creditsRemaining,
    0,
  ),

  creditsTotal: candidates.reduce(
    (sum, candidate) =>
      sum +
      candidate.creditsTotal,
    0,
  ),
};

/*
========================================
ENROLLMENT TREND
========================================
*/

export const enrollmentTrend = [
  {
    month: "Mar",
    enrollments: 6,
  },
  {
    month: "Apr",
    enrollments: 9,
  },
  {
    month: "May",
    enrollments: 7,
  },
  {
    month: "Jun",
    enrollments: 12,
  },
  {
    month: "Jul",
    enrollments: 10,
  },
  {
    month: "Aug",
    enrollments: 14,
  },
];

/*
========================================
CREDIT USAGE
========================================
*/

export const creditUsage = [
  {
    month: "Mar",
    used: 180,
    issued: 320,
  },
  {
    month: "Apr",
    used: 240,
    issued: 380,
  },
  {
    month: "May",
    used: 210,
    issued: 300,
  },
  {
    month: "Jun",
    used: 320,
    issued: 460,
  },
  {
    month: "Jul",
    used: 290,
    issued: 410,
  },
  {
    month: "Aug",
    used: 355,
    issued: 520,
  },
];

/*
========================================
ANALYTICS
========================================
*/

export const byPlan = plans.map(
  (plan) => ({
    name: plan.name,

    value: candidates.filter(
      (candidate) =>
        candidate.plan ===
        plan.name,
    ).length,
  }),
);

export const byDomain =
  domains.map((domain) => ({
    name: domain,

    value: candidates.filter(
      (candidate) =>
        candidate.domain ===
        domain,
    ).length,
  }));

export const byStatus = (
  [
    "Active",
    "Completed",
    "Expiring Soon",
    "Paused",
  ] as Status[]
).map((status) => ({
  name: status,

  value: candidates.filter(
    (candidate) =>
      candidate.status === status,
  ).length,
}));

/*
========================================
GET CANDIDATE
========================================
*/

export function getCandidate(
  id: string,
) {
  return candidates.find(
    (candidate) =>
      candidate.id === id,
  );
}