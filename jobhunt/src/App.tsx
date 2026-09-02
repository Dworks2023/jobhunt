import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import AddCandidate from "./pages/AddCandidate";
import CandidateDetails from "./pages/CandidateDetails";
import Import from "./pages/Import";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />

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

        {/* Add Candidate */}
        <Route
          path="/add-candidate"
          element={<AddCandidate />}
        />

        <Route
          path="/import"
          element={<Import />}
        />

        <Route
          path="/analytics"
          element={<Analytics />}
          />

         <Route
          path="/settings"
          element={<Settings />}
          /> 
      </Routes>

      
    </BrowserRouter>
  );
}