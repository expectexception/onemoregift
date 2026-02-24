"use client"
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useState } from "react";
import UserLoginForm from "../components/UserLogin";
export default function Login() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
    return (
        <div>
            <div className="sticky top-0">
                <Navbar />
            </div>
            {/* <Sidebar /> */}
            <UserLoginForm />
            <Footer />
        </div>

    );
}
