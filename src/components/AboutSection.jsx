import { Briefcase, Code, Layers } from "lucide-react";
export default function AboutSection() {
  return (
    <section id="about" className="py-24 px-4 relative">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
          关于<span className="text-primary">我</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-semibold text-2xl">
              热爱创造的网页开发者与技术创作者
            </h3>
            <p className="text-foreground">
              我关注前端体验、交互细节和工程质量，喜欢把想法打磨成清晰、可靠、好用的产品。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
              <a href="#contact" className="cosmic-button">
                联系我
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="gradient-border p-6 card-hover">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Code className="w-6 h-6 text-primary"></Code>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-lg">网页开发</h4>
                  <p className="text-foreground">
                    使用现代框架构建响应式网站和网页应用。
                  </p>
                </div>
              </div>
            </div>

            <div className="gradient-border p-6 card-hover">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Layers className="w-6 h-6 text-primary"></Layers>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-lg">界面与体验设计</h4>
                  <p className="text-foreground">
                    设计直观的用户界面，打造流畅自然的使用体验。
                  </p>
                </div>
              </div>
            </div>

            <div className="gradient-border p-6 card-hover">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Briefcase className="w-6 h-6 text-primary"></Briefcase>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-lg">项目推进</h4>
                  <p className="text-foreground">
                    从想法到上线持续推进项目，保持节奏清晰、交付可靠。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
