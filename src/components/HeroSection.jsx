import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import MagneticButton from "./fx/MagneticButton";

const GITHUB_URL = "https://github.com/Anyeling0620";

/* lucide-react 1.x 已移除品牌图标（Github 导出不再存在），
   这里用内联 SVG 的官方 GitHub 标替代，避免额外依赖。 */
function GithubMark({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      className={className}
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.55v-1.93c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.42.36.79 1.08.79 2.18v3.23c0 .3.21.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

/* 定位文案：保留原意，仅做排版切分 */
const POSITIONING =
  "我使用现代技术打造出色的网页体验，覆盖从界面到服务端的完整链路，构建兼具美感、性能与可靠性的全栈产品。";

const HIGHLIGHTS = [
  { label: "定位", value: "全栈开发" },
  { label: "技术栈", value: "React · Go · Java" },
  { label: "位置", value: "中国，山东" },
];

const NAME = "Kuang Zihao";

export default function HeroSection() {
  /* ---------- 鼠标视差：目标值 + rAF 缓动插值 ----------
     性能要点：位移**直接写 DOM transform**（ref），不用 useState。
     早期实现每帧 setPointer 会让整个 Hero（含标题/CTA/速览表）每帧重渲染，
     在低端机上直接变成掉帧源。现在每帧只改 3~4 个元素的 transform。 */
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(0);
  const glow1Ref = useRef(null);
  const glow2Ref = useRef(null);
  const glow3Ref = useRef(null);
  const badgeRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    /* 触屏设备没有真实指针，跳过视差以免无意义重绘 */
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    if (reduced || coarse) return;

    const layers = [
      [glow1Ref, 18],
      [glow2Ref, 30],
      [glow3Ref, 24],
      [badgeRef, 6],
      [statsRef, 11],
    ];

    const paint = () => {
      const { x, y } = currentRef.current;
      for (const [ref, depth] of layers) {
        const node = ref.current;
        if (!node) continue;
        node.style.transform = `translate3d(${(-x * depth).toFixed(2)}px, ${(-y * depth).toFixed(2)}px, 0)`;
      }
    };

    const tick = () => {
      frameRef.current = 0;
      const current = currentRef.current;
      const target = targetRef.current;
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      paint();
      if (
        Math.abs(target.x - current.x) > 0.001 ||
        Math.abs(target.y - current.y) > 0.001
      ) {
        frameRef.current = window.requestAnimationFrame(tick);
      }
    };

    const onPointerMove = (event) => {
      targetRef.current = {
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2,
      };
      if (!frameRef.current) frameRef.current = window.requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      /* 复位，避免卸载后残留偏移 */
      for (const [ref] of layers) {
        if (ref.current) ref.current.style.transform = "";
      }
    };
  }, []);

  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] items-center overflow-hidden px-4 pb-28 pt-28 sm:pt-32"
    >
      {/* ---------- 背景层（纯装饰） ----------
          性能说明：光斑不使用 filter: blur()。实测超大元素「blur + transform 动画」
          会把帧间隔从 16.7ms 拉到 83~100ms；这里改用多段柔和渐变实现同样的羽化观感。 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* 极光光斑：视差层 > 呼吸层 */}
        <div ref={glow1Ref} className="absolute left-1/2 top-[-16%] -translate-x-1/2">
          <div className="h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.34)_0%,rgba(124,92,255,0.24)_16%,rgba(124,92,255,0.14)_32%,rgba(124,92,255,0.06)_46%,rgba(124,92,255,0.02)_58%,transparent_70%)] fx-breathe" />
        </div>
        <div ref={glow2Ref} className="absolute right-[-10%] top-[10%]">
          <div className="h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(65,105,255,0.28)_0%,rgba(65,105,255,0.2)_16%,rgba(65,105,255,0.11)_32%,rgba(65,105,255,0.05)_46%,rgba(65,105,255,0.015)_58%,transparent_70%)] animate-[float_9s_ease-in-out_infinite] motion-reduce:animate-none" />
        </div>
        <div ref={glow3Ref} className="absolute bottom-[-12%] left-[-8%]">
          <div className="h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.2)_0%,rgba(34,211,238,0.14)_16%,rgba(34,211,238,0.08)_32%,rgba(34,211,238,0.035)_46%,rgba(34,211,238,0.01)_58%,transparent_72%)] animate-[float_11s_ease-in-out_infinite_1.2s] motion-reduce:animate-none" />
        </div>
        {/* 透视地平线网格 + 细网格
            炫酷强化：新增一层 hud-horizon（44px 更密的透视网格）叠在地平线处，
            让纵深更明确；原 grid-perspective/grid-mesh 保留作为底层结构。 */}
        <div className="hud-horizon absolute inset-x-0 bottom-0 h-[30vh] opacity-[0.42]" aria-hidden="true" />
        <div className="grid-perspective absolute inset-x-0 bottom-0 h-[38vh] opacity-60" />
        <div className="grid-mesh absolute inset-0 opacity-[0.55]" />

        {/* 首屏一次性光带横扫：只播一次（不循环），播完即停，避免廉价感。
            只动 transform/opacity，走合成层。 */}
        <div
          className="fx-sweep absolute inset-y-0 -left-1/3 w-1/2 motion-reduce:hidden"
          style={{
            "--fx-delay": "520ms",
            backgroundImage:
              "linear-gradient(100deg, transparent 0%, rgb(185 166 255 / 0.09) 34%, rgb(126 231 245 / 0.14) 50%, rgb(185 166 255 / 0.07) 66%, transparent 100%)",
            transform: "skewX(-12deg)",
          }}
        />
        {/* 顶部渐隐（衔接导航胶囊） / 底部渐隐（衔接下一板块） */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#05060a] via-[#05060a]/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#05060a] to-transparent" />
      </div>

      <div className="container relative z-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          {/* 状态胶囊：视差层 + 进场层
              炫酷强化：圆胶囊 → 切角 HUD 徽标，脉冲圆点 → 方波指示灯。
              「可接受新的合作」本身是一条**状态信号**，用指示灯语法比圆胶囊更对味。 */}
          <div ref={badgeRef}>
            <div className="animate-[fade-in_0.9s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none">
              <span className="glass-card chamfer-sm inline-flex items-center gap-2.5 border-white/[0.14] px-4 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted">
                <span className="hud-pulse" aria-hidden="true" />
                <span className="text-cyan-soft">ONLINE</span>
                <span className="text-white/15">/</span>
                可接受新的合作
              </span>
            </div>
          </div>

          {/* 问候 */}
          <p
            className="mt-7 animate-[fade-in_0.9s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none font-mono text-[0.7rem] uppercase tracking-[0.5em] text-subtle"
            style={{ animationDelay: "90ms" }}
          >
            Hello, I&apos;m
          </p>

          {/* 极光文字标题
              ⚠️ 实测结论（不要再改回「双层叠加」）：
              aurora-text 依赖 background-clip:text。给它的**子 span** 加
              transform / opacity / filter 动画，渐变会被切断 → 文字退化成实色
              （此前用双层叠加会留下 1px 亚像素重影，已修掉）。
              唯一安全且仍有「逐词揭示」手感的做法：单个 aurora-text 容器，
              子 span 只做 clip-path 揭示（clip-path 不影响背景切片的绘制）。
              读屏只念一次：容器 aria-hidden，sr-only 提供完整文本。

              间距说明：leading-[0.98] 会压掉行框上下留白，大字号的字形上缘
              （尤其 Latin 大写与中文混排）容易顶到上一行的 "HELLO, I'M"。
              因此这里给足 mt（移动端略小），并在下方 subtitle 也留出对应间距。

              下伸部空间：leading-[1.02] 的行框底部不足以容纳 g/y/p/j/q 的下伸部分
              （Kuang 的 g 会伸出行框）。这里用 pb 把行框底部撑开，
              避免副标题按行框边界上移后压住字形。 */}
          <h1 className="mt-6 text-[clamp(2.6rem,9vw,5.6rem)] font-black leading-[1.12] tracking-[-0.035em] sm:mt-7 lg:mt-8">
            <span className="sr-only">{NAME}</span>
            {/* 炫酷强化：真实三层色散（chromatic aberration）
                ⚠️ 关键约束（代码注释里记录过的坑，不要重犯）：
                aurora-text 依赖 background-clip:text，文字 fill 本身是透明的，
                所以 text-shadow 画在透明字形后面几乎不可见（上一版就栽在这）。
                改用「三个绝对定位的文字层」做红/青分离 + 一个主体渐变层：
                  - 两个色散层是**实色**（不含渐变、无 clip），所以不会互相干扰
                  - 主体层保持 aurora-text 渐变
                  - 色散层偏移 ±3px 并加 mix-blend-mode: screen，产生发光叠加
                可访问性：全部 aria-hidden，真实文本由外层 sr-only 提供（不变）。 */}
            <span className="relative inline-flex flex-wrap items-baseline justify-center gap-x-[0.24em] pb-[0.12em]">
              {/* 红色色散层（左偏） */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 flex flex-wrap items-baseline justify-center gap-x-[0.24em] text-[#ff3c78] opacity-70 [transform:translate(-4px,-1px)] blur-[0.6px]"
              >
                {NAME.split(" ").map((word) => (
                  <span key={`r-${word}`} className="inline-block">{word}</span>
                ))}
              </span>
              {/* 青色色散层（右偏） */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 flex flex-wrap items-baseline justify-center gap-x-[0.24em] text-[#3ce8ff] opacity-65 [transform:translate(4px,1px)] blur-[0.6px]"
              >
                {NAME.split(" ").map((word) => (
                  <span key={`c-${word}`} className="inline-block">{word}</span>
                ))}
              </span>
              {/* 主体渐变层 */}
              <span
                aria-hidden="true"
                className="aurora-text relative z-10 inline-flex flex-wrap items-baseline justify-center gap-x-[0.24em] [filter:drop-shadow(0_0_30px_rgba(124,92,255,0.55))_drop-shadow(0_0_70px_rgba(65,105,255,0.35))]"
              >
                {NAME.split(" ").map((word, i) => (
                  <span
                    key={word}
                    className="fx-clip-reveal inline-block"
                    style={{ "--fx-delay": `${160 + i * 115}ms` }}
                  >
                    {word}
                  </span>
                ))}
              </span>
            </span>
          </h1>

          {/* 副标题 */}
          <div
            className="mt-6 flex animate-[fade-in_0.9s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none items-center gap-3 text-sm text-muted sm:mt-7 sm:text-base"
            style={{ animationDelay: "640ms" }}
          >
            <span
              aria-hidden="true"
              className="h-px w-8 bg-gradient-to-r from-transparent to-primary-soft/70"
            />
            <span className="font-medium tracking-[0.18em] text-foreground/90">
              全栈开发工程师
            </span>
            <span
              aria-hidden="true"
              className="h-px w-8 bg-gradient-to-l from-transparent to-cyan-soft/70"
            />
          </div>

          {/* 定位文案 */}
          <p
            className="mt-7 max-w-2xl animate-[fade-in_0.9s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none text-balance text-base leading-relaxed text-muted sm:text-lg"
            style={{ animationDelay: "720ms" }}
          >
            {POSITIONING}
          </p>

          {/* 主/次 CTA */}
          <div
            className="mt-10 flex w-full animate-[fade-in_0.9s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none flex-col items-center gap-3 sm:w-auto sm:flex-row"
            style={{ animationDelay: "820ms" }}
          >
            {/* 磁吸 + 涟漪：位移由 MagneticButton 直接写 transform，不触发重渲染 */}
            <MagneticButton className="w-full sm:w-auto">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener"
                data-fx-ripple=""
                className="cosmic-button fx-ripple-host group w-full text-sm sm:w-auto"
              >
                <GithubMark className="h-4 w-4" />
                访问 GitHub
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </MagneticButton>
            <MagneticButton className="w-full sm:w-auto">
              <a
                href="#contact"
                data-fx-ripple=""
                className="ghost-button fx-ripple-host group w-full text-sm sm:w-auto"
              >
                <Sparkles className="h-4 w-4 text-primary-soft transition-transform duration-300 group-hover:rotate-12" />
                联系我
              </a>
            </MagneticButton>
          </div>

          {/* 三项速览 */}
          <dl
            ref={statsRef}
            className="mt-14 grid w-full max-w-2xl animate-[fade-in_0.9s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md sm:grid-cols-3"
            style={{ animationDelay: "920ms" }}
          >
            {HIGHLIGHTS.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1 bg-[#07080f]/60 px-4 py-4 transition-colors duration-300 hover:bg-primary/[0.08]"
              >
                <dt className="text-[0.62rem] uppercase tracking-[0.28em] text-subtle">
                  {item.label}
                </dt>
                <dd className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  {item.label === "位置" && (
                    <MapPin className="h-3.5 w-3.5 text-cyan-soft" aria-hidden="true" />
                  )}
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* 底部滚动提示 */}
      <a
        href="#about"
        aria-label="向下滚动查看关于我"
        className="group absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 animate-[fade-in_1s_cubic-bezier(0.22,1,0.36,1)_1.1s_both] motion-reduce:animate-none flex-col items-center gap-2"
      >
        <span className="text-[0.62rem] uppercase tracking-[0.42em] text-subtle transition-colors duration-300 group-hover:text-primary-soft">
          Scroll
        </span>
        <span className="relative grid h-9 w-9 place-items-center rounded-full border border-white/[0.12] bg-white/[0.03] text-primary-soft backdrop-blur-md transition-all duration-300 group-hover:border-primary-soft/50 group-hover:bg-primary/[0.12]">
          <ArrowDown className="h-4 w-4 animate-bounce" />
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full border border-primary-soft/30 [animation-duration:2.6s] motion-reduce:animate-none"
          />
        </span>
      </a>
    </section>
  );
}
