import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import CandidateDetails from "./pages/CandidateDetails";


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

       
      </Routes>
    </BrowserRouter>
  );
}
