import { useEffect, useState } from "react";
import { ArrowUpRight, Code2, Layers, Server } from "lucide-react";
import { cn } from "../lib/utils";
import { formatIndex } from "../lib/editorial";
import { useInView } from "./fx/useMotionPrefs";

/**
 * 能力清单 —— 原先是三张同构的玻璃卡（圆角图标块 + 标题 + 描述 + 胶囊标签），
 * 现在是一组「序号分隔行」：左侧超大 tabular 序号，右侧栏目名 / 题 / 述 / 技标。
 *
 * 每条多带两个纯版式字段：
 *   · code    —— 英文栏目名，用大写宽字距小标签压在标题之上，
 *                撑起「栏目 → 题 → 正文」的三级编辑式层次；
 *   · measure —— 各条正文的行宽上限互不相同，让右侧收尾参差，
 *                避免三行又从「同构卡片」变成「同构清单」。
 * 图标只保留 16px 的裸图标（不再套圆角方块底座）——图标承框是模板感的重灾区。
 */
const capabilities = [
  {
    code: "Frontend",
    icon: Code2,
    title: "前端开发",
    description: "使用现代框架构建响应式网站和网页应用，注重交互细节与性能。",
    tags: ["React", "TypeScript", "Tailwind"],
    measure: "max-w-[50ch]",
  },
  {
    code: "Interface",
    icon: Layers,
    title: "界面与体验设计",
    description: "设计直观的用户界面，打造流畅自然的使用体验。",
    tags: ["视觉", "动效", "可用性"],
    measure: "max-w-[44ch]",
  },
  {
    code: "Backend",
    icon: Server,
    title: "后端与全栈服务",
    description:
      "用 Go 与 Java 双栈构建服务端：Spring Boot 业务服务、接口设计与数据库建模，配合缓存与消息队列支撑高并发。",
    tags: ["Go", "Java", "Spring Boot", "MySQL", "Redis"],
    measure: "max-w-[64ch]",
  },
];

/* 三则工作观：编辑式版面里做成「标签 : 值」的两列对齐小表，
   值一律右对齐，读起来像杂志页脚的资料栏，而不是三个等宽的胶囊格子。 */
const tenets = [
  { label: "关注", value: "前端体验" },
  { label: "打磨", value: "交互细节" },
  { label: "坚持", value: "工程质量" },
];

export default function AboutSection() {
  /* rootMargin 向下扩 200px、threshold 降到 0.01：
     本区**整块内容**都挂在这一个 inView 上，判定一旦晚于「滚动到该区顶部」，
     移动端就会看到整片空白（技能区已踩过）。200px 预取让区块在真正进入视口
     之前就判命中；threshold 0.01 避免超高区块因可见比例不足而卡住。 */
  const [sectionRef, inView] = useInView({
    threshold: 0.01,
    rootMargin: "0px 0px 200px 0px",
  });

  /* 几何兜底：IntersectionObserver 在异常布局/极旧环境下可能迟迟不回调，
     那样整块会永久停在 opacity-0。这里用 getBoundingClientRect 独立判定
     「区块是否已经进入视口或已被滚过」，命中即揭示，不再依赖 IO 是否触发。
     只在未揭示时轮询，一旦揭示立即清掉，不留下常驻定时器。 */
  const [rectRevealed, setRectRevealed] = useState(false);

  useEffect(() => {
    if (rectRevealed) return undefined;

    const check = () => {
      const node = sectionRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 0;
      if (rect.top < viewportHeight + 200 && rect.bottom > 0) {
        setRectRevealed(true);
      }
    };

    const timer = window.setInterval(check, 400);
    return () => window.clearInterval(timer);
  }, [rectRevealed, sectionRef]);

  const revealed = inView || rectRevealed;

  /* 进场：位移 + 淡入；delay 用于编排先后，duration 统一走 --ease-out-expo 同款曲线 */
  const revealClass = () =>
    cn(
      "transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
      revealed ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
    );
  const revealStyle = (delay) => ({ transitionDelay: `${delay}ms` });

  return (
    /* editorial-shell：非对称页边（桌面起始侧约 1.7 倍），并把 #root 的
       居中文本覆盖回 start —— 左对齐是编辑式版式的第一条件。 */
    <section
      id="about"
      className="editorial-shell relative overflow-hidden py-24 md:py-32"
    >
      {/* 板块级极光点缀（装饰层，保留深空基调，只把强度压到不抢版面） */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-1/4 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.14),transparent_70%)] blur-[100px]" />
        <div className="absolute bottom-0 right-[-8%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.1),transparent_72%)] blur-[90px]" />
      </div>

      <div ref={sectionRef}>
        {/* 区块标题：左对齐 + 板块编号 02 + 延伸至行尾的细线（rule-index 一次给出这三件事） */}
        <header className={cn("flex flex-col gap-5", revealClass())} style={revealStyle(0)}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="label-caps">About</span>
            <span aria-hidden="true" className="rule-dot" />
            <span className="label-caps">个人档案</span>
          </div>
          <h2
            className="rule-index type-h1 editorial-text"
            style={{ "--index": "'02'" }}
          >
            关于我
          </h2>
        </header>

        {/* 非对称跨页：左侧 7 列放宣言，右侧 4 列（自第 9 列起）放速览资料栏。
            两侧内容形态与栏宽都不同，是真正的非对称，而不是把居中的东西推到一边。 */}
        <div className="mt-12 grid gap-y-12 lg:mt-16 lg:grid-cols-12 lg:gap-x-8">
          <div
            className={cn("flex flex-col gap-8 lg:col-span-7", revealClass())}
            style={revealStyle(80)}
          >
            {/* grain-soft：只在超大标题背后铺一层 0.02 的纸纤维，不动正文对比度 */}
            <div className="grain-soft">
              <p className="type-h2 editorial-text">
                热爱创造的<span className="editorial-accent">全栈</span>
                开发者与技术创作者
              </p>
            </div>

            <p className="type-body editorial-measure text-muted">
              我从界面到服务端打通整条链路：前端关注体验、交互细节与工程质量，
              后端用 Go 与 Java 生态（Spring Boot、MySQL、Redis、消息队列）构建稳定服务，
              喜欢把想法打磨成清晰、可靠、好用的产品。
            </p>

            {/* CTA：改成带细线下划线的文字链接（主次分明），不再用两个胶囊按钮 */}
            <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4">
              <a
                href="#contact"
                className="group inline-flex items-center gap-2 border-b border-primary-soft/60 pb-1.5 text-sm font-medium text-foreground transition-colors duration-300 hover:border-cyan-soft hover:text-primary-soft"
              >
                联系我
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>
              <a
                href="#skill"
                className="inline-flex items-center gap-2 border-b border-rule-strong pb-1.5 text-sm font-medium text-muted transition-colors duration-300 hover:border-rule-strong hover:text-foreground"
              >
                看看技能
              </a>
            </div>
          </div>

          <div
            className={cn("lg:col-span-4 lg:col-start-9", revealClass())}
            style={revealStyle(160)}
          >
            <h3 className="label-caps">速览 / At a glance</h3>

            <dl className="mt-5 flex flex-col">
              {tenets.map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-baseline gap-x-4 border-t border-rule py-4"
                >
                  <dt className="label-caps">{item.label}</dt>
                  <dd className="type-body text-right text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
            {/* 收口细线：tabulated 小表上下都有线，才像一个「表」而不是三行文字 */}
            <span aria-hidden="true" className="rule-hair" />
          </div>
        </div>

        {/* 能力区：编辑式列表 —— 每行「超大序号 | 细竖线 | 内容」，行间只靠 hairline 分隔 */}
        <div className="mt-16 flex flex-col">
          {capabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="group">
                <span aria-hidden="true" className="rule-hair" />
                <div
                  className={cn(
                    /* 移动端：序号单独占一行压在内容上方（52px 级），不会把中文挤成窄条；
                       桌面端：两列，序号 max-content 保证 01/02/03 的左边缘严格对齐。 */
                    "grid grid-cols-1 items-start gap-y-4 py-8 md:grid-cols-[max-content_minmax(0,1fr)] md:gap-x-10 md:py-11",
                    revealClass(),
                  )}
                  style={revealStyle(100 + index * 90)}
                >
                  <span aria-hidden="true" className="index-figure">
                    {formatIndex(index + 1)}
                  </span>

                  <div
                    className={cn(
                      /* 桌面端细竖线是「版面栏线」，不是卡片边框：只出现在内容列左缘，
                         并随各条 measure 不同而收在不同位置。 */
                      "flex flex-col gap-3 md:border-l md:border-rule md:pl-10",
                      item.measure,
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 text-primary-soft" aria-hidden="true" />
                      <span className="label-caps">{item.code}</span>
                    </div>

                    <h3 className="type-h3 text-foreground transition-colors duration-300 group-hover:text-primary-soft">
                      {item.title}
                    </h3>

                    <p className="type-body text-muted">{item.description}</p>

                    {/* 技术标签：去掉胶囊，改成中间点分隔的小号大写式标签行 */}
                    <ul className="mt-1 flex flex-wrap items-baseline">
                      {item.tags.map((tag, tagIndex) => (
                        <li key={tag} className="type-micro font-medium">
                          {tagIndex > 0 && (
                            <span aria-hidden="true" className="rule-dot" />
                          )}
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
          <span aria-hidden="true" className="rule-hair" />
        </div>
      </div>
    </section>
  );
}
