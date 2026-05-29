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
import Image from "next/image";
import userImage from "../../../../public/images/user.png";

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
    const [avatar, setAvatar] = useState("");

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast({ title: "Error", description: "Please upload an image file.", variant: "destructive" });
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 400;
                const MAX_HEIGHT = 400;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
                setAvatar(compressedBase64);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

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
            setName(data.myProfile.name || "");
            setPhone(data.myProfile.phone || "");
            setEmail(data.myProfile.email || "");
            setAddress(data.myProfile.address || "");
            setAvatar(data.myProfile.avatar || "");
        } catch (error) {}
    };

    let saveProfile = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast({ title: "Validation Error", description: "Name is required.", variant: "destructive" });
            return;
        }
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            toast({ title: "Validation Error", description: "Please enter a valid email address.", variant: "destructive" });
            return;
        }
        if (phone && !/^[6-9]\d{9}$/.test(phone.trim())) {
            toast({ title: "Validation Error", description: "Phone number must be a valid 10-digit number starting with 6-9.", variant: "destructive" });
            return;
        }
        try {
            let { data } = await api.patch("profile/update", { name, email, phone, address, avatar }, { meta: { auth: "user" } })
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
                                    <div className="flex flex-col items-center space-y-3 pb-4">
                                        <div className="relative w-24 h-24 rounded-full bg-neutral-900 border-2 border-white/[0.06] overflow-hidden group">
                                            <Image
                                                src={avatar || userImage}
                                                alt="Avatar Preview"
                                                width={96}
                                                height={96}
                                                className="w-full h-full object-cover rounded-full"
                                                unoptimized={avatar ? true : false}
                                            />
                                            <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white text-xs font-semibold">
                                                Change
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleAvatarChange}
                                                />
                                            </label>
                                        </div>
                                        {avatar && (
                                            <button
                                                type="button"
                                                onClick={() => setAvatar("")}
                                                className="text-xs text-red-500 hover:text-red-400 font-medium transition-colors"
                                            >
                                                Remove Photo
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-neutral-300">Name</Label>
                                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="premium-input h-11 text-white placeholder:text-neutral-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-neutral-300">Phone (Optional)</Label>
                                        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="premium-input h-11 text-white placeholder:text-neutral-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-neutral-300">Email</Label>
                                        <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="premium-input h-11 text-white placeholder:text-neutral-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address" className="text-neutral-300">Address</Label>
                                        <Textarea placeholder="Your shipping address" value={address} onChange={(e) => setAddress(e.target.value)} className="premium-input text-white placeholder:text-neutral-600 min-h-[80px]" />
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
