import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "../lib/utils";
import { useInView } from "./fx/useMotionPrefs";
import CountUp from "./fx/CountUp";
import TiltCard from "./fx/TiltCard";

/* ---------------- 技能数据 ----------------
   在原有基础上补入 Java 生态（全栈方向的另一半），
   分类仍沿用 frontend / backend / tools / aiCoding 四组。 */
const skills = [
  // Frontend
  { name: "HTML/CSS", level: 90, category: "frontend" },
  { name: "React", level: 90, category: "frontend" },
  { name: "TypeScript", level: 85, category: "frontend" },
  { name: "Tailwind CSS", level: 90, category: "frontend" },
  { name: "Tanstack", level: 80, category: "frontend" },
  { name: "Taro", level: 80, category: "frontend" },
  // Backend —— Go 栈
  { name: "Go", level: 90, category: "backend" },
  { name: "Gin", level: 90, category: "backend" },
  { name: "Gorm", level: 80, category: "backend" },
  { name: "Postgresql", level: 85, category: "backend" },
  { name: "Redis", level: 85, category: "backend" },
  { name: "Kafka", level: 85, category: "backend" },
  { name: "RocketMQ", level: 90, category: "backend" },
  // Backend —— Java 生态
  { name: "Java", level: 85, category: "backend" },
  { name: "Spring Boot", level: 85, category: "backend" },
  { name: "Spring Cloud", level: 75, category: "backend" },
  { name: "MyBatis", level: 80, category: "backend" },
  { name: "Maven", level: 85, category: "backend" },
  { name: "MySQL", level: 85, category: "backend" },
  { name: "JVM 调优", level: 70, category: "backend" },
  // Tools
  { name: "Git/GitHub/Gitea", level: 90, category: "tools" },
  { name: "Docker", level: 90, category: "tools" },
  { name: "Apifox", level: 90, category: "tools" },
  { name: "Jenkins", level: 85, category: "tools" },
  { name: "Jmeter", level: 80, category: "tools" },
  { name: "Prometheus", level: 80, category: "tools" },
  { name: "Grafana", level: 80, category: "tools" },
  // Aicoding
  { name: "Codex", level: 90, category: "aiCoding" },
  { name: "Claude Code", level: 85, category: "aiCoding" },
  { name: "MCP", level: 85, category: "aiCoding" },
  { name: "Skills", level: 85, category: "aiCoding" },
  { name: "SDD", level: 85, category: "aiCoding" },
  { name: "Harness Engineering", level: 85, category: "aiCoding" },
];

/* 分类顺序与中文标签：保持原样 */
const categories = ["all", "frontend", "backend", "tools", "aiCoding"];
const categoryLabels = {
  all: "全部",
  frontend: "前端",
  backend: "后端",
  tools: "工具",
  aiCoding: "AI Coding",
};

const levelLabel = (level) => {
  if (level >= 90) return "熟练";
  if (level >= 85) return "扎实";
  return "掌握";
};

export default function SkillsSection() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [listRef, inView] = useInView({ threshold: 0.1 });

  const filteredSkills = useMemo(
    () =>
      skills.filter(
        (skill) => activeCategory === "all" || activeCategory === skill.category,
      ),
    [activeCategory],
  );

  /* 分类计数一次算完（26 条数据，避免每次渲染重复 filter） */
  const categoryCounts = useMemo(() => {
    const counts = { all: skills.length };
    for (const skill of skills) {
      counts[skill.category] = (counts[skill.category] || 0) + 1;
    }
    return counts;
  }, []);
  const countOf = (category) => categoryCounts[category] ?? 0;

  return (
    <section id="skill" className="relative overflow-hidden px-4 py-24 md:py-32">
      {/* 板块级极光点缀 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[24rem] w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(65,105,255,0.16),transparent_70%)] blur-[110px]" />
        <div className="absolute bottom-[-10%] right-[-6%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.14),transparent_72%)] blur-[100px]" />
      </div>

      <div className="container mx-auto max-w-6xl">
        {/* 标题 */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.45em] text-subtle">
            Skills · 技能
          </span>
          <h2 className="text-3xl font-bold md:text-4xl">
            我的<span className="aurora-text">技能</span>
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
            从前端界面到后端服务，再到工程化与 AI 辅助开发——这是我在用的工具箱。
          </p>
        </div>

        {/* 分类切换：玻璃胶囊 + 计数徽章 */}
        <div className="mt-10 flex flex-wrap justify-center gap-2 sm:gap-3">
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={isActive}
                className={cn(
                  "group relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300",
                  isActive
                    ? "border-primary-soft/45 bg-gradient-to-r from-[#7c5cff]/28 to-[#4169ff]/20 text-foreground shadow-[0_0_28px_-10px_rgba(124,92,255,0.95)]"
                    : "border-white/[0.09] bg-white/[0.03] text-muted hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-foreground",
                )}
              >
                {categoryLabels[category]}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px font-mono text-[0.6rem] transition-colors duration-300",
                    isActive
                      ? "bg-white/15 text-foreground"
                      : "bg-white/[0.06] text-subtle group-hover:text-muted",
                  )}
                >
                  <CountUp value={countOf(category)} duration={900} start={inView} />
                </span>
              </button>
            );
          })}
        </div>

        {/* 技能卡片网格 */}
        <div
          ref={listRef}
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredSkills.map((skill, index) => {
            /* key 带上分类：切换时强制重建，让进场与生长动画重新播放 */
            /* 统一错峰步进 60~90ms（t5 规范），上限 540ms 避免后面的卡片等太久 */
            const delay = Math.min(index * 65, 540);
            return (
              <TiltCard
                key={`${activeCategory}-${skill.name}`}
                as="article"
                max={6}
                className={cn(
                  "group glass-card relative overflow-hidden p-5 text-left",
                  inView
                    ? "animate-[tilt-in_0.55s_cubic-bezier(0.22,1,0.36,1)_both]"
                    : "opacity-0",
                )}
                style={{ animationDelay: `${delay}ms` }}
              >
                {/* 悬停时的左上角极光渗色 */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#7c5cff]/[0.14] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />

                <div className="relative flex items-baseline justify-between gap-3">
                  <h3 className="text-[0.95rem] font-bold tracking-tight text-foreground">
                    {skill.name}
                  </h3>
                  <span className="font-mono text-[0.66rem] tracking-wider text-subtle">
                    {levelLabel(skill.level)}
                  </span>
                </div>

                {/* 能量条：进入视口才生长（scaleX 关键帧 + 内联目标宽度）
                    发光尾巴用「条尾高光点」实现，不额外增加动画面板。 */}
                <div className="progress-track relative mt-4">
                  <div
                    className={cn(
                      "progress-fill relative",
                    )}
                    style={{
                      width: `${skill.level}%`,
                      /* .progress-fill 在 index.css 里自带 animation（加载即播完），
                         这里用内联 animation 覆盖，确保「进入视口才生长」，
                         切换分类时因 key 变化重新挂载而重播。 */
                      animation: inView
                        ? `progress-grow 1.25s cubic-bezier(0.22,1,0.36,1) ${delay + 90}ms both`
                        : "none",
                      transform: inView ? undefined : "scaleX(0)",
                      transformOrigin: "left center",
                    }}
                  >
                    {/* 条尾高光点 */}
                    <span
                      aria-hidden="true"
                      className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-cyan-soft opacity-0 shadow-[0_0_10px_2px_rgba(126,231,245,0.75)] transition-opacity duration-500 group-hover:opacity-100"
                    />
                  </div>
                </div>

                <div className="relative mt-2 flex items-center justify-between">
                  <span className="text-[0.62rem] uppercase tracking-[0.26em] text-subtle">
                    {categoryLabels[skill.category]}
                  </span>
                  <span className="font-mono text-[0.7rem] tabular-nums text-primary-soft">
                    {/* 数字从 0 滚到目标值，与能量条同步；rAF 直写 DOM，零重渲染 */}
                    <CountUp
                      value={skill.level}
                      duration={1150}
                      delay={delay + 90}
                      start={inView}
                    />
                    <span className="text-subtle">%</span>
                  </span>
                </div>
              </TiltCard>
            );
          })}
        </div>

        {/* 底部提示 */}
        <p className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-subtle">
          <Sparkles className="h-3.5 w-3.5 text-primary-soft" aria-hidden="true" />
          当前展示 {filteredSkills.length} 项 · 共 {skills.length} 项技能
        </p>
      </div>
    </section>
  );
}
