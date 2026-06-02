import { HiOutlineLogout } from "react-icons/hi";
import { SheetDemo } from "./Sidebar";
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useAuth } from "../context/AuthContext";
import AnimatedGiftSVG from "./AnimatedGiftSVG";
import { UserIcon, LockIcon } from "./SVGIcons";

export default function Navbar() {
    const { userAuthenticated, loadingUser, logoutUser } = useAuth();
    let isUserLoggedIn = !loadingUser && userAuthenticated
    const router = useRouter()

    const handleUserLogout = async () => {
        await logoutUser();
        router.push('/');
    };

    return (
        <nav className="premium-nav">
            <div className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-7xl mx-auto w-full">
                {/* Logo */}
                <div
                    className="flex items-center gap-1 sm:gap-2 cursor-pointer group flex-shrink-0"
                    onClick={() => router.push('/')}
                >
                    <AnimatedGiftSVG className="w-10 sm:w-12 h-10 sm:h-12" />
                    <div className="flex flex-col">
                        <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white tracking-tight whitespace-nowrap">
                            OneMore<span className="text-gradient">Gift</span>
                        </span>
                    </div>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-5 xl:gap-8">
                    <NavLink href="/" label="Home" />
                    <NavLink href="/giveaway" label="Giveaways" />
                    <NavLink href="/winners" label="Winners" />
                    <NavLink href="/about-us" label="About" />
                </div>

                {/* Desktop Auth Buttons */}
                {isUserLoggedIn ? (
                    <div className="hidden lg:flex items-center gap-2 xl:gap-3">
                        <button
                            className="px-4 xl:px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium transition-all duration-300 border border-white/10 hover:border-white/20"
                            onClick={() => router.push('/my-profile')}
                        >
                            <span className="flex items-center gap-2">
                                <UserIcon className="w-5 h-5" />
                                Profile
                            </span>
                        </button>
                        <button
                            className="px-3 xl:px-6 py-2.5 text-neutral-400 hover:text-white transition-colors duration-300"
                            onClick={handleUserLogout}
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="hidden lg:flex items-center gap-2 xl:gap-3">
                        <button
                            className="px-3 xl:px-6 py-2.5 text-neutral-400 hover:text-white transition-colors duration-300 font-medium"
                            onClick={() => router.push('/login')}
                        >
                            Sign in
                        </button>
                        <button
                            className="btn-gradient px-4 xl:px-6 py-2.5 rounded-xl font-semibold shadow-glow hover:shadow-glow-lg transition-all duration-300"
                            onClick={() => router.push('/register')}
                        >
                            <span className="flex items-center gap-2">
                                Get Started
                            </span>
                        </button>
                    </div>
                )}

                {/* Mobile Menu */}
                <div className="lg:hidden">
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="w-10 h-10 rounded-xl glass flex items-center justify-center border border-white/10 hover:border-red-600/40 transition-colors">
                                <UserIcon className="w-6 h-6" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-64 glass-dark border-white/10 text-white rounded-2xl p-4"
                            side="bottom"
                            align="end"
                        >
                            <div className="flex flex-col space-y-4">
                                <h4 className="text-lg font-semibold text-white px-2">Menu</h4>

                                {/* Mobile Nav Links */}
                                <div className="space-y-1">
                                    <MobileNavLink href="/" label="Home" />
                                    <MobileNavLink href="/giveaway" label="Giveaways" />
                                    <MobileNavLink href="/winners" label="Winners" />
                                    <MobileNavLink href="/about-us" label="About" />
                                </div>

                                <div className="divider-gradient my-2" />

                                {isUserLoggedIn ? (
                                    <div className="space-y-1">
                                        <MobileNavLink href="/my-profile" label="My Profile" icon={<UserIcon className="w-5 h-5" />} />
                                        <MobileNavLink href="/my-profile/edit" label="Settings" icon={<LockIcon className="w-5 h-5" />} />
                                        <button
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                            onClick={handleUserLogout}
                                        >
                                            <HiOutlineLogout className="text-lg" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2 pt-2">
                                        <button
                                            className="w-full btn-gradient py-3 rounded-xl font-semibold"
                                            onClick={() => router.push('/register')}
                                        >
                                            Create Account
                                        </button>
                                        <button
                                            className="w-full py-3 text-neutral-400 hover:text-white transition-colors"
                                            onClick={() => router.push('/login')}
                                        >
                                            Sign in
                                        </button>
                                    </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </nav>
    );
}

function NavLink({ href, label }) {
    return (
        <Link
            href={href}
            className="text-neutral-400 hover:text-white font-medium transition-colors duration-300 relative group"
        >
            {label}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300" />
        </Link>
    );
}

function MobileNavLink({ href, label, icon }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 text-neutral-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
            {icon && <span className="text-lg text-red-500">{icon}</span>}
            <span>{label}</span>
        </Link>
    );
}
