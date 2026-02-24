"use client"
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useState } from "react";
import UserLoginForm from "../components/UserLogin";
import UserSignupForm from "../components/UserSignUpform";
export default function Home() {
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
            <UserSignupForm />
            <Footer />
        </div>

    );
}
