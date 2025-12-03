import CoachVsGrowth from "./_components/CoachVsGrowth";
import CTA from "./_components/CTA";
import Features from "./_components/Features";
import Footer from "./_components/Footer";
import Hero from "./_components/Hero";
import Navbar from "./_components/Navbar";
import Philosophy from "./_components/Philosophy";
import Pillars from "./_components/Pillars";
import ThreePillars from "./_components/ThreePillars";


export default function HomePage() {
  return (
    
      <main className="font-display" >
        <Hero/> 
        <Pillars/>
        <CoachVsGrowth/>
        <Features/>
        <ThreePillars/>
        <Philosophy/>
        <CTA/>
      </main>
     
       
  );
}
