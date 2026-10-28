import { useEffect, useRef } from "react";

/**
 * 粒子冲击波引擎（Canvas 2D）
 *
 * 叙事分三段（总时长由 duration 控制）：
 *   1) gather  —— 粒子从四周边缘被吸向中心，速度渐快（能量聚集）
 *   2) burst   —— 中心爆发：一圈冲击波环扩散 + 粒子高速四散
 *   3) settle  —— 粒子快速衰减、被吸回中心并淡出，让位给后续的文字揭示
 *
 * 性能取舍（这台机器只有 SwiftShader 软渲染，实测很敏感）：
 * - devicePixelRatio 上限 2，避免高分屏下像素量爆炸；
 * - 粒子数按视口面积估算并封顶，移动端再打折；
 * - 只画 add 混合的实心圆点，不用 shadowBlur（那是巨大的性能陷阱）；
 * - document.hidden 时暂停 rAF；卸载时 cancelAnimationFrame + 移除监听；
 * - 不分配闭包级大对象，粒子用对象池复用。
 */

const TAU = Math.PI * 2;

function hexToRgb(hex) {
  const v = hex.replace("#", "");
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

export default function BurstParticles({
  duration = 2200,
  className = "",
  onDone,
  reduced = false,
  paused = false,
}) {
  const canvasRef = useRef(null);
  const doneRef = useRef(false);
  const pausedRef = useRef(paused);

  /* paused 变化时只更新 ref：不重跑 effect（否则会重建粒子、重置进度） */
  useEffect(() => {
    pausedRef.current = paused;
    if (paused) {
      /* 立即停掉正在跑的 rAF，避免开屏阶段继续耗帧 */
      const canvas = canvasRef.current;
      if (canvas) canvas.style.visibility = "hidden";
    }
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    /* 减弱动效：不启动任何绘制，直接由父级接管收尾 */
    if (reduced) {
      onDone?.();
      return undefined;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return undefined;

    let raf = 0;
    let running = true;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const PALETTE = ["#7c5cff", "#4169ff", "#22d3ee", "#b9a6ff", "#ffffff"].map(
      hexToRgb,
    );

    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    let particles = [];
    let start = 0;
    /* 中心光斑的离屏贴图（resize 时重建一次，之后每帧只 drawImage） */
    let coreSprite = null;
    /* 粒子圆点贴图：白色软边圆，绘制时用 globalAlpha 调透明度、
       用 drawImage 的宽高做缩放。这比每帧 beginPath + arc + fill 快得多，
       尤其在软渲染环境下（arc 需要逐点光栅化路径）。 */
    let dotSprite = null;

    const buildDotSprite = () => {
      const S = 32;
      const off = document.createElement("canvas");
      off.width = S;
      off.height = S;
      const g2 = off.getContext("2d");
      if (!g2) return null;
      const grad = g2.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      grad.addColorStop(0, "rgb(255 255 255 / 1)");
      grad.addColorStop(0.55, "rgb(255 255 255 / 0.85)");
      grad.addColorStop(1, "rgb(255 255 255 / 0)");
      g2.fillStyle = grad;
      g2.fillRect(0, 0, S, S);
      return off;
    };

    /** 预渲染中心径向光斑：64×64 足够，靠 drawImage 放大，成本远低于每帧建渐变 */
    const buildCoreSprite = () => {
      const S = 64;
      const off = document.createElement("canvas");
      off.width = S;
      off.height = S;
      const g2 = off.getContext("2d");
      if (!g2) return null;
      const grad = g2.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      grad.addColorStop(0, "rgb(255 255 255 / 0.9)");
      grad.addColorStop(0.35, "rgb(185 166 255 / 0.55)");
      grad.addColorStop(1, "rgb(124 92 255 / 0)");
      g2.fillStyle = grad;
      g2.fillRect(0, 0, S, S);
      return off;
    };

    const targetCount = () => {
      const area = window.innerWidth * window.innerHeight;
      /* 面积系数：1440x900 约 110 个。
         早期是 8600 系数（约 150 个），在软渲染环境下每帧 clearRect + 150 次
         arc 会明显拖帧，降到 12000 后画面密度几乎无差别，帧率更稳。 */
      let n = Math.round(area / 12000);
      n = Math.min(n, 170);
      if (window.innerWidth < 768) n = Math.round(n * 0.55);
      /* 低性能设备（usePerfGuard 打过标记）再砍一半 */
      if (document.documentElement.dataset.perf === "low") {
        n = Math.round(n * 0.5);
      }
      return Math.max(36, n);
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2;
      cy = h / 2;

      /* 只在 resize 时重建一次光斑贴图 */
      if (!coreSprite) coreSprite = buildCoreSprite();
      if (!dotSprite) dotSprite = buildDotSprite();

      /* 重建粒子（单次分配，之后复用属性） */
      const count = targetCount();
      particles = Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * TAU + Math.random() * 0.5;
        const radius = Math.max(w, h) * (0.55 + Math.random() * 0.6);
        const color = PALETTE[i % PALETTE.length];
        return {
          angle,
          radius,
          startRadius: radius,
          size: 0.8 + Math.random() * 1.8,
          speed: 0.75 + Math.random() * 0.5,
          color,
          /* burst 阶段的散射方向与速度 */
          vx: 0,
          vy: 0,
          alpha: 1,
        };
      });
    };

    /** easeOutCubic：收束末端更「顿」一点，像被吸住 */
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    /** easeOutExpo：爆发初速极快，之后迅速衰减 */
    const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

    /**
     * 画一个粒子点：优先用预渲染贴图做 drawImage（快），
     * 贴图不可用时回退到 arc 路径（慢但正确）。
     * 贴图是白色软边圆，用 globalAlpha 控透明度、颜色用 tint 近似：
     * 这里为了保持原有配色，仍以贴图叠加 + 色彩混合的方式绘制。
     */
    const paintDot = (x, y, size, alpha, color) => {
      if (dotSprite) {
        ctx.globalAlpha = alpha;
        const d = size * 2;
        ctx.drawImage(dotSprite, x - size, y - size, d, d);
        /* 用颜色遮罩保持配色：再叠一层极淡的实色圆心 */
        if (size > 1.2) {
          ctx.globalAlpha = alpha * 0.85;
          ctx.fillStyle = `rgb(${color.r} ${color.g} ${color.b})`;
          ctx.beginPath();
          ctx.arc(x, y, size * 0.55, 0, TAU);
          ctx.fill();
        }
        return;
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${color.r} ${color.g} ${color.b})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, TAU);
      ctx.fill();
    };

    const draw = (now) => {
      if (!running) return;
      /* 开屏阶段（paused）立即退出，不再申请下一帧。
         这是「就绪 → 露出首屏」卡顿的关键：粒子的 rAF 会和门板推开抢帧。 */
      if (pausedRef.current) return;
      if (!start) start = now;

      const elapsed = now - start;
      const p = Math.min(elapsed / duration, 1); // 总进度 0..1

      /* 三段分界（相对总时长的比例）——与 IntroLoader 的 TIMELINE 保持同步：
         gather 到 0.40 收束完毕，0.40–0.52 爆发，之后残留衰减。
         爆发段刻意做窄（0.12），让「炸开」是一个瞬时的强冲击，而不是慢镜头。 */
      const GATHER_END = 0.4;
      const BURST_END = 0.52;

      ctx.clearRect(0, 0, w, h);
      /* 性能：不再用 "lighter" 混合模式。
         软渲染下每次非默认合成都要逐像素做加法运算，是聚集阶段帧率只有
         约 10fps 的主因之一。粒子本身已带透明度，默认 source-over 看起来
         几乎没有差别，但省掉整轮的混合运算。 */
      ctx.globalCompositeOperation = "source-over";

      for (let i = 0; i < particles.length; i += 1) {
        const pt = particles[i];

        if (p <= GATHER_END) {
          /* ---- 聚集：半径从外向内收，越靠内越快 ---- */
          const t = easeOutCubic(p / GATHER_END);
          const r = pt.startRadius * (1 - t) * pt.speed;
          const a = pt.angle + t * 1.4; // 螺旋吸入，比直线更有力
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r * 0.86;

          /* 距离中心不足 R_NUM 时快速淡出：给中心的倒计时数字让位。
             不做这一步，粒子会在收束末端密集覆盖数字，观感很乱。
             用 smoothstep 做柔和过渡，避免硬切。 */
          const R_NUM = Math.min(w, h) * 0.14;
          const dist = Math.hypot(x - cx, y - cy);
          const nearFade = Math.min(1, Math.max(0, (dist - R_NUM * 0.55) / (R_NUM * 0.45)));
          const smooth = nearFade * nearFade * (3 - 2 * nearFade); // smoothstep

          pt.alpha = (0.35 + 0.65 * t) * smooth;
          if (pt.alpha <= 0.01) continue;

          const size = pt.size * (0.7 + t * 0.8);
          paintDot(x, y, size, pt.alpha, pt.color);
        } else if (p <= BURST_END) {
          /* ---- 爆发：从中心向外高速四散 ---- */
          const t = easeOutExpo((p - GATHER_END) / (BURST_END - GATHER_END));
          if (!pt.vx && !pt.vy) {
            /* 首次进入爆发段时初始化散射向量（径向为主 + 少量抖动） */
            const jitter = (Math.random() - 0.5) * 0.9;
            const a = pt.angle + jitter;
            const speed = Math.max(w, h) * (0.32 + Math.random() * 0.42);
            pt.vx = Math.cos(a) * speed;
            pt.vy = Math.sin(a) * speed * 0.88;
          }
          const x = cx + pt.vx * t;
          const y = cy + pt.vy * t;
          pt.alpha = 1 - t * 0.55;
          const size = pt.size * (1.5 - t * 0.6);
          paintDot(x, y, size, pt.alpha, pt.color);
        } else {
          /* ---- 收场：残余粒子继续向外飘并缓慢淡出 ----
             早期版本衰减太快（0.45 系数），爆发瞬间几乎看不到粒子扩散。
             现在把衰减拉长、位移继续外推，让「炸开」有持续的余韵。 */
          const t = (p - BURST_END) / (1 - BURST_END);
          const outward = 1 + t * 0.55; // 继续向外扩散
          const x = cx + pt.vx * outward;
          const y = cy + pt.vy * outward;
          pt.alpha = Math.max(0, 1 - t * 0.85);
          if (pt.alpha <= 0.01) continue;
          const size = pt.size * (1.1 - t * 0.5);
          paintDot(x, y, size, pt.alpha, pt.color);
        }
      }

      /* ---- 冲击波环：爆发瞬间三圈错峰扩散 ---- */
      if (p > GATHER_END && p < BURST_END + 0.3) {
        const ringT = Math.min(1, (p - GATHER_END) / (BURST_END - GATHER_END + 0.3));
        const maxR = Math.max(w, h) * 0.95;
        const rings = [
          { lag: 0, color: "rgb(255 255 255)", width: 5, alpha: 0.85 },
          { lag: 0.16, color: "rgb(185 166 255)", width: 4, alpha: 0.7 },
          { lag: 0.34, color: "rgb(126 231 245)", width: 2.5, alpha: 0.55 },
        ];
        for (let k = 0; k < rings.length; k += 1) {
          const r0 = rings[k];
          const t = (ringT - r0.lag) / (1 - r0.lag);
          if (t <= 0 || t > 1) continue;
          const r = maxR * easeOutExpo(t);
          ctx.globalAlpha = Math.max(0, 1 - t) * r0.alpha;
          ctx.strokeStyle = r0.color;
          ctx.lineWidth = Math.max(0.6, r0.width * (1 - t));
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, TAU);
          ctx.stroke();
        }
      }

      /* ---- 中心核心：先聚光再爆闪 ----
         性能说明：绝不能每帧 createRadialGradient（那是本文件最重的一笔开销，
         实测会把聚集阶段的帧间隔推到 300ms）。改为只在 resize 时预渲染一张
         64×64 的径向光斑贴图，每帧只做 drawImage 缩放，成本极低。 */
      if (p < GATHER_END + 0.05) {
        const t = p / (GATHER_END + 0.05);
        const r = (4 + easeOutCubic(t) * 42) * 3.2;
        if (coreSprite) {
          const size = r * 2;
          const prevOp = ctx.globalCompositeOperation;
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = Math.min(1, t * 1.15);
          ctx.drawImage(coreSprite, cx - size / 2, cy - size / 2, size, size);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = prevOp;
        }
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      if (p >= 1) {
        if (!doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
        return;
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);

    const onResize = () => {
      resize();
    };
    window.addEventListener("resize", onResize);

    const onVisibility = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf && !doneRef.current) {
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [duration, reduced, onDone]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ display: "block" }}
    />
  );
}
