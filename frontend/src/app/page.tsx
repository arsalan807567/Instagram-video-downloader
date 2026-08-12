import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhyUse } from "@/components/home/WhyUse";
import { SupportedContent } from "@/components/home/SupportedContent";
import { Faq } from "@/components/home/Faq";
import { AdSlot } from "@/components/ads/AdSlot";

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <AdSlot height={120} />
      </div>
      <HowItWorks />
      <WhyUse />
      <SupportedContent />
      <Faq />
    </>
  );
}
