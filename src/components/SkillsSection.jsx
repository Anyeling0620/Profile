import { useMemo, useState } from "react";
import { cn } from "../lib/utils";
import { formatIndex } from "../lib/editorial.js";
import { useInView } from "./fx/useMotionPrefs";
import CountUp from "./fx/CountUp";
import TiltCard from "./fx/TiltCard";

/* ============================================================
   技能区 —— 编辑式 Bento 栅格（artistic-elevation / t3）
   ------------------------------------------------------------
   重构建目标：把「33 张完全同构的玻璃卡片 + 紫青渐变进度条」
   换成一张有主次、有节奏的版面。四条具体手法：

   1) 变尺寸栅格。每条技能按坑位拿到不同的 grid-column / grid-row span：
      lead = 跨 8 列 × 跨 2 行（lg），medium = 4 列，small = 4 列，strip = 整行。
      尺寸是「编辑决策」（谁值得被放大），不是数据顺序的自然结果 ——
      这正是编辑式版面与「列表渲染成网格」的分界。
   2) 超大幅号。每张卡以 .index-figure 的超大序号起头（tabular-nums），
      序号是版面图形、标题是版面文字，两者构成近 7 倍的字阶反差。
   3) 刻度尺代替进度条。紫→青渐变进度条整条移除，熟练度改成 12 格
      单色发丝刻度（--color-rule-strong 未点亮 / cyan-soft 点亮），
      高度只有 2px 宽，读起来是「测量」而不是「评分」。
   4) 细线分区代替玻璃盒。卡片不再用 .glass-card（圆角 + backdrop-blur +
      描边 + 投影 + 渐变底），改成无背景、无圆角、无阴影的网格单元，
      只用 border-t（--color-rule）与栅格留白分块。仅主打卡保留一层
      极淡直角底色作为「版面重音」。
   5) 非对称留白。五个章节带之间用交替的留白节奏分开，坑位计划里
      故意留白，不让每行都填满。
   ------------------------------------------------------------
   33 条数据分五带：frontend(6) / go(7) / java(7) / tools(7) / aiCoding(6)。
   「后端」带拆成 Go 与 Java 两节是版面需要（每节 6~7 条才排得开），
   分类筛选仍按原四分类工作，计数徽章口径不变。
   ============================================================ */

/* ---------------- 技能数据 ----------------
   lead: true 标记该带的主打技能（被放大成跨列跨行的大块）。 */
const skills = [
  // Frontend
  { name: "HTML/CSS", level: 90, category: "frontend" },
  { name: "React", level: 90, category: "frontend", lead: true },
  { name: "TypeScript", level: 85, category: "frontend" },
  { name: "Tailwind CSS", level: 90, category: "frontend" },
  { name: "Tanstack", level: 80, category: "frontend" },
  { name: "Taro", level: 80, category: "frontend" },
  // Backend —— Go 栈
  { name: "Go", level: 90, category: "backend", lead: true },
  { name: "Gin", level: 90, category: "backend" },
  { name: "Gorm", level: 80, category: "backend" },
  { name: "Postgresql", level: 85, category: "backend" },
  { name: "Redis", level: 85, category: "backend" },
  { name: "Kafka", level: 85, category: "backend" },
  { name: "RocketMQ", level: 90, category: "backend" },
  // Backend —— Java 生态
  { name: "Java", level: 85, category: "backend", lead: true },
  { name: "Spring Boot", level: 85, category: "backend" },
  { name: "Spring Cloud", level: 75, category: "backend" },
  { name: "MyBatis", level: 80, category: "backend" },
  { name: "Maven", level: 85, category: "backend" },
  { name: "MySQL", level: 85, category: "backend" },
  { name: "JVM 调优", level: 70, category: "backend" },
  // Tools
  { name: "Git/GitHub/Gitea", level: 90, category: "tools", lead: true },
  { name: "Docker", level: 90, category: "tools" },
  { name: "Apifox", level: 90, category: "tools" },
  { name: "Jenkins", level: 85, category: "tools" },
  { name: "Jmeter", level: 80, category: "tools" },
  { name: "Prometheus", level: 80, category: "tools" },
  { name: "Grafana", level: 80, category: "tools" },
  // Aicoding
  { name: "Codex", level: 90, category: "aiCoding", lead: true },
  { name: "Claude Code", level: 85, category: "aiCoding" },
  { name: "MCP", level: 85, category: "aiCoding" },
  { name: "Skills", level: 85, category: "aiCoding" },
  { name: "SDD", level: 85, category: "aiCoding" },
  { name: "Harness Engineering", level: 85, category: "aiCoding" },
];

/* 分类顺序与中文标签：保持原样（筛选语义与计数口径不变） */
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

/* 序号按「版面阅读序」动态生成，不再用数据源原始下标。
   ⚠️ 踩过的坑：早期用数据源下标静态编号（HTML/CSS=01、React=02），
   但各带内部会按「主打优先 → 熟练度降序」重排渲染顺序，
   于是版面实际阅读序变成 02(大卡) → 01 → 04 → 03，编号倒挂。
   编辑式版面的序号是**阅读导航**，必须严格跟随视觉顺序，
   所以改为在 visibleBands 算好之后按展开顺序连续编号。 */
function withReadingOrder(visibleBands) {
  let cursor = 0;
  return visibleBands.map((band) => ({
    ...band,
    items: band.items.map((skill) => ({
      ...skill,
      figure: formatIndex(++cursor),
    })),
  }));
}

/* 计数用的补零：formatIndex 的 min 默认 1（0 号板块不允许），
   但「当前展示 0 项」是合法状态，所以这里单独放行 0。 */
const countFigure = (n) => String(Math.max(0, n)).padStart(2, "0");

/* ---------------- 版面章节带 ----------------
   slots 是这一节的「坑位计划」，按下标落位，长度必须等于本节技能数
   （带内排序把主打固定在第 0 位，所以坑位 = 「第几条拿多大」）。

   为什么手工排而不按数据顺序自动跨度：编辑式版面的尺寸是编辑决策，
   自动等权分配最终一定退回同构网格。

   下面两套坑位序列是穷举验算过的「零空洞组合」：按 CSS grid 的 sparse
   auto-placement 在 4 / 8 / 12 列三档逐一模拟，每行都铺满，
   也不会被跨行的 lead 切出畸形洞。两套共用同一节奏前缀
   「重 · 中 · 中 · 横贯 · 轻」：
     6 条带：lead · medium · medium · strip · small · small
     7 条带：lead · medium · medium · strip · small · small · small
   横贯条排第 4 位而不是末位 —— 带内按熟练度降序，末位是最弱项，
   把整行最大宽度给最弱项会让视觉重量和重要性倒挂。 */
const bands = [
  {
    id: "frontend",
    kicker: "Interface",
    title: "前端 · 界面层",
    note: "把设计稿变成可交互界面，并把交互成本压到最低。",
    slots: ["lead", "medium", "medium", "strip", "small", "small"],
  },
  {
    id: "go",
    kicker: "Services",
    title: "服务端 · Go",
    note: "高并发服务、消息链路与数据一致性。",
    slots: ["lead", "medium", "medium", "strip", "small", "small", "small"],
  },
  {
    id: "java",
    kicker: "Enterprise",
    title: "服务端 · Java",
    note: "企业级业务系统，与 JVM 侧的稳定性工作。",
    slots: ["lead", "medium", "medium", "strip", "small", "small", "small"],
  },
  {
    id: "tools",
    kicker: "Operations",
    title: "工具链 · 交付",
    note: "从提交到上线，把这条链路交给自己跑。",
    slots: ["lead", "medium", "medium", "strip", "small", "small", "small"],
  },
  {
    id: "aiCoding",
    kicker: "Workflow",
    title: "工作流 · AI Coding",
    note: "把模型能力接进日常开发，而不是把模型当成新玩具。",
    slots: ["lead", "medium", "medium", "strip", "small", "small"],
  },
];

/* 章节带归属：backend 拆成 go / java 两节，靠名字集合区分 ——
   数据模型（{name, level, category}）本身不改。 */
const GO_SET = new Set([
  "Go",
  "Gin",
  "Gorm",
  "Postgresql",
  "Redis",
  "Kafka",
  "RocketMQ",
]);

const bandOf = (skill) => {
  if (skill.category !== "backend") return skill.category;
  return GO_SET.has(skill.name) ? "go" : "java";
};

/* 坑位 → 跨度类。三档断点各写一套，不用列起始偏移，
   交给网格自动流（auto-placement）填洞，少一层脆弱的手工定位。

   列宽数学（每档都用脚本模拟过 sparse auto-placement，确认零空洞）：
     sm 4 列：全部整行 —— 手机上任何跨列都会把中文技能名挤成两行，
              尺寸差异改为只由字号承担
     md 8 列：lead 8（跨 2 行）/ medium 4（两个拼一行）/ small 2 / strip 8
     lg 12 列：lead 8 跨 2 行 / medium 4 / small 4 / strip 12
   lg 上 lead 占 1~8 列跨 2 行，其余按 4 列步进铺满右侧两行；
   small 在 lg 必须取 4 列（试过 3 列，7 条带会在最后一行留 2 列空洞）。
   medium 与 small 在 lg 上同宽，靠字号 / 说明文字 / 刻度尺寸区分；
   在 md 上则真有 4 列 vs 2 列的宽度差。 */
const slotClass = {
  lead: "col-span-4 md:col-span-8 md:row-span-2 lg:col-span-8 lg:row-span-2",
  medium: "col-span-4 md:col-span-4 lg:col-span-4",
  /* md 档的 small 必须取 4 列（= 半幅），不能取 2 列。
     ⚠️ 踩过的坑：md 是 8 列，一个带里有 3 张 small，若各占 2 列则合计 6 列，
     右侧固定空出 2 列（实测约 200px 的空带），整行无法铺满。
     取 4 列后：3 张 small = 12 列，在 8 列栅格里自然折成「2 + 1」，右缘整齐收口。 */
  small: "col-span-4 md:col-span-4 lg:col-span-4",
  strip: "col-span-4 md:col-span-8 lg:col-span-12",
};

/* 熟练度刻度尺：12 格。
   为什么是刻度而不是进度条：进度条是「评分可视化」那套模板语法的产物；
   编辑式版面里同一信息更适合用「密度」表达，细到 2px 的线是测量，不是装饰。
   12 格：70~90 的区间正好能分出 1.67% 的粒度，肉眼可辨又不碎。 */
const TICKS = 12;
const tickCount = (level) => Math.max(1, Math.round((level / 100) * TICKS));

function LevelTicks({ level, active, delay }) {
  const filled = tickCount(level);
  return (
    <div className="flex items-end justify-between gap-4">
      {/* 刻度组：装饰性图形，语义信息由右侧数字承担 */}
      <div className="flex items-end gap-[3px]" aria-hidden="true">
        {Array.from({ length: TICKS }, (_, i) => (
          <span
            key={i}
            className={cn(
              "block w-[2px] origin-bottom transition-[transform,background-color] duration-500 ease-out",
              i < filled ? "bg-cyan-soft/80" : "bg-white/[0.13]",
            )}
            style={{
              /* 阶梯高度：越靠后的刻度越高，像音量表而不是等高块 */
              height: `${6 + i * 0.9}px`,
              /* 逐格点亮：有「量出来」的过程感；reduced-motion 时由全局规则压成 1ms */
              transform: active ? "scaleY(1)" : "scaleY(0.25)",
              transitionDelay: `${delay + i * 18}ms`,
            }}
          />
        ))}
      </div>
      <span className="font-mono text-[0.7rem] tabular-nums text-primary-soft">
        {/* 数字从 0 滚到终值：rAF 直写 DOM，零重渲染（t5 保留项） */}
        <CountUp value={level} duration={1150} delay={delay + 90} start={active} />
        <span className="text-subtle">%</span>
      </span>
    </div>
  );
}

/* 一张技能卡。尺寸差异必须落到字号与内边距上 ——
   否则「大卡」只是多了一圈空白，骨子里还是同构的。 */
function SkillCell({ skill, index, slot, active, delay }) {
  const isLead = slot === "lead";
  const isStrip = slot === "strip";

  return (
    <TiltCard
      as="article"
      /* 大卡倾斜更克制：面积越大，同样角度下的视觉位移越夸张 */
      max={isLead ? 3.5 : 6}
      spotlight={!isLead}
      className={cn(
        slotClass[slot],
        /* isolate：主打卡那层 -z-10 底色必须被卡片自己的堆叠上下文收住，
           否则会沉到 section 的极光背景下面（看起来「没生效」） */
        "group relative isolate flex flex-col justify-between",
        /* 唯一的「结构色」：一条 hairline 顶线。无圆角、无阴影、无 blur。
           悬停只让这条线变亮一档 + 标题位移 1px —— 编辑式版面里
           「盒子浮起来」这类反馈要克制到几乎看不见。 */
        "border-t border-[var(--color-rule)] pt-4",
        "transition-[border-color] duration-300 hover:border-t-[color:var(--color-rule-strong)]",
        /* 卡片底部内边距：移动端压缩一档，避免 375px 下把整节撑到 8 屏 */
        isLead ? "pb-4 md:pb-6" : isStrip ? "pb-3 md:pb-4" : "pb-4 md:pb-5",
        isStrip && "md:flex-row md:items-end md:justify-between md:gap-8",
        active
          ? "animate-[tilt-in_0.55s_cubic-bezier(0.22,1,0.36,1)_both]"
          : "opacity-0",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* 主打卡的极淡底面：直角、无模糊、无投影，只是版面的「重音」 */}
      {isLead && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 inset-y-0 -z-10 bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent"
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {/* 超大序号：版面图形（tabular-nums），不进入阅读流 */}
          <span
            aria-hidden="true"
            className={cn(
              "index-figure",
              isLead
                ? ""
                : isStrip
                  ? "[font-size:clamp(1.4rem,0.9rem+1.2vw,1.85rem)]"
                  : "[font-size:clamp(1.6rem,1rem+1.6vw,2.25rem)]",
              isLead ? "text-foreground/90" : "text-[var(--color-rule-strong)]",
            )}
          >
            {index}
          </span>

          <h3
            className={cn(
              "mt-2 font-bold tracking-tight text-foreground",
              isLead
                ? "text-[clamp(1.5rem,1.1rem+1.7vw,2.4rem)] leading-[1.06]"
                : isStrip
                  ? "text-[clamp(1rem,0.92rem+0.5vw,1.2rem)]"
                  : "text-[clamp(0.98rem,0.9rem+0.45vw,1.15rem)] leading-tight",
            )}
          >
            {skill.name}
          </h3>

          {/* 说明文字只给大卡与整行条：小卡保持「名 + 熟练度」两层信息，
              信息量差异本身也是尺寸差异的一部分 */}
          {(isLead || isStrip) && (
            <p className="type-caption mt-2 max-w-[34ch]">{skillNote(skill)}</p>
          )}
        </div>

        <span className="label-caps shrink-0 text-right">
          {levelLabel(skill.level)}
        </span>
      </div>

      <div
        className={cn(
          isLead ? "mt-6" : "mt-4",
          isStrip && "md:mt-0 md:w-56 md:shrink-0",
        )}
      >
        <LevelTicks level={skill.level} active={active} delay={delay} />
        <span className="mt-3 block text-[0.6rem] uppercase tracking-[0.26em] text-subtle">
          {categoryLabels[skill.category]}
        </span>
      </div>
    </TiltCard>
  );
}

/* 一句话说明：大卡必须有文字，否则只是放大版的小卡。
   33 条各配一句「它在我这儿干什么」。 */
const NOTES = {
  "HTML/CSS": "语义结构与现代布局，先把地基铺平。",
  React: "组件化界面与状态管理，复杂交互先在这里做对。",
  TypeScript: "类型是文档，也是重构时的安全网。",
  "Tailwind CSS": "设计令牌落到实用类，样式不再散落在各处。",
  Tanstack: "表格与查询层的无头能力，交互与视图分离。",
  Taro: "一套代码编译到小程序与 H5，跨端成本压到最低。",
  Go: "高并发服务的主力语言，网关与业务服务都跑在这上面。",
  Gin: "轻量 HTTP 路由与中间件，服务骨架首选。",
  Gorm: "结构体到表的映射，迁移与关联查询够用就好。",
  Postgresql: "业务主库，事务与索引设计在这里落地。",
  Redis: "缓存与热点数据，先想清楚失效策略再放数据。",
  Kafka: "异步解耦与削峰，消息顺序与消费位点要盯住。",
  RocketMQ: "事务消息与延迟消息，业务一致性靠它兜底。",
  Java: "企业级业务系统的另一半，Spring 全家桶与 JVM 侧调优。",
  "Spring Boot": "业务服务脚手架，配置与依赖注入收在容器里。",
  "Spring Cloud": "服务拆分后的注册、配置与调用链治理。",
  MyBatis: "SQL 显式可控，复杂查询不藏在 ORM 里。",
  Maven: "多模块构建与依赖收敛，版本冲突在这里解决。",
  MySQL: "线上业务库，慢查询与索引是最常打交道的部分。",
  "JVM 调优": "内存模型、GC 与线程栈，线上抖动时逐层排查。",
  "Git/GitHub/Gitea": "版本控制与自建托管，分支策略按团队节奏走。",
  Docker: "环境一致性，从本地到线上跑的是同一个镜像。",
  Apifox: "接口文档与调试合在一处，前后端对齐成本降下来。",
  Jenkins: "流水线编排，构建、测试、发布串成一条线。",
  Jmeter: "压测脚本与并发模型，容量结论要有数字支撑。",
  Prometheus: "指标采集与告警规则，先有可观测再有优化。",
  Grafana: "把指标变成一条看得懂的曲线。",
  Codex: "把需求交给模型做第一版实现，再逐段收紧。",
  "Claude Code": "终端里的结对编辑，改动先看 diff 再落盘。",
  MCP: "把外部工具接进模型上下文，能力边界显式声明。",
  Skills: "把重复的判断固化成可复用的操作手册。",
  SDD: "先写规格再写实现，让评审发生在代码之前。",
  "Harness Engineering": "评测与回归跑在固定夹具上，模型改动可比较。",
};

function skillNote(skill) {
  return NOTES[skill.name] ?? "日常开发中持续使用，按场景取用。";
}

export default function SkillsSection() {
  const [activeCategory, setActiveCategory] = useState("all");
  /* ⚠️ 必须用 threshold 0 + 正向 rootMargin 预取，不能用 threshold 0.1。
     踩过的坑：编辑式版面把技能区摊开到近 8000px 高（移动端尤甚），
     任何基于「区块可见比例」的 threshold 都永远无法达成 —— 区块始终
     只有顶部一小截在视口内，比例远低于 0.1，于是 inView 恒为 false，
     整片卡片永久停在 opacity-0，表现为「滚到技能区一片空白」。
     正确做法：区块顶部进入视口下方 200px 的预取带即算命中
     （threshold 0 + 正向 rootMargin 扩大判定区域），入场照常触发。 */
  const [listRef, inView] = useInView({
    threshold: 0,
    rootMargin: "200px 0px 0px 0px",
  });

  /* 分类计数一次算完（33 条数据，避免每次渲染重复 filter）—— 原逻辑保留 */
  const categoryCounts = useMemo(() => {
    const counts = { all: skills.length };
    for (const skill of skills) {
      counts[skill.category] = (counts[skill.category] || 0) + 1;
    }
    return counts;
  }, []);
  const countOf = (category) => categoryCounts[category] ?? 0;

  /* 带内排序：主打优先 → 熟练度降序 → 名字稳定。
     排序决定「谁拿大卡」，坑位计划决定「拿多大」。 */
  const bandsWithSkills = useMemo(
    () =>
      bands.map((band) => {
        const items = skills
          .filter((skill) => bandOf(skill) === band.id)
          .slice()
          .sort((a, b) => {
            const leadDelta = (b.lead ? 1 : 0) - (a.lead ? 1 : 0);
            if (leadDelta !== 0) return leadDelta;
            if (b.level !== a.level) return b.level - a.level;
            return a.name.localeCompare(b.name);
          });
        return { ...band, items };
      }),
    [],
  );

  /* 当前分类下要展示的带；整带没有命中项就整节隐藏。
     最后一步 withReadingOrder 给每张卡挂上「按视觉顺序」的连续序号（见函数注释）。 */
  const visibleBands = useMemo(() => {
    if (activeCategory === "all") return withReadingOrder(bandsWithSkills);
    return withReadingOrder(
      bandsWithSkills
        .filter((band) => band.items.some((s) => s.category === activeCategory))
        .map((band) => ({
          ...band,
          items: band.items.filter((s) => s.category === activeCategory),
        })),
    );
  }, [activeCategory, bandsWithSkills]);

  const visibleCount = visibleBands.reduce((sum, band) => sum + band.items.length, 0);

  /* 章节号 01~05 固定（跟着 band 顺序，不跟筛选跳号）：章节号是版面骨架 */
  const bandIndex = useMemo(
    () => new Map(bands.map((band, i) => [band.id, formatIndex(i + 1)])),
    [],
  );

  return (
    <section id="skill" className="relative overflow-hidden py-24 md:py-32">
      {/* 板块级极光点缀：保留原视觉资产，强度压低以免抢版面 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[24rem] w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(65,105,255,0.12),transparent_70%)] blur-[110px]" />
        <div className="absolute bottom-[-10%] right-[-6%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.1),transparent_72%)] blur-[100px]" />
      </div>

      {/* .editorial-shell：非对称页边（桌面起始侧 1.7×）。它会把 text-align
          改回 start —— 这里绝不能再写 text-center，否则又拉回居中模板感 */}
      <div className="editorial-shell">
        <div ref={listRef}>
          {/* ---------- 刊头 ---------- */}
          <div className="flex items-baseline gap-4">
            <span className="label-caps text-primary-soft">Skills · 技能</span>
            <span
              aria-hidden="true"
              className="rule-hair-short flex-none self-center"
            />
            <span className="type-micro font-mono tabular-nums">
              {countFigure(skills.length)} Entries
            </span>
          </div>

          {/* 超大序号 + 主标题：序号当图形用，标题与导语贴着它的基线收口 */}
          <div className="mt-8 flex flex-col gap-y-5 md:flex-row md:items-end md:justify-between md:gap-x-10">
            <div className="flex items-end gap-4">
              <span
                aria-hidden="true"
                className="index-figure shrink-0 text-[var(--color-rule-strong)]"
              >
                03
              </span>
              {/* md 档（768px）实测该标题会被压成「我的/技能」两行、与左侧 03 序号打架。
                  根因不是 white-space（nowrap 已生效），而是 h2 在 flex 行里被**压缩**了：
                  兄弟节点「03」超大序号约占 105px，h2 没有 shrink-0，被挤到 139px 宽，
                  于是 nowrap 的字在框内溢出、视觉上仍表现为折行。
                  所以必须 shrink-0 让标题保住固有宽度，序号那侧本来就已 shrink-0。 */}
              <h2 className="type-h1 shrink-0 whitespace-nowrap pb-2 md:pb-3">
                我的<span className="editorial-text">技能</span>
              </h2>
            </div>
            <p className="type-lede max-w-[34ch] md:pb-4">
              从前端界面到后端服务，再到工程化与 AI 辅助开发 —— 这是我在用的工具箱。
            </p>
          </div>

          <hr className="rule-hair mt-8" />

          {/* ---------- 分类筛选：栏目标签语法，不是玻璃胶囊 ----------
              可访问性原样保留：真实 <button>、aria-pressed、键盘可达、
              全局 :focus-visible 极光辉环（不覆盖 outline）、计数徽章在按钮内。
              视觉上换掉「圆角 + 紫蓝渐变 + 发光」三件套，
              改成「序号 + 宽字距标签 + 激活下划线」，计数徽章由胶囊改成方块。 */}
          <div
            role="group"
            aria-label="按分类筛选技能"
            className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-3 md:gap-x-7"
          >
            {categories.map((category, i) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={isActive}
                  className={cn(
                    "group flex items-baseline gap-2 border-b pb-1.5 transition-colors duration-300",
                    isActive
                      ? "border-b-foreground text-foreground"
                      : "border-b-transparent text-muted hover:text-foreground",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="font-mono text-[0.6rem] tabular-nums text-subtle"
                  >
                    {formatIndex(i + 1)}
                  </span>
                  <span className="text-sm font-medium">
                    {categoryLabels[category]}
                  </span>
                  <span
                    className={cn(
                      "min-w-5 px-1 py-px text-center font-mono text-[0.6rem] tabular-nums transition-colors duration-300",
                      isActive
                        ? "bg-white/15 text-foreground"
                        : "bg-white/[0.06] text-subtle group-hover:text-muted",
                    )}
                  >
                    <CountUp
                      value={countOf(category)}
                      duration={900}
                      start={inView}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          {/* ---------- 章节带 ---------- */}
          {visibleBands.map((band, bandIdx) => (
            <section
              key={`${activeCategory}-${band.id}`}
              aria-labelledby={`skills-band-${band.id}`}
              className={cn(
                /* 非对称留白：交替的带间距，不让每一节都等距（这是编辑式的手势）。
                   ⚠️ 移动端必须压缩：375px 下原本整节高达 7828px、占全页 63%，
                   要滚近 8 屏才到「联系」，密度失控。手机上带间距统一降到 8/10，
                   大留白只在 md+ 生效 —— 编辑式留白是给宽版面用的，
                   窄屏上同样的绝对值会被拉成无意义的空白。 */
                bandIdx === 0 ? "mt-8 md:mt-10" : bandIdx % 2 === 0 ? "mt-10 md:mt-20" : "mt-8 md:mt-14",
              )}
            >
              <div className="flex items-baseline gap-4">
                <span
                  aria-hidden="true"
                  className="font-mono text-[0.7rem] tabular-nums text-primary-soft"
                >
                  {bandIndex.get(band.id)}
                </span>
                <span className="label-caps text-subtle">{band.kicker}</span>
                <span aria-hidden="true" className="rule-hair flex-1 self-center" />
                <span className="type-micro font-mono tabular-nums">
                  {countFigure(band.items.length)}
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <h3 id={`skills-band-${band.id}`} className="type-h3">
                  {band.title}
                </h3>
                <p className="type-caption max-w-[36ch] md:text-right">
                  {band.note}
                </p>
              </div>

              {/* Bento 栅格：editorial-grid（4 → 8 → 12 列）承载变尺寸坑位 */}
              <div className="editorial-grid mt-6 items-stretch">
                {band.items.map((skill, i) => (
                  <SkillCell
                    key={`${activeCategory}-${skill.name}`}
                    skill={skill}
                    index={skill.figure}
                    slot={band.slots[i] ?? "small"}
                    active={inView}
                    /* 错峰：带内 50ms、带间 100ms 偏移，整体封顶 640ms */
                    delay={Math.min(bandIdx * 100 + i * 50, 640)}
                  />
                ))}
              </div>
            </section>
          ))}

          {/* ---------- 页脚统计 ---------- */}
          <hr className="rule-hair mt-14" />
          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
            <p className="type-micro font-mono tabular-nums">
              当前展示 {countFigure(visibleCount)} 项 · 共{" "}
              {countFigure(skills.length)} 项技能
            </p>
            <p className="label-caps">
              {categoryLabels[activeCategory]} · 熟练度 ≥ 90 记为熟练
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
