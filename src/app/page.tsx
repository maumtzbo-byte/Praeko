import Navbar from "@/components/marketing/Navbar";
import Hero from "@/components/marketing/Hero";
import WhatWeDo from "@/components/marketing/WhatWeDo";
import IndustryScrollGallery from "@/components/marketing/IndustryScrollGallery";
import VideoShowcase from "@/components/marketing/VideoShowcase";
import StatsShowcase from "@/components/marketing/StatsShowcase";
import WhyWeBuilt from "@/components/marketing/WhyWeBuilt";
import PricingSection from "@/components/marketing/PricingSection";
import FaqSection from "@/components/marketing/FaqSection";
import CtaSection from "@/components/marketing/CtaSection";
import Footer from "@/components/marketing/Footer";
import IntroReveal from "@/components/marketing/IntroReveal";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <IntroReveal />
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Hero />
        <VideoShowcase />
        <StatsShowcase />
        <WhatWeDo />
        <IndustryScrollGallery />
        <WhyWeBuilt />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
