import { useState } from "react";
import { cn } from "../lib/utils";
const skills = [
  // Frontend
  { name: "HTML/CSS", level: 90, category: "frontend" },
  { name: "React", level: 90, category: "frontend" },
  { name: "TypeScript", level: 85, category: "frontend" },
  { name: "Tailwind CSS", level: 90, category: "frontend" },
  { name: "Tanstack", level: 80, category: "frontend" },
  { name: "Taro", level: 80, category: "frontend" },
    // backend
  { name: "Go", level: 90, category: "backend" },
  { name: "Gin", level: 90, category: "backend" },
  { name: "Gorm", level: 80, category: "backend" },
  { name: "Postgresql", level: 85, category: "backend" },
  { name: "Redis", level: 85, category: "backend" },
  { name: "Kafka", level: 85, category: "backend" },
  { name: "RocketMQ", level: 90, category: "backend" },
  // Tools
  { name: "Git/GitHub/Gitea", level: 90, category: "tools" },
  { name: "Docker", level: 90, category: "tools" },
  { name: "ApiFox", level: 90, category: "tools" },
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

const categories = ["all", "frontend","backend", "tools","aiCoding"];
const categoryLabels = {
  all: "全部",
  frontend: "前端",
  backend: "后端",
  tools: "工具",
  aiCoding: "AI Coding"
};

export default function SkillsSection() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredSkills = skills.filter(
    (skill) => activeCategory === "all" || activeCategory === skill.category,
  );
  return (
    <section id="skill" className="py-24 px-4 relative bg-secondary">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
          我的<span className="text-primary">技能</span>
        </h2>

        <div className={cn("flex flex-wrap justify-center gap-4 mb-12")}>
          {categories.map((category, key) => (
            <button
              key={key}
              className={cn(
                "px-5 py-2 rounded-full transition-colors duration-300 capitalize",
                activeCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/70 text-foreground hover:bg-secondary",
              )}
              onClick={() => setActiveCategory(category)}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill, key) => (
            <div
              key={key}
              className="bg-card p-6 rounded-lg shadow-xs card-hover gradient-border"
            >
              <div className="text-left mb-4">
                <h3 className="font-semibold text-lg">{skill.name}</h3>
              </div>

              <div className="w-full bg-secondary/50 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full origin-left animate-[grow_1.5s_ease_out]"
                  style={{ width: skill.level + "%" }}
                ></div>
              </div>

              <div className="rext-right mt-1">
                <span className="text-sm text-foreground">{skill.level}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
