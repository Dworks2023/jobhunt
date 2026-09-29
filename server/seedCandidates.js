import dns from "node:dns";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);

const candidates = [
  {
    id: "JH-1042",
    name: "Ishaan Verma",
    email: "ishaan.verma@gmail.com",
    phone: "+91 98204 11223",
    domain: "Data Analytics",
    plan: "Growth",
    experience: "4 yrs",
    startDate: "2026-03-02",
    endDate: "2026-09-02",
    daysRemaining: 12,
    creditsTotal: 150,
    creditsRemaining: 92,
    status: "Active",
    owner: "Aarav Menon",
    location: "Pune, IN",
    targetRole: "Senior Data Analyst",
  },
  {
    id: "JH-1043",
    name: "Meera Nair",
    email: "meera.nair@outlook.com",
    phone: "+91 99870 55412",
    domain: "Software Engineering",
    plan: "Premium",
    experience: "6 yrs",
    startDate: "2026-02-16",
    endDate: "2026-11-16",
    daysRemaining: 72,
    creditsTotal: 260,
    creditsRemaining: 168,
    status: "Active",
    owner: "Nadia Rahman",
    location: "Bengaluru, IN",
    targetRole: "Backend Engineer",
  },
  {
    id: "JH-1044",
    name: "Daniel Cruz",
    email: "daniel.cruz@proton.me",
    phone: "+1 415 220 8871",
    domain: "Cloud & DevOps",
    plan: "Starter",
    experience: "3 yrs",
    startDate: "2025-12-01",
    endDate: "2026-03-01",
    daysRemaining: 0,
    creditsTotal: 60,
    creditsRemaining: 11,
    status: "Expiring Soon",
    owner: "Tom Beckett",
    location: "Austin, US",
    targetRole: "DevOps Engineer",
  },
  {
    id: "JH-1045",
    name: "Sara Khalid",
    email: "sara.khalid@gmail.com",
    phone: "+971 50 771 2210",
    domain: "Cybersecurity",
    plan: "Growth",
    experience: "5 yrs",
    startDate: "2026-03-18",
    endDate: "2026-09-18",
    daysRemaining: 28,
    creditsTotal: 150,
    creditsRemaining: 61,
    status: "Active",
    owner: "Aarav Menon",
    location: "Dubai, AE",
    targetRole: "SOC Analyst L2",
  },
  {
    id: "JH-1046",
    name: "Rohit Bansal",
    email: "rohit.bansal@yahoo.com",
    phone: "+91 90045 78120",
    domain: "Product Management",
    plan: "Premium",
    experience: "8 yrs",
    startDate: "2025-09-05",
    endDate: "2026-06-05",
    daysRemaining: 0,
    creditsTotal: 260,
    creditsRemaining: 0,
    status: "Completed",
    owner: "Nadia Rahman",
    location: "Gurugram, IN",
    targetRole: "Product Manager",
  },
  {
    id: "JH-1047",
    name: "Elena Petrova",
    email: "elena.petrova@gmail.com",
    phone: "+49 151 2244 9087",
    domain: "QA Automation",
    plan: "Starter",
    experience: "2 yrs",
    startDate: "2026-04-08",
    endDate: "2026-07-08",
    daysRemaining: 0,
    creditsTotal: 60,
    creditsRemaining: 24,
    status: "Active",
    owner: "Tom Beckett",
    location: "Berlin, DE",
    targetRole: "SDET",
  },
  {
    id: "JH-1048",
    name: "Kwame Asante",
    email: "kwame.asante@gmail.com",
    phone: "+44 7700 993 118",
    domain: "Data Analytics",
    plan: "Growth",
    experience: "4 yrs",
    startDate: "2025-11-20",
    endDate: "2026-05-20",
    daysRemaining: 0,
    creditsTotal: 150,
    creditsRemaining: 8,
    status: "Expiring Soon",
    owner: "Priya Kulkarni",
    location: "London, UK",
    targetRole: "Analytics Engineer",
  },
  {
    id: "JH-1049",
    name: "Ananya Rao",
    email: "ananya.rao@gmail.com",
    phone: "+91 98455 66021",
    domain: "Software Engineering",
    plan: "Growth",
    experience: "3 yrs",
    startDate: "2026-05-11",
    endDate: "2026-11-11",
    daysRemaining: 67,
    creditsTotal: 150,
    creditsRemaining: 118,
    status: "Active",
    owner: "Nadia Rahman",
    location: "Hyderabad, IN",
    targetRole: "Full Stack Engineer",
  },
  {
    id: "JH-1050",
    name: "Marco Bianchi",
    email: "marco.bianchi@gmail.com",
    phone: "+39 340 771 2299",
    domain: "Cloud & DevOps",
    plan: "Premium",
    experience: "7 yrs",
    startDate: "2026-01-26",
    endDate: "2026-10-26",
    daysRemaining: 51,
    creditsTotal: 260,
    creditsRemaining: 203,
    status: "Active",
    owner: "Aarav Menon",
    location: "Milan, IT",
    targetRole: "Platform Engineer",
  },
  {
    id: "JH-1051",
    name: "Fatima Zahra",
    email: "fatima.zahra@gmail.com",
    phone: "+212 661 220 118",
    domain: "Cybersecurity",
    plan: "Starter",
    experience: "2 yrs",
    startDate: "2025-08-14",
    endDate: "2025-11-14",
    daysRemaining: 0,
    creditsTotal: 60,
    creditsRemaining: 0,
    status: "Completed",
    owner: "Priya Kulkarni",
    location: "Casablanca, MA",
    targetRole: "Security Analyst",
  },
  {
    id: "JH-1052",
    name: "Jonas Weber",
    email: "jonas.weber@gmail.com",
    phone: "+49 170 556 2201",
    domain: "Product Management",
    plan: "Growth",
    experience: "6 yrs",
    startDate: "2026-02-02",
    endDate: "2026-08-02",
    daysRemaining: 0,
    creditsTotal: 150,
    creditsRemaining: 74,
    status: "Paused",
    owner: "Tom Beckett",
    location: "Munich, DE",
    targetRole: "Senior PM",
  },
  {
    id: "JH-1053",
    name: "Divya Menon",
    email: "divya.menon@gmail.com",
    phone: "+91 97411 30021",
    domain: "QA Automation",
    plan: "Growth",
    experience: "5 yrs",
    startDate: "2026-04-27",
    endDate: "2026-10-27",
    daysRemaining: 52,
    creditsTotal: 150,
    creditsRemaining: 133,
    status: "Active",
    owner: "Nadia Rahman",
    location: "Kochi, IN",
    targetRole: "QA Lead",
  },
];

async function seedDatabase() {
  try {
    await client.connect();

    const db = client.db("jobhunt");
    const collection = db.collection("candidates");

    // Remove existing candidates before inserting demo data.
    await collection.deleteMany({});

    const candidatesWithDates = candidates.map((candidate) => ({
      ...candidate,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await collection.insertMany(candidatesWithDates);

    console.log("=================================");
    console.log("MongoDB seeding completed");
    console.log(`Candidates inserted: ${result.insertedCount}`);
    console.log("Database: jobhunt");
    console.log("Collection: candidates");
    console.log("=================================");
  } catch (error) {
    console.error("Failed to seed database:", error);
  } finally {
    await client.close();
  }
}

seedDatabase();