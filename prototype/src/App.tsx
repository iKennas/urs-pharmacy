import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Pos from "./pages/Pos";
import Medications from "./pages/Medications";
import Batches from "./pages/Batches";
import Inventory from "./pages/Inventory";
import Purchases from "./pages/Purchases";
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Gov from "./pages/Gov";
import Branches from "./pages/Branches";
import UsersPage from "./pages/Users";
import Subscriptions from "./pages/Subscriptions";
import Security from "./pages/Security";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/app" element={<Dashboard />} />
            <Route path="/pos" element={<Pos />} />
            <Route path="/medications" element={<Medications />} />
            <Route path="/batches" element={<Batches />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/gov" element={<Gov />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/security" element={<Security />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  );
}
