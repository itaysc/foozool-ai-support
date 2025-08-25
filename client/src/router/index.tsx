import AvatarScene from "@/3d";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Test from "@/pages/test";
import Login from "@/pages/login";
// Dashboard page removed

import Settings from "@/pages/settings";
import Insights from "@/pages/insights";
import Performance from "@/pages/performance";
import Anomalies from "@/pages/anomalies";
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
                    <Route path="settings" element={<ProtectedRoute element={<Settings />} />} />
                </Route>
                
                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
};

export default Router;