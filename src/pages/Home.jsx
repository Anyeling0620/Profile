import ToggleTheme from "../components/ThemeToggle";
import StarBackground from "../components/StarBackground";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import SkillsSection from "../components/SkillsSection";
import ProjectSection from "../components/ProjectSection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";
export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* 主题切换 */}
      <ToggleTheme></ToggleTheme>
      {/* 背景 */}
      <StarBackground></StarBackground>
      {/* narbar */}
      <Navbar></Navbar>
      {/* main content  */}
      <main>
        <HeroSection></HeroSection>
        <AboutSection></AboutSection>
        <SkillsSection></SkillsSection>
        <ProjectSection></ProjectSection>
        <ContactSection></ContactSection>
      </main>
      <Footer></Footer>
    </div>
  );
}
