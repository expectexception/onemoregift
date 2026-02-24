"use client"
// import Navbar from "../../components/Navbar";
// import Footer from "../../components/Footer";
// import Disclaimer from "@/app/components/Disclaimer";
import { useState, useEffect, use } from "react";
import GiveawayDetails from "@/app/components/GiveawayDetails";
import withAdminAuth from "../../../../components/withAdminAuth";
import api from "@/app/utils/apiClient";
function Page({ params }) {
    const slug = use(params).id
    let [giveaway, setGiveaway] = useState({});
    let fetchGiveaway = async () => {
        try {
            const { data } = await api.get(`admin/giveaway/${slug}`, {
                meta: { auth: "admin" },
            });
            setGiveaway(data.data);
        } catch (error) {
        }
    };
    useEffect(() => {
        fetchGiveaway();
    }, []);


    // return <div>My Post: {slug}</div>
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Giveaway Details</h1>

            {/* <div className="sticky top-0">
                <Navbar />
            </div> */}
            <div>
                <GiveawayDetails data={giveaway} />
            </div>
            {/* <div>
                <Disclaimer />
            </div>
            <Footer /> */}
        </div>
    )
}

export default withAdminAuth(Page);