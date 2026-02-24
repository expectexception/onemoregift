import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HiMenu } from "react-icons/hi";
import giveaway from "../../../public/images/gift.png"
import winners from "../../../public/images/medal.png"
import crown from "../../../public/images/crown.png"
import spin from "../../../public/images/spin.png"
import { HiIdentification, HiOutlineBookOpen, HiTruck, HiOutlinePencilAlt, HiGift, HiOutlineBadgeCheck, HiUser } from "react-icons/hi";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import Image from "next/image";
import { useRouter } from 'next/navigation'
import { useAuth } from "../context/AuthContext";
export function SheetDemo() {
    const router = useRouter()
    const { userAuthenticated, loadingUser, logoutUser } = useAuth();
    let isUserLoggedIn = !loadingUser && userAuthenticated
    return (
        <Sheet>
            <SheetTrigger asChild>
                <button> <HiMenu className="text-4xl text-white" /></button>

            </SheetTrigger>
            <SheetContent className="h-full max-h-screen overflow-y-auto">
                {isUserLoggedIn ? (
                    <div className="h-10 min-w-fit m-3 block sm:hidden">
                        <SheetClose asChild>
                            <button className="px-5 sm:px-10 py-2 bg-red-600 rounded-md text-white"
                                onClick={async () => {
                                    await logoutUser();
                                    router.push('/');
                                }}
                            >
                                Logout
                            </button>
                        </SheetClose>
                    </div>
                ) : (
                    <div className="h-10 min-w-fit m-3 block sm:hidden">
                        <SheetClose asChild>
                            <button className="px-5 sm:px-10 py-2 bg-red-600 rounded-md text-white"
                                onClick={() => router.push('/login')}
                            >
                                Sign in
                            </button>
                        </SheetClose>
                    </div>
                )}
                <SheetHeader>
                    <SheetTitle className="text-white">Menu</SheetTitle>
                    {/* <SheetDescription>
                        Make changes to your profile here. Click save when you're done.
                    </SheetDescription> */}
                </SheetHeader>
                <div className="grid gap-5 py-4">
                    <div className="grid grid-cols-4 items-center gap-4 bg-neutral-900 rounded-md hover:bg-red-900 cursor-pointer">
                        <Image src={giveaway} height={'100'} width={'100'} alt="Giveaway" />
                        <div className="flex flex-col">

                            <p className="text-white text-2xl">Giveaways</p>
                            <p className="text-white text-sm font-sans text-nowrap">Updated Daily</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4 bg-neutral-900 rounded-md hover:bg-red-900 cursor-pointer">
                        <Image src={winners} height={'100'} width={'100'} alt="Giveaway" />
                        <div className="flex flex-col">

                            <p className="text-white text-2xl">Winners</p>
                            <p className="text-white text-sm font-sans text-nowrap">See Winners List</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4 bg-neutral-900 rounded-md hover:bg-red-900 cursor-pointer">
                        <Image src={spin} height={'100'} width={'100'} alt="Giveaway" />
                        <div className="flex flex-col">

                            <p className="text-white text-2xl text-nowrap">Lucky Draw</p>
                            <p className="text-white text-sm font-sans text-nowrap">Coming Soon</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4 bg-neutral-900 rounded-md hover:bg-red-900 cursor-pointer">
                        <Image src={crown} height={'100'} width={'100'} alt="Giveaway" />
                        <div className="flex flex-col">

                            <p className="text-white text-2xl text-nowrap">VIP Section</p>
                            <p className="text-white text-sm font-sans text-nowrap">Coming Soon</p>
                        </div>
                    </div>


                </div>
                {/* <SheetFooter className="pt-5"> */}
                <div className="pt-5">
                    <p className="text-white text-2xl">Customer Care</p>
                </div>
                <div className="flex flex-col gap-3 pt-4">
                    {isUserLoggedIn && <div className="bg-neutral-900 flex flex-row rounded-md gap-2 p-4 hover:bg-red-900 cursor-pointer">
                        <HiUser className="text-white text-2xl" />
                        <p className="text-white text-xl">My Profile</p>
                    </div>}
                    <div className="bg-neutral-900 flex flex-row rounded-md gap-2 p-4 hover:bg-red-900 cursor-pointer">
                        <HiIdentification className="text-white text-2xl" />
                        <p className="text-white text-xl">Contact Us</p>
                    </div>
                    <div className="p-4 bg-neutral-900 gap-2 flex flex-row rounded-md hover:bg-red-900 cursor-pointer">
                        <HiOutlineBookOpen className="text-white text-2xl" />
                        <p className="text-white text-xl">FAQ</p>
                    </div>
                    <div className="p-4 bg-neutral-900 gap-2 flex flex-row rounded-md hover:bg-red-900 cursor-pointer">
                        <HiOutlinePencilAlt className="text-white text-2xl" />
                        <p className="text-white text-xl">Terms</p>
                    </div>
                    <div className="p-4 bg-neutral-900 gap-2 flex flex-row rounded-md hover:bg-red-900 cursor-pointer">
                        <HiGift className="text-white text-2xl" />
                        <p className="text-white text-xl">Contest Policy</p>
                    </div>
                    <div className="p-4 bg-neutral-900 gap-2 flex flex-row rounded-md hover:bg-red-900 cursor-pointer">
                        <HiTruck className="text-white text-2xl" />
                        <p className="text-white text-xl">Shipping</p>
                    </div>

                </div>
                {/* <SheetClose>
                        <Button type="submit">Save changes</Button>
                    </SheetClose> */}
                {/* </SheetFooter> */}
            </SheetContent>
        </Sheet>
    )
}
