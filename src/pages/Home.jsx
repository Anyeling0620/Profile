import ToggleTheme from "../components/ThemeToggle";
import StarBackground from "../components/StarBackground";
import Navbar from "../components/Navbar";
export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* 主题切换 */}
      <ToggleTheme></ToggleTheme>
      {/* 背景 */}
      <StarBackground></StarBackground>
      {/* narbar */}
      <Navbar></Navbar>
    </div>
  );
}
