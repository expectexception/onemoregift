"use client"
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { useRouter } from 'next/navigation'
import api from "@/app/utils/apiClient";
import { useAuth } from "@/app/context/AuthContext";
import withUserAuth from "../../components/withUserAuth";

function Home() {
    const { toast } = useToast();
    const router = useRouter();
    const { logoutUser } = useAuth();
    let [currentPassword, setcurrentPassword] = useState("");
    let [newPassword, setnewPassword] = useState("");
    const [showcurrentPassword, setshowcurrentPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");

    let savePassword = async (e) => {
        e.preventDefault();
        try {
            let { data } = await api.patch("profile/change-pass", {
                oldPassword: currentPassword,
                newPassword: newPassword,
            }, { meta: { auth: "user" } });

            if (!data.error) {
                toast({
                    title: "Success",
                    description: (<div className="flex items-center space-x-2"><CheckCircle className="text-green-500 w-5 h-5" /><span>Password changed successfully.</span></div>)
                });
                await logoutUser();
                router.push('/login');
            } else {
                toast({ title: "Error", description: data.msg || "Password change failed.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "An error occurred while changing the password.", variant: "destructive" });
        }
    };

    let fetchUserProfile = async () => {
        try {
            let { data } = await api.get("profile/", { meta: { auth: "user" } });
            setName(data.myProfile.name);
            setPhone(data.myProfile.phone);
            setEmail(data.myProfile.email);
            setAddress(data.myProfile.address);
        } catch (error) {}
    }

    let saveProfile = async (e) => {
        e.preventDefault();
        try {
            let { data } = await api.patch("profile/update", { name, email, phone, address }, { meta: { auth: "user" } })
            if (!data.error) {
                toast({
                    title: "Success",
                    description: (<div className="flex items-center space-x-2"><CheckCircle className="text-green-500 w-5 h-5" /><span>Profile Saved successfully.</span></div>)
                });
            } else {
                toast({ title: "Error", description: data.msg || "Profile change failed.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "An error occurred while Saving.", variant: "destructive" });
        }
    }

    useEffect(() => {
        fetchUserProfile();
    }, [])

    return (
        <div className="min-h-screen flex flex-col bg-black">
            <div className="sticky top-0 z-50">
                <Navbar />
            </div>

            <section className="flex-1 py-16 px-6">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-white mb-2">Edit Profile</h1>
                        <p className="text-neutral-500">Update your account information</p>
                    </div>

                    <Tabs defaultValue="account" className="w-full">
                        <TabsList className="flex w-full bg-white/[0.04] border border-white/[0.06] p-1 rounded-xl mb-6">
                            <TabsTrigger
                                value="account"
                                className="flex-1 rounded-lg text-sm py-2.5 text-neutral-400 data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all"
                            >
                                Account
                            </TabsTrigger>
                            <TabsTrigger
                                value="password"
                                className="flex-1 rounded-lg text-sm py-2.5 text-neutral-400 data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all"
                            >
                                Password
                            </TabsTrigger>
                        </TabsList>

                        {/* Account Tab */}
                        <TabsContent value="account">
                            <div className="premium-card rounded-2xl p-6 space-y-5">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Account Details</h3>
                                    <p className="text-neutral-500 text-sm">Make changes to your profile. Click save when done.</p>
                                </div>
                                <form className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-neutral-300">Name</Label>
                                        <Input id="name" defaultValue={name} onChange={(e) => setName(e.target.value)} className="premium-input h-11 text-white placeholder:text-neutral-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-neutral-300">Phone</Label>
                                        <Input id="phone" defaultValue={phone} onChange={(e) => setPhone(e.target.value)} className="premium-input h-11 text-white placeholder:text-neutral-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-neutral-300">Email</Label>
                                        <Input id="email" defaultValue={email} onChange={(e) => setEmail(e.target.value)} className="premium-input h-11 text-white placeholder:text-neutral-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address" className="text-neutral-300">Address</Label>
                                        <Textarea placeholder="Your shipping address" defaultValue={address} onChange={(e) => setAddress(e.target.value)} className="premium-input text-white placeholder:text-neutral-600 min-h-[80px]" />
                                    </div>
                                    <Button type="button" className="w-full btn-gradient rounded-xl h-11 font-medium" onClick={(e) => saveProfile(e)}>
                                        Save Changes
                                    </Button>
                                </form>
                            </div>
                        </TabsContent>

                        {/* Password Tab */}
                        <TabsContent value="password">
                            <div className="premium-card rounded-2xl p-6 space-y-5">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Change Password</h3>
                                    <p className="text-neutral-500 text-sm">After saving, you&apos;ll be logged out and redirected to login.</p>
                                </div>
                                <form className="space-y-4">
                                    <div className="space-y-2 relative">
                                        <Label htmlFor="current" className="text-neutral-300">Current Password</Label>
                                        <Input
                                            id="current"
                                            type={showcurrentPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            placeholder="Enter current password"
                                            onChange={(e) => setcurrentPassword(e.target.value)}
                                            required
                                            className="premium-input h-11 text-white placeholder:text-neutral-600 pr-12"
                                        />
                                        <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-8 text-neutral-500 hover:text-white" onClick={() => setshowcurrentPassword(!showcurrentPassword)}>
                                            {showcurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </Button>
                                    </div>

                                    <div className="space-y-2 relative">
                                        <Label htmlFor="new" className="text-neutral-300">New Password</Label>
                                        <Input
                                            id="new"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            placeholder="Enter new password"
                                            onChange={(e) => setnewPassword(e.target.value)}
                                            required
                                            className="premium-input h-11 text-white placeholder:text-neutral-600 pr-12"
                                        />
                                        <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-8 text-neutral-500 hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </Button>
                                    </div>

                                    <Button type="button" className="w-full btn-gradient rounded-xl h-11 font-medium" onClick={(e) => savePassword(e)}>
                                        Save Password
                                    </Button>
                                </form>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </section>

            <Footer />
        </div>
    );
}

export default withUserAuth(Home, {
    loadingLabel: "Loading profile settings...",
});
