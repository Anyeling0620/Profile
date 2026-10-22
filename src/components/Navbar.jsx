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

  /* ---------- 3. 高亮胶囊滑块：测量当前项位置 ---------- */
  const measureIndicator = useCallback(() => {
    const index = navItems.findIndex((item) => item.id === activeId);
    const el = linkRefs.current[index];
    if (!el) return;
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
  }, [activeId]);

  useEffect(() => {
    measureIndicator();
    /* 字体加载/窗口尺寸变化后重新测量，避免滑块错位 */
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
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[var(--z-nav)] flex flex-col items-center px-3 pt-3 sm:px-4 sm:pt-4">
      {/* 阅读进度线（滚动后显现） */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.06] transition-opacity duration-500",
          isScrolled ? "opacity-100" : "opacity-0",
        )}
      >
        <div
          className="h-full origin-left bg-gradient-to-r from-primary via-accent to-cyan shadow-[0_0_12px_rgba(124,92,255,0.85)]"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      {/* 悬浮玻璃胶囊 */}
      <nav
        aria-label="主导航"
        className={cn(
          "glass-edge pointer-events-auto relative flex w-full items-center justify-between gap-2 overflow-hidden rounded-full border",
          "transition-[max-width,padding,background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isScrolled
            ? "max-w-4xl border-white/[0.14] bg-[rgba(7,9,16,0.72)] px-3 py-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_22px_60px_-28px_rgba(0,0,0,0.95),0_0_40px_-16px_rgba(124,92,255,0.55)] backdrop-blur-2xl backdrop-saturate-150"
            : "max-w-5xl border-white/[0.08] bg-[rgba(9,11,20,0.42)] px-3 py-2.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07),0_18px_50px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl backdrop-saturate-125",
        )}
      >
        {/* 品牌 */}
        <a
          href="#hero"
          onClick={() => handleNavigate("hero")}
          className="group flex shrink-0 items-center gap-2 rounded-full pl-1 pr-2 py-0.5"
        >
          <span
            aria-hidden="true"
            className={cn(
              "relative grid place-items-center rounded-[0.7rem] bg-gradient-to-br from-[#8b6dff] via-[#7c5cff] to-[#4169ff] font-bold text-[#05060a]",
              "shadow-[0_0_18px_-4px_rgba(124,92,255,0.9)] transition-all duration-500 group-hover:shadow-[0_0_26px_-2px_rgba(124,92,255,1)]",
              isScrolled ? "h-7 w-7 text-[0.7rem]" : "h-8 w-8 text-xs",
            )}
          >
            KZ
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="text-[0.86rem] font-bold tracking-tight text-foreground sm:text-sm">
              Kuang Zihao
            </span>
            <span className="mt-0.5 hidden text-[0.62rem] uppercase tracking-[0.28em] text-subtle sm:block">
              Portfolio
            </span>
          </span>
        </a>

        {/* 桌面端导航：滑块高亮 */}
        <div className="relative hidden items-center gap-1 md:flex">
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full border border-white/[0.12] bg-white/[0.06]",
              "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_0_22px_-8px_rgba(124,92,255,0.9)]",
              "transition-[left,width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              indicator.ready ? "opacity-100" : "opacity-0",
            )}
            style={{
              left: `${indicator.left}px`,
              width: `${indicator.width}px`,
              height: isScrolled ? "1.9rem" : "2.15rem",
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
                  "fx-ripple-host group/nav relative z-10 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-300",
                  isActive
                    ? "text-foreground [text-shadow:0_0_18px_rgba(185,166,255,0.55)]"
                    : "text-muted hover:text-foreground",
                )}
              >
                {item.name}
                {/* 下划线：当前项常驻；hover 时从中间向两端展开 */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-3 -bottom-0.5 h-px origin-center bg-gradient-to-r from-transparent via-primary-soft to-transparent transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    isActive ? "scale-x-100" : "scale-x-0 group-hover/nav:scale-x-100",
                  )}
                />
                {/* hover 光晕跟随：柔和的背后光斑 */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(124,92,255,0.28),transparent_70%)] opacity-0 blur-md transition-opacity duration-300 group-hover/nav:opacity-100"
                />
              </a>
            );
          })}
        </div>

        {/* 右侧动作区 */}
        <div className="flex shrink-0 items-center gap-1.5">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener"
            data-fx-ripple=""
            className="fx-ripple-host group hidden items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-muted transition-all duration-300 hover:border-primary-soft/40 hover:bg-primary/[0.12] hover:text-foreground active:scale-95 sm:flex"
          >
            <GithubMark className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
            GitHub
          </a>

          <a
            href="#contact"
            onClick={() => handleNavigate("contact")}
            className="hidden rounded-full bg-gradient-to-r from-[#8b6dff] to-[#4169ff] px-4 py-1.5 text-xs font-bold text-[#05060a] shadow-[0_8px_24px_-12px_rgba(124,92,255,0.95)] transition-transform duration-300 hover:-translate-y-0.5 md:inline-flex"
          >
            联系我
          </a>

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label={isMenuOpen ? "关闭菜单" : "打开菜单"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav-drawer"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.1] bg-white/[0.04] text-foreground transition-colors duration-300 hover:border-primary-soft/40 hover:bg-primary/[0.12] md:hidden"
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* ---------- 移动端全屏玻璃抽屉（错峰进场） ---------- */}
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
                "text-[0.68rem] uppercase tracking-[0.4em] text-subtle transition-all duration-500",
                isMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
              )}
              style={{ transitionDelay: isMenuOpen ? "80ms" : "0ms" }}
            >
              Navigation
            </span>
            <button
              ref={closerRef}
              type="button"
              onClick={() => setIsMenuOpen(false)}
              aria-label="关闭菜单"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.12] bg-white/[0.05] text-foreground transition-colors duration-300 hover:border-primary-soft/40 hover:bg-primary/[0.14]"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* 错峰进场导航项 */}
          <nav aria-label="移动端导航项" className="mt-10 flex flex-1 flex-col justify-center gap-2">
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
                    "group flex items-center justify-between rounded-2xl border px-5 py-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
                    isActive
                      ? "border-primary-soft/30 bg-primary/[0.12] text-foreground shadow-[0_0_32px_-16px_rgba(124,92,255,0.9)]"
                      : "border-white/[0.07] bg-white/[0.02] text-muted",
                  )}
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-[0.65rem] tracking-[0.2em] text-subtle">
                      0{index + 1}
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
          </nav>

          {/* 抽屉底部 */}
          <div
            className={cn(
              "flex flex-col gap-4 border-t border-white/[0.08] pt-5 transition-all duration-500",
              isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
            )}
            style={{ transitionDelay: isMenuOpen ? `${140 + navItems.length * 70}ms` : "0ms" }}
          >
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener"
              className="flex items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-4 py-3 text-sm font-medium text-foreground transition-colors duration-300 hover:border-primary-soft/40 hover:bg-primary/[0.12]"
            >
              <GithubMark className="h-4 w-4" />
              github.com/Anyeling0620
            </a>
            <p className="text-center text-[0.68rem] tracking-[0.2em] text-subtle">
              KUANG ZIHAO · FULLSTACK
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
