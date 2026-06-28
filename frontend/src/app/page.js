"use client"
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Footer from "./components/Footer";
import Boxes from "./components/Boxes";
import HowItWorks from "./components/HowItWorks";
import PopularMoments from "./components/PopularMoments";
import FeaturedProducts from "./components/FeaturedProducts";
import { useEffect, useState } from "react";
import api from "./utils/apiClient";

const DEFAULT_HOME_CONFIG = {
  homeShowSteps: true,
  homeShowStats: true,
  homeShowMoments: true,
  homeShowShop: true,
  shopEnabled: true,
};

export default function Home() {
  const [config, setConfig] = useState(DEFAULT_HOME_CONFIG);

  useEffect(() => {
    let cancelled = false;
    api.get("config")
      .then(({ data }) => {
        if (!cancelled && data && !data.error && data.config) {
          setConfig({ ...DEFAULT_HOME_CONFIG, ...data.config });
        }
      })
      .catch(() => { /* fall back to defaults */ });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      {/* Sticky Navbar */}
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>

      {/* Main Content */}
      <HeroSection showStats={config.homeShowStats} />
      {config.homeShowSteps && <HowItWorks />}
      <Boxes />
      {config.homeShowMoments && <PopularMoments />}
      {config.homeShowShop && config.shopEnabled && <FeaturedProducts />}
      <Footer />
    </div>
  );
}
