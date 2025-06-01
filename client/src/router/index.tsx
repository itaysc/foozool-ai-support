import AvatarScene from "@/3d";
import { BrowserRouter, Routes, Route } from "react-router-dom";


export const supportedRoutes = [
    '/invoice',
    '/invoice/:id'
]

const Roter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/avatar" element={<AvatarScene />} />
            </Routes>
        </BrowserRouter>
    );
};

export default Roter;