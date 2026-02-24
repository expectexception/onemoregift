"use client"
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Boxes from "../components/Boxes";

export default function GiveawaysPage() {
	return (
		<div className="min-h-screen flex flex-col">
			<div className="sticky top-0 z-50">
				<Navbar />
			</div>
			<main className="flex-1">
				<Boxes />
			</main>
			<Footer />
		</div>
	);
}
