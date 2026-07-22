import Navbar from "@/components/marketing/Navbar";
import Hero from "@/components/marketing/Hero";
import IndustryScrollGallery from "@/components/marketing/IndustryScrollGallery";
import WhatWeDo from "@/components/marketing/WhatWeDo";
import VideoShowcase from "@/components/marketing/VideoShowcase";
import SocialProof from "@/components/marketing/SocialProof";
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
        <IndustryScrollGallery />
        <WhatWeDo />
        <VideoShowcase />
        <WhyWeBuilt />
        <SocialProof />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
