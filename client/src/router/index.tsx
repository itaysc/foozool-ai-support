import AvatarScene from "@/3d";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Test from "@/pages/test";
import Login from "@/pages/login";
// Dashboard page removed

import Settings from "@/pages/settings";
import Insights from "@/pages/insights";
import Performance from "@/pages/performance";
import Anomalies from "@/pages/anomalies";
import Customers from "@/pages/customers";
import NewCustomer from "@/pages/customers/new";
import EditCustomer from "@/pages/customers/edit";
import ViewCustomer from "@/pages/customers/view";
import CustomerDashboard from "@/pages/customers/dashboard";
import NotFound from "@/pages/notFound";
import Layout from "./layouts/main.layout";
import ProtectedRoute from "./ProtectRoute";

export const supportedRoutes = [
    '/insights',
    '/insights/:organizationId',
    '/performance',
    '/performance/:organizationId',
    '/anomalies',
    '/anomalies/:organizationId',
    '/customers',
    '/customers/new',
    '/customers/:customerId',
    '/customers/:customerId/dashboard',
    '/customers/edit/:customerId',
    '/settings',
    '/invoice',
    '/invoice/:id'
]

const Router = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />                
                {/* Protected routes with layout */}
                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/insights" replace />} />

                    <Route path="insights" element={<ProtectedRoute element={<Insights />} />} />
                    <Route path="insights/:organizationId" element={<ProtectedRoute element={<Insights />} />} />
                    <Route path="performance" element={<ProtectedRoute element={<Performance />} />} />
                    <Route path="performance/:organizationId" element={<ProtectedRoute element={<Performance />} />} />
                    <Route path="anomalies" element={<ProtectedRoute element={<Anomalies />} />} />
                    <Route path="anomalies/:organizationId" element={<ProtectedRoute element={<Anomalies />} />} />
                    <Route path="customers" element={<ProtectedRoute element={<Customers />} />} />
                    <Route path="customers/new" element={<ProtectedRoute element={<NewCustomer />} />} />
                    <Route path="customers/:customerId" element={<ProtectedRoute element={<ViewCustomer />} />} />
                    <Route path="customers/:customerId/dashboard" element={<ProtectedRoute element={<CustomerDashboard />} />} />
                    <Route path="customers/edit/:customerId" element={<ProtectedRoute element={<EditCustomer />} />} />
                    <Route path="settings" element={<ProtectedRoute element={<Settings />} />} />
                </Route>
                
                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
};

export default Router;