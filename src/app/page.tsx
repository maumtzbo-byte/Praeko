import Navbar from "@/components/marketing/Navbar";
import Hero from "@/components/marketing/Hero";
import ScrollStory from "@/components/marketing/ScrollStory";
import PricingSection from "@/components/marketing/PricingSection";
import CtaSection from "@/components/marketing/CtaSection";
import Footer from "@/components/marketing/Footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Hero />
        <ScrollStory />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
