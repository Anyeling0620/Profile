import { ArrowDown } from "lucide-react";
export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center px-4"
    >
      <div className="container max-w-4xl mx-auto text-center z-10">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="opacity-0 animate-fade-in">你好，我是 </span>
            <span className="text-primary opacity-0 animate-fade-in-delay-1">
              Anyeling{" "}
            </span>
            <span className="text-gradient ml-2 opacity-0 animate-fade-in-delay-2">
              个人开发
            </span>
          </h1>
          <p className="text-lg md:text-xl text-foreground max-w-2xl mx-auto opacity-0 animate-fade-in-delay-3">
            我使用现代技术打造出色的网页体验，专注于前端开发，
            构建兼具美感与实用性的界面。
          </p>

          <div className="pt-4 opacity-0 animate-fade-in-delay-4">
            <a href="#project" className="cosmic-button">查看我的作品</a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transfrom -translate-x-1/2 flex flex-col items-center animate-bounce">
        <span className="text-xl text-foreground mb-2">向下滚动</span>
        <ArrowDown className='h-5 w-5 text-primary'></ArrowDown>
      </div>
    </section>
  );
}
