import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "../lib/utils";

/* 导航项：只保留首页 / 关于 / 技能 / 联系（「项目」板块已整段删除） */
const navItems = [
  { id: "hero", name: "首页" },
  { id: "about", name: "关于" },
  { id: "skill", name: "技能" },
  { id: "contact", name: "联系" },
];

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

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState("hero");
  const [progress, setProgress] = useState(0);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  const linkRefs = useRef([]);
  const closerRef = useRef(null);

  /* ---------- 1. 滚动状态 + 阅读进度（rAF 节流，避免每帧渲染） ---------- */
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollTop = window.scrollY;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const next = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0;
      setIsScrolled(scrollTop > 24);
      setProgress((prev) => (Math.abs(prev - next) > 0.002 ? next : prev));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  /* ---------- 2. 当前板块高亮：IntersectionObserver 监听中部窄带 ---------- */
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);
    if (!sections.length) return;

    const intersecting = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) intersecting.add(entry.target.id);
          else intersecting.delete(entry.target.id);
        });
        /* 窄带内若同时命中多个，按导航顺序取第一个，保证高亮稳定不抖动 */
        const next = navItems.find((item) => intersecting.has(item.id));
        if (next) setActiveId(next.id);
      },
      /* 视口中部 10% 的窄带作为命中区 */
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => {
      observer.disconnect();
      intersecting.clear();
    };
  }, []);

  /* ---------- 3. 高亮下划线：测量当前项位置 ----------
     编辑式形态下不再用「胶囊滑块」背景，改成贴底的 1px 细线。
     测量逻辑不变（offsetLeft / offsetWidth 取自同一个链接），
     只是消费方式从「背景块」变成「细线」，避免出现一块玻璃底片。 */
  const measureIndicator = useCallback(() => {
    const index = navItems.findIndex((item) => item.id === activeId);
    const el = linkRefs.current[index];
    if (!el) return;
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
  }, [activeId]);

  useEffect(() => {
    measureIndicator();
    /* 字体加载/窗口尺寸变化后重新测量，避免下划线错位 */
    const onResize = () => measureIndicator();
    window.addEventListener("resize", onResize);
    if (document.fonts?.ready) document.fonts.ready.then(measureIndicator).catch(() => {});
    return () => window.removeEventListener("resize", onResize);
  }, [measureIndicator]);

  /* ---------- 4. 移动端抽屉：锁滚动 / Esc 关闭 / 回到桌面宽度自动关闭 ---------- */
  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closerRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 768px)");
    const onBreakpoint = (event) => {
      if (event.matches) setIsMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onBreakpoint);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [isMenuOpen]);

  const handleNavigate = (id) => {
    setActiveId(id);
    setIsMenuOpen(false);
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[var(--z-nav)]">
      {/* 阅读进度线：贴屏幕顶端的 1px 细线，编辑式版面里它替代了「悬浮胶囊阴影」的视觉重量。
          只改 transform 的 scaleX，不触发重排。 */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.06] transition-opacity duration-500",
          isScrolled ? "opacity-100" : "opacity-0",
        )}
      >
        {/* 阅读进度条：单色细线。
            原来是紫→蓝→青三段渐变，那是装饰性彩色渐变，与全站
            「直角 / 实色 / 细线」的编辑式语言冲突（评审也点名了）。
            改成一条单色 hairline：进度是**信息**，不需要配色表演。 */}
        <div
          className="h-full origin-left bg-cyan-soft"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      {/* ---------- 编辑式导航条 ----------
          从「悬浮玻璃胶囊」改成「通栏 + 贴底 hairline」：
          编辑式版面不用圆角玻璃盒子围住导航，而是让导航坐在一条与版心等宽的细线上。
          滚动后只增加一层极淡的背景模糊保证可读性，不加阴影、不加圆角。 */}
      {/* 版心对齐：导航品牌与 Hero 的 .editorial-shell 共用同一套页边距，
          否则导航贴屏幕边、正文贴在 1.7× 页边，两套竖线会让编辑式栅格露馅。 */}
      <div className="pointer-events-auto relative mx-auto w-full [padding-inline:var(--grid-margin)] lg:[padding-inline-start:calc(var(--grid-margin)*1.7)] lg:[padding-inline-end:calc(var(--grid-margin)*0.9)]">
        <nav
          aria-label="主导航"
          className={cn(
            "mx-auto flex w-full max-w-[var(--grid-max)] items-center justify-between gap-4",
            "border-b py-3 transition-[background-color,border-color,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isScrolled
              ? "py-2.5 border-[color:var(--color-rule-strong)] bg-[rgba(5,6,10,0.72)] backdrop-blur-xl"
              : "border-[color:var(--color-rule)] bg-transparent",
          )}
        >
          {/* 品牌：编辑式 lockup —— 主名 + 极小宽字距副标，不用渐变方块 */}
          <a
            href="#hero"
            onClick={() => handleNavigate("hero")}
            className="group flex shrink-0 flex-col items-start leading-none"
          >
            <span
              className={cn(
                "font-black tracking-[-0.02em] text-foreground transition-all duration-500 group-hover:text-primary-soft",
                isScrolled ? "text-[0.95rem] sm:text-base" : "text-base sm:text-[1.05rem]",
              )}
            >
              Kuang Zihao
            </span>
            <span className="mt-1 label-caps hidden text-subtle sm:block">
              Portfolio
            </span>
          </a>

          {/* 桌面端导航：序号 + 名称，贴底细线高亮 */}
          <div className="relative hidden items-end gap-5 md:flex">
            {/* 高亮细线：位置/宽度来自 measureIndicator，只做 left/width 的过渡 */}
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute bottom-0 h-px bg-primary-soft",
                "transition-[left,width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                indicator.ready ? "opacity-100" : "opacity-0",
              )}
              style={{
                left: `${indicator.left}px`,
                width: `${indicator.width}px`,
              }}
            />
            {navItems.map((item, index) => {
              const isActive = activeId === item.id;
              return (
                <a
                  key={item.id}
                  ref={(node) => {
                    linkRefs.current[index] = node;
                  }}
                  href={`#${item.id}`}
                  onClick={() => handleNavigate(item.id)}
                  data-fx-ripple=""
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "fx-ripple-host group/nav relative flex items-baseline gap-1.5 pb-2 pr-0.5 text-sm font-medium transition-colors duration-300",
                    isActive ? "text-foreground" : "text-muted hover:text-foreground",
                  )}
                >
                  {/* 序号：编辑式索引，与 Hero 的「01 / INTRO」同一套语言 */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "font-mono text-[0.6rem] tabular-nums transition-colors duration-300",
                      isActive ? "text-primary-soft" : "text-subtle group-hover/nav:text-muted",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.name}
                </a>
              );
            })}
          </div>

          {/* 右侧动作区 */}
          <div className="flex shrink-0 items-center gap-3">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener"
              data-fx-ripple=""
              className="fx-ripple-host group hidden items-center gap-1.5 border-b border-transparent pb-0.5 text-xs font-medium text-muted transition-colors duration-300 hover:border-[color:var(--color-rule-strong)] hover:text-foreground sm:flex"
            >
              <GithubMark className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
              GitHub
            </a>

            {/* 主 CTA：与 GitHub 链接同一套语法 —— 纯文字 + 悬停下划线，
                不写圆角胶囊、不写紫蓝渐变。导航是页面的"目录页"，
                目录里的链接不需要按钮化的彩色块。 */}
            <a
              href="#contact"
              onClick={() => handleNavigate("contact")}
              className="group hidden items-center gap-1.5 text-xs font-semibold text-foreground md:inline-flex"
            >
              <span className="relative">
                联系我
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-1 h-px origin-left scale-x-100 bg-rule-strong transition-transform duration-300 group-hover:scale-x-100"
                />
              </span>
              <span aria-hidden="true" className="text-cyan-soft">
                →
              </span>
            </a>

            {/* 移动端菜单开关。
                抽屉打开时**隐藏本按钮**：抽屉顶栏自带关闭按钮，两者位置几乎重合
                （实测 326,20/40×40 与 329,23/36×36 叠在一起），会出现「两个 ×」。
                用 opacity + pointer-events 隐藏而非 md:hidden，
                这样关闭动画期间不会突然跳变；同时从可访问性树里移除。 */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label={isMenuOpen ? "关闭菜单" : "打开菜单"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav-drawer"
              aria-hidden={isMenuOpen}
              tabIndex={isMenuOpen ? -1 : 0}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full text-foreground transition-all duration-300 md:hidden",
                isMenuOpen
                  ? "pointer-events-none scale-90 opacity-0"
                  : "pointer-events-auto scale-100 opacity-100",
              )}
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </nav>
      </div>

      {/* ---------- 移动端全屏玻璃抽屉（错峰进场） ----------
          ⚠️ 逻辑区（锁滚动 / Esc / 焦点 / inert / aria）完全沿用原实现，不要在这一段做视觉重构。 */}
      <div
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="移动端导航"
        aria-hidden={!isMenuOpen}
        inert={!isMenuOpen}
        className={cn(
          "fixed inset-0 z-[var(--z-overlay)] md:hidden",
          isMenuOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        {/* 背景玻璃 + 点击关闭 */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setIsMenuOpen(false)}
          className={cn(
            "absolute inset-0 h-full w-full cursor-default bg-[#03040a]/78 backdrop-blur-2xl transition-opacity duration-500",
            isMenuOpen ? "opacity-100" : "opacity-0",
          )}
        />

        {/* 极光光斑（只做装饰，不给文字加 opacity 动画） */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.45),transparent_70%)] blur-3xl transition-opacity duration-700",
            isMenuOpen ? "opacity-100 fx-breathe-slow" : "opacity-0",
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -bottom-20 right-[-10%] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.32),transparent_70%)] blur-3xl transition-opacity duration-700",
            isMenuOpen ? "opacity-100" : "opacity-0",
          )}
        />

        <div className="relative flex h-full flex-col px-6 pb-10 pt-5">
          {/* 抽屉顶栏 */}
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "label-caps text-subtle transition-all duration-500",
                isMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
              )}
              style={{ transitionDelay: isMenuOpen ? "80ms" : "0ms" }}
            >
              Navigation
            </span>
            {/* ⚠️ 关闭按钮的可见性必须由 isMenuOpen 驱动。
                父级的 aria-hidden / inert 只影响可访问性与交互，**不产生视觉隐藏**：
                早期版本漏了这一层，抽屉未打开时这个 × 仍以 opacity:1 渲染，
                与右上角的汉堡叠成「双按钮」（375px 实测两个都可见）。
                这里同时管 opacity + pointer-events，并保留父级 inert / aria-hidden。 */}
            <button
              ref={closerRef}
              type="button"
              onClick={() => setIsMenuOpen(false)}
              aria-label="关闭菜单"
              className={cn(
                "grid h-10 w-10 place-items-center rounded-full text-foreground transition-[opacity,color,transform] duration-300 hover:text-primary-soft",
                isMenuOpen
                  ? "pointer-events-auto scale-100 opacity-100"
                  : "pointer-events-none scale-90 opacity-0",
              )}
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* 错峰进场导航项：编辑式行式列表（序号 + 名称 + 细线分隔） */}
          <nav aria-label="移动端导航项" className="mt-10 flex flex-1 flex-col justify-center">
            {navItems.map((item, index) => {
              const isActive = activeId === item.id;
              const delay = isMenuOpen ? 140 + index * 70 : 0;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => handleNavigate(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex items-baseline justify-between border-t py-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    "border-[color:var(--color-rule)]",
                    isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
                    isActive ? "text-foreground" : "text-muted",
                  )}
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  <span className="flex items-baseline gap-3">
                    <span
                      className={cn(
                        "font-mono text-[0.65rem] tabular-nums tracking-[0.2em]",
                        isActive ? "text-primary-soft" : "text-subtle",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-xl font-bold tracking-tight">{item.name}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "text-sm transition-all duration-300",
                      isActive ? "text-primary-soft" : "text-subtle group-hover:text-primary-soft",
                    )}
                  >
                    →
                  </span>
                </a>
              );
            })}
            {/* 收尾线：让列表底部也有一条线，行式版面才闭合 */}
            <span aria-hidden="true" className="rule-hair" />
          </nav>

          {/* 抽屉底部 */}
          <div
            className={cn(
              "mt-6 flex flex-col gap-4 border-t border-[color:var(--color-rule)] pt-5 transition-all duration-500",
              isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
            )}
            style={{ transitionDelay: isMenuOpen ? `${140 + navItems.length * 70}ms` : "0ms" }}
          >
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener"
              className="flex items-center justify-center gap-2 border-b border-[color:var(--color-rule)] pb-3 text-sm font-medium text-foreground transition-colors duration-300 hover:text-primary-soft"
            >
              <GithubMark className="h-4 w-4" />
              github.com/Anyeling0620
            </a>
            <p className="label-caps text-subtle">
              Kuang Zihao · Fullstack
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
