import { Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./globals.css";
import LenisScroll from "./components/LenisScroll";
import Generate from "./pages/Generate.tsx";
import MyGeneration from "./pages/MyGeneration.tsx";
import YtPreview from "./pages/YtPreview.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./components/Login.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { useEffect } from "react";
import { Toaster } from 'react-hot-toast'

export default function App() {

    const { pathname, hash } = useLocation()

    // Scroll to top on page change, or to the section in the URL hash (e.g. /#contact)
    useEffect(() => {
        if (hash) {
            const timer = setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 100)
            return () => clearTimeout(timer)
        }
        window.scrollTo(0, 0)
    }, [pathname, hash])

    return (
        <>
            <Toaster toastOptions={{ style: { background: '#18181b', color: '#f4f4f5' } }} />
            <LenisScroll />
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                {/* Form is public so visitors can explore it; generating asks them to log in */}
                <Route path="/generate" element={<Generate />} />
                <Route path="/generate/:id" element={<ProtectedRoute><Generate /></ProtectedRoute>} />
                <Route path="/my-generation" element={<ProtectedRoute><MyGeneration /></ProtectedRoute>} />
                <Route path="/preview" element={<YtPreview />} />
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
        </>
    );
}
