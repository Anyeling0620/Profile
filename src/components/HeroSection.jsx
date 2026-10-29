import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUpRight, MapPin } from "lucide-react";
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

/* 速览三项。编辑式版面里不再堆成同构玻璃卡片，
   而是排成「标签 : 值」的 tabular 行，只用细线分隔。 */
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
     在低端机上直接变成掉帧源。现在每帧只改 3~4 个元素的 transform。

     注意：改版式时这段逻辑必须原样保留（含 layers 的档位系数），
     它已按各层视觉深度调好，重新调参只会让位移失真。 */
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
      className="relative overflow-hidden pb-16 pt-32 sm:pb-20 sm:pt-36"
    >
      {/* ---------- 背景层（纯装饰） ----------
          性能说明：光斑不使用 filter: blur()。实测超大元素「blur + transform 动画」
          会把帧间隔从 16.7ms 拉到 83~100ms；这里改用多段柔和渐变实现同样的羽化观感。
          光斑按新的非对称版式重排：主光斑压右上（名字占左侧，右侧留白），
          副光斑落左侧中部，第三层收右下角。 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* 极光光斑：视差层 > 呼吸层 */}
        <div ref={glow1Ref} className="absolute right-[-6%] top-[-18%]">
          <div className="h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.34)_0%,rgba(124,92,255,0.24)_16%,rgba(124,92,255,0.14)_32%,rgba(124,92,255,0.06)_46%,rgba(124,92,255,0.02)_58%,transparent_70%)] fx-breathe" />
        </div>
        <div ref={glow2Ref} className="absolute left-[-12%] top-[26%]">
          <div className="h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(65,105,255,0.28)_0%,rgba(65,105,255,0.2)_16%,rgba(65,105,255,0.11)_32%,rgba(65,105,255,0.05)_46%,rgba(65,105,255,0.015)_58%,transparent_70%)] animate-[float_9s_ease-in-out_infinite] motion-reduce:animate-none" />
        </div>
        <div ref={glow3Ref} className="absolute bottom-[-14%] right-[-8%]">
          <div className="h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.2)_0%,rgba(34,211,238,0.14)_16%,rgba(34,211,238,0.08)_32%,rgba(34,211,238,0.035)_46%,rgba(34,211,238,0.01)_58%,transparent_72%)] animate-[float_11s_ease-in-out_infinite_1.2s] motion-reduce:animate-none" />
        </div>
        {/* 透视地平线网格 + 细网格 */}
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
        {/* 顶部渐隐（衔接导航栏） / 底部渐隐（衔接下一板块） */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#05060a] via-[#05060a]/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#05060a] to-transparent" />
      </div>

      {/* ---------- 编辑式版式 ----------
          .editorial-shell 提供非对称页边（桌面起始侧 1.7×），并已把 text-align 设为 start。
          ⚠️ 这一层里不能再出现任何 text-center / justify-center / items-center 的主轴居中，
          否则编辑式排版会被拉回「居中堆叠」的模板语法。 */}
      <div className="editorial-shell relative z-10">
        <div className="editorial-grid items-start">
          {/* ============ 板块索引条 ============
              编辑式版面用「01 / INTRO」这种栏目编号建立阅读顺序。
              .rule-index 自带 tabular-nums 序号 + 贯穿到右侧的细线：
              ::before 是序号，子元素落在中间列，::after 吃掉剩余宽度画线。
              ⚠️ --index 的值必须带引号（CSS content 需要字符串）。 */}
          <div className="col-span-4 md:col-span-8 lg:col-span-12">
            <div
              className="rule-index animate-[fade-in_0.9s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none"
              style={{ "--index": "'01'" }}
            >
              <span className="label-caps text-muted">Intro</span>
            </div>
          </div>

          {/* ============ 问候语 ============
              比名字小两个数量级——编辑式的特征正是「超大 vs 极小」的高反差。 */}
          <p
            className="col-span-4 mt-10 animate-[fade-in_0.9s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none label-caps text-subtle md:col-span-8 md:mt-12 lg:col-span-7 lg:mt-14"
            style={{ animationDelay: "90ms" }}
          >
            Hello, I&apos;m
          </p>

          {/* ============ 名字：type-as-hero，左对齐偏轴 ============
              版式要点（每条都是踩过的坑）：
              1) 左对齐、只占 11/12 列 → 右侧留出不对称空白，视线被名字拽住。
              2) 用 .editorial-text（实色 #f2f4ff，对比度 18.48:1）替代 aurora-text。
                 **不要在这里再叠 aurora-text**：两者混用会让 -webkit-text-fill-color
                 互相覆盖，渐变被切成实色块。
              3) 换成实色后，子 span 的 clip-path 揭示是安全的——
                 「子元素不能动 transform/opacity」的约束只对 background-clip:text 成立。
                 fx-clip-reveal 末帧落到 clip-path:none，不会沿行框底切掉下伸部。
              4) type-display 的 leading 是 0.96，行框上下几乎没余量：
                 用内联 lineHeight 略放松 + paddingBottom 撑开行框底，
                 避免 "Zihao" 的下伸部压到下面的副标题。
              5) 读屏只念一次：容器 aria-hidden，sr-only 提供完整文本。 */}
          <h1
            className="grain-soft editorial-text type-display col-span-4 mt-4 animate-[fade-in_0.9s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none md:col-span-8 md:mt-5 lg:col-span-11 lg:mt-6"
            style={{
              animationDelay: "140ms",
              lineHeight: "1.02",
              paddingBottom: "0.14em",
            }}
          >
            <span className="sr-only">{NAME}</span>
            <span
              aria-hidden="true"
              className="inline-flex flex-wrap items-baseline gap-x-[0.2em]"
            >
              {NAME.split(" ").map((word, i) => (
                <span
                  key={word}
                  className="fx-clip-reveal inline-block"
                  style={{ "--fx-delay": `${180 + i * 115}ms` }}
                >
                  {word}
                </span>
              ))}
            </span>
          </h1>

          {/* ============ 副标题 ============
              细线 + 小号大写宽字距，替换原来的渐变短横线。 */}
          <div
            className="col-span-4 mt-6 flex animate-[fade-in_0.9s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none items-center gap-3 md:col-span-8 lg:col-span-7"
            style={{ animationDelay: "560ms" }}
          >
            <span aria-hidden="true" className="rule-hair-short flex-none" />
            <span className="label-caps text-foreground">全栈开发工程师</span>
          </div>

          {/* ============ 左栏：导语 + CTA ============
              限宽到 .editorial-measure（62ch ≈ 中文 38~40 字/行），保证可读行长。 */}
          <div
            className="col-span-4 mt-10 flex animate-[fade-in_0.9s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none flex-col gap-6 md:col-span-8 md:mt-12 lg:col-span-6 lg:mt-16"
            style={{ animationDelay: "640ms" }}
          >
            <p className="editorial-measure type-lede">{POSITIONING}</p>

            {/* 主/次 CTA：磁吸 + 涟漪全部保留。
                位移由 MagneticButton 直接写 transform，不触发重渲染。 */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                  联系我
                  <ArrowUpRight className="h-4 w-4 text-primary-soft transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </MagneticButton>
            </div>
          </div>

          {/* ============ 右栏：状态 + tabular 速览 ============
              起始列后移到第 9 列，与左栏错位，形成编辑式版面里常见的「两栏不齐头」。
              视差层 badgeRef / statsRef 挂这里，档位（6 / 11）与原实现一致。 */}
          <div className="col-span-4 mt-10 md:col-span-8 lg:col-span-4 lg:col-start-9 lg:mt-16">
            <div ref={badgeRef} className="flex items-center gap-2.5">
              <span className="relative flex h-1.5 w-1.5 flex-none">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
              </span>
              <span className="label-caps text-muted">可接受新的合作</span>
            </div>

            {/* 三项速览：原来带边框的玻璃卡片是模板感最重的一处，
                现在改成「标签 : 值」的 tabular 行，只用细线分隔。
                线色走 --color-rule（16% 冷白）；2dppx 下 border 1px 视觉上接近 0.5px。 */}
            <dl
              ref={statsRef}
              className="mt-5 animate-[fade-in_0.9s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none"
              style={{ animationDelay: "720ms" }}
            >
              {HIGHLIGHTS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-baseline justify-between gap-4 border-t py-2.5"
                  style={{ borderTopColor: "var(--color-rule)" }}
                >
                  <dt className="label-caps flex-none text-subtle">{item.label}</dt>
                  <dd className="flex items-center gap-1.5 text-right text-sm font-medium text-foreground">
                    {item.label === "位置" && (
                      <MapPin className="h-3.5 w-3.5 flex-none text-cyan-soft" aria-hidden="true" />
                    )}
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ============ 底部滚动提示 ============
              从「正中」移到版心右下：细线先拉通整行，再落 Scroll 标签。 */}
          <div className="col-span-4 mt-12 flex items-center gap-4 md:col-span-8 lg:col-span-12 lg:mt-16">
            <span aria-hidden="true" className="rule-hair flex-1" />
            <a
              href="#about"
              aria-label="向下滚动查看关于我"
              className="group flex flex-none animate-[fade-in_1s_cubic-bezier(0.22,1,0.36,1)_1.1s_both] motion-reduce:animate-none items-center gap-2.5"
            >
              <span className="label-caps text-subtle transition-colors duration-300 group-hover:text-primary-soft">
                Scroll
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-full border border-transparent text-primary-soft transition-colors duration-300 group-hover:border-[color:var(--color-rule)]">
                <ArrowDown className="h-4 w-4 animate-bounce" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
