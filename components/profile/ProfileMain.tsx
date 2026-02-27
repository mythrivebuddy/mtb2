import AboutSection from "./AboutSection";
import HeroSection from "./HeroSection";
import ProgramsSection from "./ProgramSection";
import VideoSection from "./VideoSection";


export default function ProfileMain() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-20">
      <HeroSection />
      <ProgramsSection />
      <AboutSection />
      <VideoSection />
    </main>
  );
}