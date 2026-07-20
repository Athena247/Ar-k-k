import React from "react";
import { Analytics } from '@vercel/analytics/react';
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DigitalMenu from "@/pages/DigitalMenu";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import { AuthProvider } from "@/context/AuthContext";
import { LangProvider } from "@/context/LangContext";

export default function App() {
    return (
        <div className="App">
            <LangProvider>
                <Analytics />
                <AuthProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<DigitalMenu />} />
                            <Route path="/admin/login" element={<AdminLogin />} />
                            <Route path="/admin" element={<AdminDashboard />} />
                        </Routes>
                    </BrowserRouter>
                </AuthProvider>
            </LangProvider>
        </div>
    );
}
