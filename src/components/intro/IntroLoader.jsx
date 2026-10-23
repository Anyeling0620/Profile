import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BurstParticles from "./BurstParticles";
import "./intro.css";

/**
 * 首屏开场动画（Intro Loader）
 *
 * 叙事（默认总时长 2200ms）：
 *   0.00–0.42  能量聚集：粒子螺旋吸入中心，中心核心逐渐聚光，倒计时数字快速跳动
 *   0.42–0.62  冲击爆发：两圈冲击波扩散 + 粒子四散 + 全屏白闪
 *   0.62–0.90  品牌揭示：名字逐字亮起，副标题与进度条跟进
 *   0.90–1.00  幕布上移揭开，露出真实页面
 *
 * 无障碍与可用性：
 * - 右下角「跳过」随时可点（也可按 Esc / 回车）；
 * - prefers-reduced-motion 时不放粒子与白闪，直接走极简的 400ms 淡出；
 * - 期间不锁滚动，但遮罩挡住指针，避免误点下面的内容；
 * - 用 aria-live 报一次「正在加载」，结束后移除节点（不残留到 a11y 树）。
 *
 * 性能：粒子的耗时逻辑都在 BurstParticles 里（Canvas + 对象复用 + dpr 上限），
 * 本组件只负责时间轴与 DOM 层动画，避免每帧 React 重渲染。
 */

/* 时间轴（与 intro.css 的关键帧比例对应，改动时请同步）
   0.00–0.40  gather  能量聚集 + 数字跳动
   0.40–0.52  burst   冲击波爆发 + 白闪
   0.52–0.62  过渡    倒计时块快速退场（留出干净的呼吸，不与品牌叠字）
   0.62–0.88  reveal  品牌逐字揭示
   0.88–1.00  curtain 幕布上移揭开 */
const TIMELINE = {
  gatherEnd: 0.4,
  burstEnd: 0.52,
  revealStart: 0.62,
  curtainStart: 0.88,
};

export default function IntroLoader({
  duration = 2200,
  reduced = false,
  onFinish,
}) {
  const [progress, setProgress] = useState(0); // 0..1
  const [phase, setPhase] = useState("gather"); // gather | burst | reveal | curtain
  const [exiting, setExiting] = useState(false);
  const [count, setCount] = useState(0);

  const finishedRef = useRef(false);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  /* 收尾：先播幕布上移，再通知父级卸载 */
  const finish = useCallback(
    (immediate = false) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setExiting(true);
      const delay = immediate ? 0 : reduced ? 160 : 520;
      window.setTimeout(() => onFinish?.(), delay);
    },
    [onFinish, reduced],
  );

  const skip = useCallback(() => finish(true), [finish]);

  useEffect(() => {
    if (reduced) {
      /* 减弱动效：不跑时间轴，短暂停留后直接揭开 */
      const t = window.setTimeout(() => finish(), 380);
      return () => window.clearTimeout(t);
    }

    startRef.current = performance.now();

    const tick = (now) => {
      const p = Math.min((now - startRef.current) / duration, 1);
      setProgress(p);
      /* 进度用于驱动倒计时数字：0→100 */
      setCount(Math.round(p * 100));

      const nextPhase =
        p < TIMELINE.gatherEnd
          ? "gather"
          : p < TIMELINE.burstEnd
            ? "burst"
            : p < TIMELINE.curtainStart
              ? "reveal"
              : "curtain";

      setPhase((prev) => (prev === nextPhase ? prev : nextPhase));

      if (p >= 1) {
        finish();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [duration, reduced, finish]);

  /* 键盘：Esc / 回车 / 空格 均可跳过 */
  useEffect(() => {
    const onKey = (e) => {
      if (["Escape", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skip]);

  /* 锁定滚动，避免开场时背景已经在滚 */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const dots = useMemo(
    () => [
      { delay: "0ms", label: "连接" },
      { delay: "140ms", label: "渲染" },
      { delay: "280ms", label: "就绪" },
    ],
    [],
  );

  return (
    <div
      className="intro-root"
      data-phase={phase}
      data-exiting={exiting ? "true" : "false"}
      role="status"
      aria-live="polite"
      aria-label="正在加载页面"
    >
      {/* 0 层：深空底 + 极光斑（粒子之外的氛围） */}
      <div className="intro-bg" aria-hidden="true">
        <div className="intro-aurora intro-aurora-a" />
        <div className="intro-aurora intro-aurora-b" />
        <div className="intro-aurora intro-aurora-c" />
        <div className="intro-grid" />
      </div>

      {/* 1 层：粒子冲击波 */}
      <div className="intro-canvas-wrap" aria-hidden="true">
        {!reduced && (
          <BurstParticles duration={duration} reduced={reduced} />
        )}
      </div>

      {/* 2 层：中心内容 —— 倒计时数字 → 品牌揭示 */}
      <div className="intro-center" aria-hidden="true">
        {/* 倒计时阶段：巨大的数字 + 环形进度 */}
        <div className="intro-counter">
          <svg className="intro-ring" viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <linearGradient id="intro-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c5cff" />
                <stop offset="55%" stopColor="#4169ff" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <circle className="intro-ring-track" cx="100" cy="100" r="88" />
            <circle
              className="intro-ring-bar"
              cx="100"
              cy="100"
              r="88"
              stroke="url(#intro-ring-grad)"
              style={{ strokeDashoffset: 553 - 553 * progress }}
            />
          </svg>
          <div className="intro-count">
            <span className="intro-count-num">{String(count).padStart(3, "0")}</span>
            <span className="intro-count-pct">%</span>
          </div>
          <div className="intro-status">
            {dots.map((d) => (
              <span className="intro-status-item" key={d.label}>
                <span className="intro-status-dot" style={{ animationDelay: d.delay }} />
                {d.label}
              </span>
            ))}
          </div>
        </div>

        {/* 揭示阶段：品牌名逐字 */}
        <div className="intro-brand">
          <div className="intro-brand-eyebrow">KUANG ZIHAO · FULLSTACK</div>
          <h2 className="intro-brand-title">
            {"KUANG".split("").map((ch, i) => (
              <span key={`a-${i}`} className="intro-char" style={{ "--i": i }}>
                {ch}
              </span>
            ))}
            <span className="intro-brand-gap" />
            {"ZIHAO".split("").map((ch, i) => (
              <span key={`b-${i}`} className="intro-char" style={{ "--i": i + 5 }}>
                {ch}
              </span>
            ))}
          </h2>
          <div className="intro-brand-sub">正在进入 · 个人主页</div>
        </div>
      </div>

      {/* 3 层：爆闪（仅爆发瞬间一闪） */}
      <div className="intro-flash" aria-hidden="true" />

      {/* 4 层：扫描线（横向掠过） */}
      <div className="intro-scan" aria-hidden="true" />

      {/* 5 层：底部进度条 */}
      <div className="intro-progress" aria-hidden="true">
        <div className="intro-progress-bar" style={{ transform: `scaleX(${progress})` }} />
      </div>

      {/* 6 层：角标与技术感装饰 */}
      <div className="intro-corner intro-corner-tl" aria-hidden="true">
        <span className="intro-corner-mark">KZ</span>
        <span className="intro-corner-text">PORTFOLIO / 2026</span>
      </div>
      <div className="intro-corner intro-corner-br" aria-hidden="true">
        <span className="intro-corner-text">LOADING ASSETS</span>
        <span className="intro-corner-mark">{String(count).padStart(3, "0")}</span>
      </div>

      {/* 跳过按钮（真实交互，不 aria-hidden） */}
      <button
        type="button"
        className="intro-skip"
        onClick={skip}
        aria-label="跳过开场动画，直接进入页面"
      >
        跳过 <span className="intro-skip-key">Esc</span>
      </button>
    </div>
  );
}
