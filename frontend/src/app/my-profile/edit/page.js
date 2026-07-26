"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle, Plus, Trash2, MapPin, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/app/utils/apiClient";
import { useAuth } from "@/app/context/AuthContext";
import withUserAuth from "../../components/withUserAuth";
import Image from "next/image";
import userImage from "../../../../public/images/user.png";
import SearchableSelect from "../../components/SearchableSelect";

const emptyAddress = () => ({
    label: "Home",
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "India",
    countryCode: "IN",
    postalCode: "",
    phone: "",
    isDefault: false,
});

// Strips +91 / leading 0 so pasted numbers don't get silently truncated to a wrong number
const cleanPhone = (value) => {
    let digits = String(value || "").replace(/\D/g, "");
    if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
    if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
    return digits.slice(0, 10);
};

const getApiErrorMessage = (error, fallback) => (
    error?.response?.data?.msg
    || error?.response?.data?.message
    || error?.message
    || fallback
);

function Home() {
    const { toast } = useToast();
    const router = useRouter();
    const { logoutUser } = useAuth();
    const [currentPassword, setcurrentPassword] = useState("");
    const [newPassword, setnewPassword] = useState("");
    const [showcurrentPassword, setshowcurrentPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState("");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [avatar, setAvatar] = useState("");
    const [canSetFirstPassword, setCanSetFirstPassword] = useState(false);
    const [addresses, setAddresses] = useState([{ ...emptyAddress(), isDefault: true }]);
    const [indianStates, setIndianStates] = useState([]);
    const phoneInputRef = useRef(null);

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
                if (width > height && width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                } else if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                setAvatar(canvas.toDataURL("image/jpeg", 0.85));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const setDefaultAddress = (idx) => {
        setAddresses((prev) =>
            prev.map((address, index) => ({ ...address, isDefault: index === idx }))
        );
    };

    const updateAddressField = (idx, key, value) => {
        setAddresses((prev) =>
            prev.map((address, index) => (index === idx ? { ...address, [key]: value } : address))
        );
    };

    const addAddress = () => {
        setAddresses((prev) => [...prev, emptyAddress()]);
    };

    const removeAddress = (idx) => {
        setAddresses((prev) => {
            const next = prev.filter((_, index) => index !== idx);
            if (!next.length) return [{ ...emptyAddress(), isDefault: true }];
            if (!next.some((item) => item.isDefault)) next[0].isDefault = true;
            return next;
        });
    };

    const savePassword = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.patch(
                "profile/change-pass",
                { oldPassword: canSetFirstPassword ? undefined : currentPassword, newPassword },
                { meta: { auth: "user" } }
            );
            if (!data.error) {
                toast({
                    title: "Success",
                    description: (
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="text-green-500 w-5 h-5" />
                            <span>Password changed successfully.</span>
                        </div>
                    ),
                });
                await logoutUser();
                router.push("/login");
            } else {
                toast({ title: "Error", description: data.msg || "Password change failed.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: getApiErrorMessage(error, "An error occurred while changing the password."), variant: "destructive" });
        }
    };

    const fetchUserProfile = async () => {
        try {
            const { State } = await import("country-state-city");
            setIndianStates(State.getStatesOfCountry("IN"));

            const { data } = await api.get("profile/", { meta: { auth: "user" } });
            const profile = data.myProfile || {};
            setName(profile.name || "");
            setFullName(profile.fullName || "");
            setPhone(profile.phone || "");
            setEmail(profile.email || "");
            setAvatar(profile.avatar || "");
            setCanSetFirstPassword(Boolean(profile.isGoogleAuth && profile.localPasswordSet !== true));

            const incomingAddresses = Array.isArray(profile.addresses) && profile.addresses.length
                ? profile.addresses
                : profile.address
                    ? [{ ...emptyAddress(), line1: profile.address, fullName: profile.fullName || profile.name || "", phone: profile.phone || "", isDefault: true }]
                    : [{ ...emptyAddress(), isDefault: true }];

            // Country column removed: everything is India for now
            const mappedAddresses = incomingAddresses.map(addr => ({
                ...addr,
                country: "India",
                countryCode: "IN",
            }));

            if (!mappedAddresses.some((item) => item.isDefault)) mappedAddresses[0].isDefault = true;
            setAddresses(mappedAddresses);
        } catch (error) {
            console.error(error);
        }
    };

    const saveProfile = async (e) => {
        e.preventDefault();
        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();
        const typedPhone = cleanPhone(phone);

        if (!normalizedName) {
            toast({ title: "Validation Error", description: "Name is required.", variant: "destructive" });
            return;
        }
        if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
            toast({ title: "Validation Error", description: "Please enter a valid email address.", variant: "destructive" });
            return;
        }

        const cleanedAddresses = addresses
            .map((item) => ({
                ...item,
                label: (item.label || "Address").trim(),
                fullName: (item.fullName || "").trim(),
                line1: (item.line1 || "").trim(),
                line2: (item.line2 || "").trim(),
                city: (item.city || "").trim(),
                state: (item.state || "").trim(),
                country: "India",
                countryCode: "IN",
                postalCode: (item.postalCode || "").trim(),
                phone: cleanPhone(item.phone),
                isDefault: Boolean(item.isDefault),
            }))
            .filter((item) => item.line1 || item.city || item.state || item.postalCode || item.phone);

        if (cleanedAddresses.length && !cleanedAddresses.some((item) => item.isDefault)) {
            cleanedAddresses[0].isDefault = true;
        }

        for (const [index, address] of cleanedAddresses.entries()) {
            const addressNumber = index + 1;
            if (!address.fullName) {
                toast({ title: "Validation Error", description: `Receiver name is required for address ${addressNumber}.`, variant: "destructive" });
                return;
            }
            if (!address.line1 || !address.city || !address.state || !address.postalCode) {
                toast({ title: "Validation Error", description: `Complete address line, city, state, and pincode for address ${addressNumber}.`, variant: "destructive" });
                return;
            }
            if (!address.phone) {
                toast({ title: "Validation Error", description: `Receiver phone number is required for address ${addressNumber}.`, variant: "destructive" });
                return;
            }
            if (!/^[6-9]\d{9}$/.test(address.phone)) {
                toast({ title: "Validation Error", description: `Receiver phone must be a valid 10-digit Indian number for address ${addressNumber}.`, variant: "destructive" });
                return;
            }
        }

        // Contact phone falls back to the default address' receiver phone, so someone
        // who only ever filled in an address is not blocked on a field they never saw.
        const defaultAddress = cleanedAddresses.find((item) => item.isDefault) || cleanedAddresses[0];
        const normalizedPhone = typedPhone || cleanPhone(defaultAddress?.phone);

        if (!normalizedPhone) {
            toast({ title: "Validation Error", description: "Please add your contact phone number.", variant: "destructive" });
            phoneInputRef.current?.focus();
            return;
        }
        if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
            toast({ title: "Validation Error", description: "Phone number must be a valid 10-digit number starting with 6-9.", variant: "destructive" });
            phoneInputRef.current?.focus();
            return;
        }
        if (normalizedPhone !== phone) setPhone(normalizedPhone);

        try {
            const { data } = await api.patch(
                "profile/update",
                { name: normalizedName, fullName: fullName.trim(), email: normalizedEmail, phone: normalizedPhone, avatar, addresses: cleanedAddresses },
                { meta: { auth: "user" } }
            );

            if (!data.error) {
                toast({
                    title: "Success",
                    description: (
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="text-green-500 w-5 h-5" />
                            <span>Profile saved successfully.</span>
                        </div>
                    ),
                });
                setTimeout(() => {
                    router.push("/my-profile");
                }, 700);
            } else {
                toast({ title: "Error", description: data.msg || "Profile change failed.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: getApiErrorMessage(error, "An error occurred while saving profile."), variant: "destructive" });
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-black">
            <div className="sticky top-0 z-50">
                <Navbar />
            </div>
            <section className="relative flex-1 py-14 px-4 sm:px-6 overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[720px] h-[320px] bg-red-600/10 blur-[120px]" />
                    <div className="absolute -right-24 top-24 w-72 h-72 rounded-full border border-red-500/20" />
                </div>
                <div className="max-w-6xl mx-auto">
                    <div className="mb-10 text-center relative z-10">
                        <h1 className="text-3xl sm:text-4xl font-bold text-white">Profile Settings</h1>
                        <p className="text-neutral-400 mt-2">Manage identity, security, and shipping preferences.</p>
                    </div>

                    <Tabs defaultValue="account" className="w-full">
                        <TabsList className="flex w-full max-w-md mx-auto bg-black/60 backdrop-blur border border-white/[0.08] p-1 rounded-xl mb-8">
                            <TabsTrigger value="account" className="flex-1 rounded-lg text-sm py-2.5 text-neutral-400 data-[state=active]:bg-red-600 data-[state=active]:text-white">Account</TabsTrigger>
                            <TabsTrigger value="password" className="flex-1 rounded-lg text-sm py-2.5 text-neutral-400 data-[state=active]:bg-red-600 data-[state=active]:text-white">Password</TabsTrigger>
                        </TabsList>

                        <TabsContent value="account">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
                                <Card className="premium-card rounded-2xl p-6 border-white/[0.08] bg-black/40 backdrop-blur lg:col-span-1 shadow-[0_30px_80px_-45px_rgba(239,68,68,0.5)]">
                                    <div className="space-y-4 text-center">
                                        <h3 className="text-white text-lg font-semibold">Profile Identity</h3>
                                        <div className="mx-auto relative w-28 h-28 rounded-full overflow-hidden border-2 border-white/[0.18] ring-4 ring-red-500/10">
                                            <Image src={avatar || userImage} alt="Avatar Preview" width={112} height={112} className="w-full h-full object-cover" unoptimized={!!avatar} />
                                            <label className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-semibold text-white cursor-pointer">
                                                Change
                                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                            </label>
                                        </div>
                                        {avatar ? (
                                            <button type="button" onClick={() => setAvatar("")} className="text-xs text-red-400 hover:text-red-300">
                                                Remove Photo
                                            </button>
                                        ) : null}
                                        <div className="text-sm text-neutral-300 break-all">{email || "No email yet"}</div>
                                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-left">
                                            <p className="text-xs text-neutral-500">Account Status</p>
                                            <p className="text-sm text-white font-medium mt-1">Verified & Active</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="premium-card rounded-2xl p-6 border-white/[0.08] bg-black/40 backdrop-blur lg:col-span-2">
                                    <form className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-neutral-300">Username</Label>
                                                <Input value={name} onChange={(e) => setName(e.target.value)} className="premium-input h-11 text-white placeholder:text-neutral-600" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-neutral-300">Full Name</Label>
                                                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="premium-input h-11 text-white placeholder:text-neutral-600" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-neutral-300">Email</Label>
                                                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="premium-input h-11 text-white placeholder:text-neutral-600" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-neutral-300">Phone Number</Label>
                                                <div className="flex items-center premium-input rounded-xl border border-white/[0.08] focus-within:border-red-500/70">
                                                    <span className="pl-3 pr-2 text-neutral-400 text-sm">+91</span>
                                                    <Input ref={phoneInputRef} value={phone} onChange={(e) => setPhone(cleanPhone(e.target.value))} className="h-11 text-white bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-neutral-600" placeholder="10-digit phone number" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-1">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <h4 className="text-white font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-red-400" />Saved Addresses</h4>
                                                <Button type="button" variant="outline" onClick={addAddress} className="h-9 w-full sm:w-auto rounded-lg border-white/[0.14] bg-white/[0.02] text-neutral-100 hover:bg-white/[0.08]">
                                                    <Plus className="w-4 h-4 mr-1" /> Add Address
                                                </Button>
                                            </div>

                                            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                                                {addresses.map((address, idx) => (
                                                    <div key={idx} className={`rounded-xl border p-4 space-y-3 transition-all ${
                                                        address.isDefault
                                                            ? "border-amber-400/35 bg-amber-500/5 shadow-[0_0_0_1px_rgba(251,191,36,0.12)]"
                                                            : "border-white/[0.08] bg-white/[0.02]"
                                                    }`}>
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                            <div className="flex items-center gap-2 w-full sm:max-w-[220px]">
                                                                <Input value={address.label} onChange={(e) => updateAddressField(idx, "label", e.target.value)} className="premium-input h-10 text-white" placeholder="Label (Home)" />
                                                            </div>
                                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                                                <Button type="button" variant="outline" onClick={() => setDefaultAddress(idx)} className={`h-9 w-full sm:w-auto rounded-lg ${address.isDefault ? "border-amber-400/40 text-amber-300 bg-amber-500/10" : "border-white/[0.1] text-neutral-300 hover:bg-white/[0.06]"}`}>
                                                                    <Star className="w-4 h-4 mr-1" /> {address.isDefault ? "Default" : "Set Default"}
                                                                </Button>
                                                                {addresses.length > 1 ? (
                                                                    <Button type="button" variant="outline" onClick={() => removeAddress(idx)} className="h-9 w-full sm:w-auto rounded-lg border-red-500/40 text-red-300 hover:bg-red-500/10">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                ) : null}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <Input value={address.fullName} onChange={(e) => updateAddressField(idx, "fullName", e.target.value)} className="premium-input h-10 text-white" placeholder="Receiver name *" />
                                                            <div className="flex items-center premium-input rounded-xl border border-white/[0.08] focus-within:border-red-500/70">
                                                                <span className="pl-3 pr-2 text-neutral-400 text-sm">+91</span>
                                                                <Input value={address.phone} onChange={(e) => updateAddressField(idx, "phone", cleanPhone(e.target.value))} className="h-10 text-white bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-neutral-600" placeholder="Receiver phone *" />
                                                            </div>
                                                        </div>
                                                        <Input value={address.line1} onChange={(e) => updateAddressField(idx, "line1", e.target.value)} className="premium-input h-10 text-white" placeholder="Address Line 1 *" />
                                                        <Input value={address.line2} onChange={(e) => updateAddressField(idx, "line2", e.target.value)} className="premium-input h-10 text-white" placeholder="Address Line 2 (Optional)" />
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                            <SearchableSelect
                                                                value={address.state || ""}
                                                                onChange={(val) => updateAddressField(idx, "state", val)}
                                                                options={indianStates.map(s => ({ value: s.name, label: s.name }))}
                                                                placeholder="State *"
                                                            />
                                                            <Input value={address.city} onChange={(e) => updateAddressField(idx, "city", e.target.value)} className="premium-input h-10 text-white" placeholder="City *" />
                                                            <Input value={address.postalCode} onChange={(e) => updateAddressField(idx, "postalCode", e.target.value.replace(/\D/g, "").slice(0, 6))} className="premium-input h-10 text-white" placeholder="Pincode *" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Button type="button" className="w-full btn-gradient rounded-xl h-11 font-semibold shadow-[0_20px_40px_-20px_rgba(239,68,68,0.8)]" onClick={saveProfile}>Save Changes</Button>
                                    </form>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="password">
                            <div className="max-w-lg mx-auto premium-card rounded-2xl p-6 space-y-5 border border-white/[0.08] bg-black/40 backdrop-blur">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Change Password</h3>
                                    <p className="text-neutral-500 text-sm">
                                        {canSetFirstPassword ? "Set a password for this Google account." : "After saving, you will be logged out and redirected to login."}
                                    </p>
                                </div>
                                <form className="space-y-4">
                                    {!canSetFirstPassword ? (
                                        <div className="space-y-2 relative">
                                            <Label className="text-neutral-300">Current Password</Label>
                                            <Input type={showcurrentPassword ? "text" : "password"} autoComplete="current-password" onChange={(e) => setcurrentPassword(e.target.value)} required className="premium-input h-11 text-white pr-12" />
                                            <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-8 text-neutral-500 hover:text-white" onClick={() => setshowcurrentPassword(!showcurrentPassword)}>
                                                {showcurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </Button>
                                        </div>
                                    ) : null}
                                    <div className="space-y-2 relative">
                                        <Label className="text-neutral-300">New Password</Label>
                                        <Input type={showPassword ? "text" : "password"} autoComplete="new-password" onChange={(e) => setnewPassword(e.target.value)} required className="premium-input h-11 text-white pr-12" />
                                        <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-8 text-neutral-500 hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </Button>
                                    </div>
                                    <Button type="button" className="w-full btn-gradient rounded-xl h-11 font-semibold shadow-[0_20px_40px_-20px_rgba(239,68,68,0.8)]" onClick={savePassword}>Save Password</Button>
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
