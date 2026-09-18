import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Footer from "./components/Footer";

import Register from "./auth/Register";
import Login from "./auth/Login";
import Subscribe from "./auth/Subscribe";
import SubscriptionSuccess from "./auth/SubscriptionSuccess";
import ProtectedRoute from "./auth/ProtectedRoute";

import Dashboard from "./dashboard/Dashboard";
import DashboardLayout from "./dashboard/DashboardLayout";
import Opportunities from "./dashboard/Opportunities";
import Wallet from "./dashboard/Wallet";
import Referrals from "./dashboard/Referrals";
import Profile from "./dashboard/Profile";

import AdminLogin from "./admin/AdminLogin";
import AdminProtectedRoute from "./admin/AdminProtectedRoute";
import AdminLayout from "./admin/AdminLayout";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminOpportunities from "./admin/pages/AdminOpportunities";
import AdminWithdrawals from "./admin/pages/AdminWithdrawals";
import AdminReferrals from "./admin/pages/AdminReferrals";
import AdminNotifications from "./admin/pages/AdminNotifications";
import AdminSettings from "./admin/pages/AdminSettings";
import AdminOverview from "./admin/pages/AdminOverview";

import { AuthProvider } from "./context/AuthContext";

function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <HowItWorks />
      <Footer />
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/subscription/success"
          element={<SubscriptionSuccess />}
        />

        {/* Subscription */}
        <Route element={<ProtectedRoute />}>
          <Route path="/subscribe" element={<Subscribe />} />
        </Route>

        {/* User dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="referrals" element={<Referrals />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Admin login */}
        <Route path="/admin" element={<AdminLogin />} />

        {/* Protected admin dashboard */}
        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin/dashboard" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="opportunities" element={<AdminOpportunities />} />
            <Route path="withdrawals" element={<AdminWithdrawals />} />
            <Route path="referrals" element={<AdminReferrals />} />
            <Route
              path="notifications"
              element={<AdminNotifications />}
            />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
