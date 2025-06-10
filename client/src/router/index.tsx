import AvatarScene from "@/3d";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Test from "@/pages/test";

export const supportedRoutes = [
    '/invoice',
    '/invoice/:id'
]

const Roter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/avatar" element={<AvatarScene />} />
                <Route path="/test" element={<Test />} />
            </Routes>
        </BrowserRouter>
    );
};

export default Roter;