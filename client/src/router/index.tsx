import AvatarScene from "@/3d";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Test from "@/pages/test";
import Login from "@/pages/login";
// Dashboard page removed

import Settings from "@/pages/settings";
import NotFound from "@/pages/notFound";
import Layout from "./layouts/main.layout";
import ProtectedRoute from "./ProtectRoute";

export const supportedRoutes = [
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
                    <Route index element={<Navigate to="/settings" replace />} />

                    <Route path="settings" element={<ProtectedRoute element={<Settings />} />} />
                </Route>
                
                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
};

export default Router;