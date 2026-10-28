import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BurstParticles from "./BurstParticles";
import "./intro.css";

/**
 * 首屏开场动画（Intro Loader）
 *
 * 叙事（duration 1800ms + 圆形扩散开屏）：
 *   0.00–0.34  gather   能量聚集：粒子螺旋吸入中心、核心聚光、数字跳动、环形进度
 *   0.34–0.50  burst    冲击爆发：多层冲击波、粒子四散、白闪、色环扩散
 *   0.50–0.72  reveal   品牌揭示：名字逐字亮起、数据条扫过、光斑环绕
 *   0.72–1.00  curtain  中心圆形扩散开屏：以圆心为起点，一个圆从屏幕正中放大
 *                       直到覆盖全屏并消失，露出真实页面（不再是从下往上）
 *
 * 无障碍：
 * - 无跳过按钮（按体验反馈去掉）；仅保留 prefers-reduced-motion 极简降级；
 * - 遮罩挡住指针，避免误点下面的内容；结束后节点整体移除，不残留 a11y 树。
 *
 * 性能：粒子逻辑在 BurstParticles（Canvas + 对象复用 + dpr 上限），
 * 本组件只负责时间轴与 DOM 层，避免每帧 React 重渲染。
 */

/* 时间轴（与 intro.css 的关键帧比例对应，改动时请同步） */
const TIMELINE = {
  gatherEnd: 0.34,
  burstEnd: 0.5,
  revealStart: 0.5,
  curtainStart: 0.72,
};

export default function IntroLoader({ duration = 1800, reduced = false, onFinish }) {
  const [progress, setProgress] = useState(0); // 0..1
  const [phase, setPhase] = useState("gather"); // gather | burst | reveal | curtain
  const [exiting, setExiting] = useState(false);

  const finishedRef = useRef(false);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  /* 收尾：先播圆形扩散开屏，再通知父级卸载。
     ⚠️ 时序必须与 intro.css 的开屏动画（820ms）严格对齐：
     留 900ms 再卸载。早于动画结束就卸载，遮罩会在「圆还没铺满」时消失，
     观感就成了「直接跳到页面」，完全看不到扩散过程（实测踩过这个坑）。 */
  const finish = useCallback(
    (immediate = false) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setExiting(true);
      const delay = immediate ? 0 : reduced ? 180 : 980;
      window.setTimeout(() => onFinish?.(), delay);
    },
    [onFinish, reduced],
  );

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

  /* 锁定滚动，避免开场时背景已经在滚 */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const count = Math.round(progress * 100);

  const stages = useMemo(
    () => [
      { key: "link", label: "连接", at: 0 },
      { key: "boot", label: "引导", at: 0.16 },
      { key: "load", label: "载入", at: 0.34 },
      { key: "render", label: "渲染", at: 0.56 },
      { key: "ready", label: "就绪", at: 0.78 },
    ],
    [],
  );

  /* 环绕光点：品牌揭示阶段绕标题缓慢旋转 */
  const orbitDots = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);

  return (
    <div
      className="intro-root"
      data-phase={phase}
      data-exiting={exiting ? "true" : "false"}
      role="status"
      aria-live="polite"
      aria-label="正在加载页面"
    >
      {/* ---------- 0 层：深空底 + 极光 + 网格 + 星尘 ---------- */}
      <div className="intro-bg" aria-hidden="true">
        <div className="intro-aurora intro-aurora-a" />
        <div className="intro-aurora intro-aurora-b" />
        <div className="intro-aurora intro-aurora-c" />
        <div className="intro-grid" />
        <div className="intro-stars" />
        {/* 旋转的同心刻度环：给出「仪表」的技术感 */}
        <div className="intro-ticks">
          <svg viewBox="0 0 400 400" aria-hidden="true">
            <circle className="intro-ticks-ring" cx="200" cy="200" r="150" />
            <circle className="intro-ticks-ring intro-ticks-ring-2" cx="200" cy="200" r="186" />
          </svg>
        </div>
      </div>

      {/* ---------- 1 层：粒子冲击波 ---------- */}
      <div className="intro-canvas-wrap" aria-hidden="true">
        {/* paused={exiting}：开屏（「就绪」→ 露出首屏）时立刻停掉粒子的 rAF。
            否则它会和门板推开抢同一帧，正是用户反馈的展开卡顿来源。 */}
        {!reduced && (
          <BurstParticles duration={duration} reduced={reduced} paused={exiting} />
        )}
      </div>

      {/* ---------- 2 层：中心内容 ---------- */}
      <div className="intro-center" aria-hidden="true">
        {/* 倒计时：数字绝对居中于圆环中心（不再用 top 硬偏移） */}
        <div className="intro-counter">
          <div className="intro-ring-wrap">
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
            {/* 数字与百分号：与圆环同心 */}
            <div className="intro-count">
              <span className="intro-count-num">{String(count).padStart(3, "0")}</span>
              <span className="intro-count-pct">%</span>
            </div>
          </div>
        </div>

        {/* 品牌揭示 */}
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
          {/* 标题下的辉光扫线 */}
          <div className="intro-brand-sweep" />
          <div className="intro-brand-sub">正在进入 · 个人主页</div>

          {/* 环绕光点 */}
          <div className="intro-orbit">
            {orbitDots.map((i) => (
              <span
                key={i}
                className="intro-orbit-dot"
                style={{ "--i": i, "--n": orbitDots.length }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ---------- 3 层：爆闪 ---------- */}
      <div className="intro-flash" aria-hidden="true" />

      {/* ---------- 4 层：色环扩散（burst 时多色圈向外推） ---------- */}
      <div className="intro-rings" aria-hidden="true">
        <span className="intro-pulse-ring" />
        <span className="intro-pulse-ring" />
        <span className="intro-pulse-ring" />
      </div>

      {/* ---------- 5 层：扫描线 ---------- */}
      <div className="intro-scan" aria-hidden="true" />

      {/* ---------- 6 层：底部进度条 + 阶段刻度 ---------- */}
      <div className="intro-progress" aria-hidden="true">
        <div className="intro-progress-bar" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <div className="intro-stages" aria-hidden="true">
        {stages.map((s) => (
          <span
            key={s.key}
            className="intro-stage"
            data-on={progress >= s.at ? "true" : "false"}
          >
            {s.label}
          </span>
        ))}
      </div>

      {/* ---------- 7 层：角标 ---------- */}
      <div className="intro-corner intro-corner-tl" aria-hidden="true">
        <span className="intro-corner-mark">KZ</span>
        <span className="intro-corner-text">PORTFOLIO / 2026</span>
      </div>
      <div className="intro-corner intro-corner-br" aria-hidden="true">
        <span className="intro-corner-text">LOADING ASSETS</span>
        <span className="intro-corner-mark">{String(count).padStart(3, "0")}</span>
      </div>

      {/* ---------- 8 层：圆形扩散的光环 ----------
          注意：真正的「开屏」动作是 4 块门板向外推开（见 .intro-shutter*），
          这一层只叠一圈随扩张同步放大的描边，让圆心边缘有发光感。 */}
      <div className="intro-iris" aria-hidden="true">
        <span className="intro-iris-halo" />
      </div>

      {/* ---------- 9 层：开屏门板 ----------
          性能关键：开屏动作**不能**再用 mask-image 径向渐变动画。
          那会让浏览器每帧重算整屏的 alpha 蒙版，实测开屏阶段只有 8.7fps，
          观感就是「一帧一帧地跳」。
          改为 4 块面板各自动 transform 向外推开：
          - 纯 transform 走合成层，GPU 直接出图，不重算任何像素；
          - 四块拼起来正好覆盖全屏，向各自方向平移后中间自然露出页面。
          data-exiting 时由 CSS 触发，使用 will-change 提前提升为合成层。 */}
      <div className="intro-shutter" aria-hidden="true">
        <span className="intro-shutter-panel intro-shutter-top" />
        <span className="intro-shutter-panel intro-shutter-bottom" />
        <span className="intro-shutter-panel intro-shutter-left" />
        <span className="intro-shutter-panel intro-shutter-right" />
      </div>
    </div>
  );
}
