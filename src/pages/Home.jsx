import ToggleTheme from "../components/ThemeToggle";
import AuroraBackground from "../components/AuroraBackground";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import SkillsSection from "../components/SkillsSection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";
export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* 主题切换 */}
      <ToggleTheme></ToggleTheme>
      {/* 背景 */}
      <AuroraBackground></AuroraBackground>
      {/* narbar */}
      <Navbar></Navbar>
      {/* main content  */}
      <main>
        <HeroSection></HeroSection>
        <AboutSection></AboutSection>
        <SkillsSection></SkillsSection>
        <ContactSection></ContactSection>
      </main>
      <Footer></Footer>
    </div>
  );
}
