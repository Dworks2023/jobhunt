import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import CandidateDetails from "./pages/CandidateDetails";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard */}
        <Route
          path="/"
          element={<Dashboard />}
        />

        {/* Candidates */}
        <Route
          path="/candidates"
          element={<Candidates />}
        />

        {/* Candidate Details */}
        <Route
          path="/candidates/:candidateId"
          element={<CandidateDetails />}
        />

        {/* Analytics */}
        <Route
          path="/analytics"
          element={<Analytics />}
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={<Settings />}
        />
      </Routes>
    </BrowserRouter>
  );
}