import { BrowserRouter, Route, Routes } from "react-router-dom";
import React from "react";
import NavBarLanding from "./components/auth/NavBarLanding.tsx";
import LandingPage from "./components/auth/LandingPage.tsx";
import Login from "./components/auth/Login.tsx";
import Register from "./components/auth/Register.tsx";
import ForgotPassword from "./components/auth/Forgot.tsx";
import ResetPassword from "./components/auth/Reset.tsx";
import { Settings } from "./components/settings/Settings";
import Transactions from "./pages/Transactions";
import { TimeRangeProvider } from "./hooks/time-range-context.tsx";
import Portfolio from "./pages/portfolio.tsx";
import Explore from "./pages/Explore.tsx";
import Dashboard from "./pages/dashboard.tsx";
import AdminDashboard from "./components/admin/AdminDashboard";

const App: React.FC = () => {
  return (
    <div className="bg-black h-screen w-screen overflow-hidden">
      <TimeRangeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/Forgot" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/NavBarLanding" element={<NavBarLanding />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/Register" element={<Register />} />
            <Route path="/Portfolio?" element={<Portfolio />} />
            <Route path="/Explore" element={<Explore />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/Transaction" element={<Transactions />} />
            <Route path="/Settings" element={<Settings />} />
            <Route path="/AdminDashboard" element={<AdminDashboard />} />
          </Routes>
        </BrowserRouter>
      </TimeRangeProvider>
    </div>
  );
};

export default App;
