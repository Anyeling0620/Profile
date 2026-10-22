import { ArrowUpRight, Briefcase, Code2, Layers } from "lucide-react";
import { cn } from "../lib/utils";
import { useInView } from "./fx/useMotionPrefs";
import TiltCard from "./fx/TiltCard";

/* 三张能力卡：标题与描述保留原有文案 */
const capabilities = [
  {
    icon: Code2,
    title: "网页开发",
    description: "使用现代框架构建响应式网站和网页应用。",
    tags: ["React", "响应式", "工程化"],
    surface: "from-[#7c5cff]/26 to-[#4169ff]/[0.06]",
    glow: "124 92 255",
  },
  {
    icon: Layers,
    title: "界面与体验设计",
    description: "设计直观的用户界面，打造流畅自然的使用体验。",
    tags: ["视觉", "动效", "可用性"],
    surface: "from-[#4169ff]/26 to-[#22d3ee]/[0.06]",
    glow: "65 105 255",
  },
  {
    icon: Briefcase,
    title: "项目推进",
    description: "从想法到上线持续推进项目，保持节奏清晰、交付可靠。",
    tags: ["协作", "节奏", "交付"],
    surface: "from-[#22d3ee]/[0.22] to-[#7c5cff]/[0.06]",
    glow: "34 211 238",
  },
];

export default function AboutSection() {
  const [sectionRef, inView] = useInView({ threshold: 0.08 });

  /* 进场：位移 + 淡入；delay 用于编排先后，duration 统一走 --ease-out-expo 同款曲线 */
  const revealClass = () =>
    cn(
      "transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
      inView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
    );
  const revealStyle = (delay) => ({ transitionDelay: `${delay}ms` });

  return (
    <section id="about" className="relative overflow-hidden px-4 py-24 md:py-32">
      {/* 板块级极光点缀（装饰层） */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-1/4 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.16),transparent_70%)] blur-[100px]" />
        <div className="absolute bottom-0 right-[-8%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.12),transparent_72%)] blur-[90px]" />
      </div>

      <div ref={sectionRef} className="container mx-auto max-w-6xl">
        {/* 区块标题 */}
        <div className={revealClass()} style={revealStyle(0)}>
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.45em] text-subtle">
              About · 关于
            </span>
            <h2 className="text-3xl font-bold md:text-4xl">
              关于<span className="aurora-text">我</span>
            </h2>
            <span
              aria-hidden="true"
              className="h-px w-24 bg-gradient-to-r from-transparent via-primary-soft/60 to-transparent"
            />
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          {/* 左列：介绍卡 + 关注点 */}
          <div className="flex flex-col gap-6">
            <div
              className={cn(
                "glass-card glass-edge relative overflow-hidden p-7 sm:p-9",
                revealClass(),
              )}
              style={revealStyle(70)}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.22),transparent_70%)] blur-2xl"
              />
              <h3 className="relative text-xl font-bold leading-snug text-foreground sm:text-2xl">
                热爱创造的
                <span className="text-primary-soft">网页开发者</span>
                与<span className="text-accent-soft">技术创作者</span>
              </h3>
              <p className="relative mt-4 text-sm leading-relaxed text-muted sm:text-base">
                我关注前端体验、交互细节和工程质量，喜欢把想法打磨成清晰、可靠、好用的产品。
              </p>

              <div className="relative mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a href="#contact" className="cosmic-button group text-sm">
                  联系我
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
                <a href="#skill" className="ghost-button text-sm">
                  看看技能
                </a>
              </div>
            </div>

            {/* 关注点三连 */}
            <dl
              className={cn(
                "grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md sm:grid-cols-3",
                revealClass(),
              )}
              style={revealStyle(210)}
            >
              {[
                { label: "关注", value: "前端体验" },
                { label: "打磨", value: "交互细节" },
                { label: "坚持", value: "工程质量" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-1 bg-[#07080f]/60 px-4 py-4 transition-colors duration-300 hover:bg-primary/[0.08]"
                >
                  <dt className="text-[0.62rem] uppercase tracking-[0.28em] text-subtle">
                    {item.label}
                  </dt>
                  <dd className="text-sm font-medium text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* 右列：三张能力卡（悬停光晕） */}
          <div className="flex flex-col gap-4">
            {capabilities.map((item, index) => {
              const Icon = item.icon;
              const delay = 140 + index * 70;
              return (
                <TiltCard
                  key={item.title}
                  as="article"
                  max={6}
                  className={cn(
                    "group glass-card relative overflow-hidden p-6 text-left",
                    "hover:-translate-y-1",
                    revealClass(),
                  )}
                  style={{ ...revealStyle(delay), "--card-glow": item.glow }}
                >
                  {/* 悬停时渗入的色块 */}
                  <div
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                      item.surface,
                    )}
                  />
                  {/* 悬停光晕：用 box-shadow 而非 filter，避免把文字一起模糊 */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      boxShadow:
                        "inset 0 0 0 1px rgb(var(--card-glow) / 0.32), 0 0 42px -14px rgb(var(--card-glow) / 0.75)",
                    }}
                  />

                  <div className="relative flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/[0.1] bg-white/[0.05] text-primary-soft transition-all duration-500 group-hover:scale-[1.06] group-hover:border-white/20 group-hover:bg-white/[0.09]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-bold text-foreground sm:text-lg">
                        {item.title}
                      </h4>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {item.description}
                      </p>

                      <ul className="mt-4 flex flex-wrap gap-1.5">
                        {item.tags.map((tag) => (
                          <li
                            key={tag}
                            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[0.66rem] tracking-wide text-subtle transition-colors duration-300 group-hover:border-white/[0.14] group-hover:text-muted"
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
