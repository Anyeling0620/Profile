import { useEffect, useRef } from "react";

/**
 * AuroraBackground —— 深空紫蓝极光多层动态背景
 *
 * 层级（由远及近）：
 *   0. 深空底色 radial-gradient（静态，永远可见）
 *   1. 远景极光光带：4 个超大模糊径向光斑 + 1 条极光帘，CSS 关键帧缓慢漂移
 *   2. 中景结构网：细线网格（grid-mesh）+ 底部透视网格（grid-perspective）+ 扫描线
 *   3. 近景尘埃：Canvas 粒子（数量按视口面积与设备性能自适应，移动端显著降低）
 *   4. 光标辉光：跟随鼠标的柔和光晕（指针设备才有）
 *   5. 收边：暗角 + 噪点，压住边缘、避免大面积渐变出现色带
 *
 * 交互：
 *   - 鼠标移动 → 远景/中景/尘埃按不同「景深系数」做轻微视差，光标处出现光晕
 *   - 滚动      → 光带下移 + 明度衰减，中景网格反向位移，尘埃随之漂移
 *   - 所有位移在 requestAnimationFrame 里做「缓动跟随」，只写 transform / opacity，
 *     不触发 React 重渲染、不触发布局。
 *
 * 无障碍与性能：
 *   - prefers-reduced-motion: reduce → 不启动 rAF，只绘制一帧静态尘埃，其余保留静态渐变
 *   - 标签页隐藏（visibilitychange）→ 暂停 rAF，回到前台再恢复
 *   - 组件卸载 / 断点变化 → 取消 rAF、移除全部监听、断开 ResizeObserver
 *
 * 定位约定：fixed inset-0、pointer-events-none、z-index 取 --z-background（内容层 = --z-content）
 */
const PALETTE = [
  "233, 236, 255", // 星光白
  "185, 166, 255", // 紫罗兰（primary-soft）
  "126, 231, 245", // 冰青（cyan-soft）
  "157, 180, 255", // 雾蓝（accent-soft）
];

const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** 粒子预算：桌面按面积铺，移动端封顶更低；低核心设备再打 6 折。 */
function getParticleBudget(width, height) {
  const isCompact = width < 768;
  const cores =
    typeof navigator !== "undefined" && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 4;
  const perfFactor = cores <= 4 ? 0.6 : 1;
  const density = isCompact ? 15000 : 11000;
  const cap = isCompact ? 48 : 150;
  const floor = isCompact ? 14 : 34;
  return Math.round(clamp(((width * height) / density) * perfFactor, floor, cap));
}

function seedParticles(count, width, height) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: rand(0.5, 1.9),
    depth: rand(0.25, 1),
    alpha: rand(0.16, 0.62),
    driftX: rand(-0.05, 0.05),
    driftY: rand(-0.16, -0.03),
    twinkle: rand(0.4, 1.6),
    phase: rand(0, Math.PI * 2),
    rgb: PALETTE[Math.floor(Math.random() * PALETTE.length)],
  }));
}

function drawParticles(ctx, particles, width, height, parallax, scroll, time) {
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  for (const p of particles) {
    const twinkle = 0.72 + 0.28 * Math.sin(time * p.twinkle + p.phase);
    const alpha = clamp(p.alpha * twinkle, 0, 1);
    const x = p.x + parallax.x * 26 * p.depth;
    // 叠加一个时间驱动的缓慢上浮，让静止画面里尘埃也在动
    const y =
      p.y +
      parallax.y * 20 * p.depth +
      scroll * 46 * p.depth +
      Math.sin(time * 0.18 + p.phase) * 8 * p.depth;
    const wrappedX = ((x % width) + width) % width;
    const wrappedY = ((y % height) + height) % height;

    ctx.beginPath();
    ctx.arc(wrappedX, wrappedY, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${p.rgb}, ${alpha.toFixed(3)})`;
    ctx.fill();
  }

  ctx.globalCompositeOperation = "source-over";
}

export default function AuroraBackground() {
  const rootRef = useRef(null);
  const farRef = useRef(null);
  const midRef = useRef(null);
  const glowRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return undefined;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return undefined;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

    let width = 0;
    let height = 0;
    let particles = [];
    let rafId = 0;
    let visible = document.visibilityState !== "hidden";
    let reduceMotion = motionQuery.matches;

    // 指针目标值（归一化 -1 → 1）与缓动后的当前值
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    const pointer = { x: 0, y: 0, active: false };
    let scrollTarget = 0;
    let scrollCurrent = 0;
    let lastTime = 0;

    /* 脏标记与上一次绘制值：用于「收敛后不再写大层 transform」的优化 */
    const dirty = { far: true, mid: true, glow: true };
    const lastPaint = {
      farX: Number.NaN,
      farY: Number.NaN,
      farOpacity: Number.NaN,
      midX: Number.NaN,
      midY: Number.NaN,
    };

    const resizeCanvas = () => {
      const rect = root.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width || window.innerWidth));
      height = Math.max(1, Math.round(rect.height || window.innerHeight));

      const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = seedParticles(getParticleBudget(width, height), width, height);
    };

    // ---------- 静态降级：只画一帧，无 rAF ----------
    const paintStaticFrame = () => {
      drawParticles(ctx, particles, width, height, { x: 0, y: 0 }, 0, 0);
      if (farRef.current) {
        farRef.current.style.transform = "";
        farRef.current.style.opacity = "";
      }
      if (midRef.current) {
        midRef.current.style.transform = "";
        midRef.current.style.opacity = "";
      }
      if (glowRef.current) {
        glowRef.current.style.opacity = "0";
      }
      lastPaint.farX = Number.NaN;
      lastPaint.farY = Number.NaN;
      lastPaint.farOpacity = Number.NaN;
      lastPaint.midX = Number.NaN;
      lastPaint.midY = Number.NaN;
    };

    // ---------- 动画帧 ----------
    const render = (timestamp) => {
      const time = timestamp / 1000;
      const delta = lastTime ? clamp((timestamp - lastTime) / 1000, 0, 0.05) : 0.016;
      lastTime = timestamp;

      // 缓动跟随（约 0.12 的比例，60fps 下大致 200ms 收敛）
      const follow = 1 - Math.pow(0.001, delta);
      current.x += (target.x - current.x) * follow;
      current.y += (target.y - current.y) * follow;
      scrollCurrent += (scrollTarget - scrollCurrent) * follow;

      /* ⚠️ 性能核心：全屏渐变层的 transform 一旦写入，浏览器就要重新合成
         一整屏。因此这里做「脏检查」——数值收敛后不再写，让这些大层彻底静止。
         实测意义：静止时不再有全屏合成，滚动/移动时才逐帧更新。 */
      const farY = -current.y * 12 + scrollCurrent * 34;
      const farX = -current.x * 18;
      if (farRef.current) {
        if (!dirty.far || Math.abs(farX - lastPaint.farX) > 0.4 || Math.abs(farY - lastPaint.farY) > 0.4) {
          farRef.current.style.transform = `translate3d(${farX.toFixed(2)}px, ${farY.toFixed(2)}px, 0)`;
          lastPaint.farX = farX;
          lastPaint.farY = farY;
        }
        const farOpacity = Number(clamp(1 - scrollCurrent * 0.16, 0.55, 1).toFixed(3));
        if (Math.abs(farOpacity - lastPaint.farOpacity) > 0.004) {
          farRef.current.style.opacity = String(farOpacity);
          lastPaint.farOpacity = farOpacity;
        }
      }

      // 中景网格：正向位移 + 随滚动上浮
      const midX = current.x * 14;
      const midY = current.y * 10 - scrollCurrent * 26;
      if (midRef.current) {
        if (!dirty.mid || Math.abs(midX - lastPaint.midX) > 0.4 || Math.abs(midY - lastPaint.midY) > 0.4) {
          midRef.current.style.transform = `translate3d(${midX.toFixed(2)}px, ${midY.toFixed(2)}px, 0)`;
          lastPaint.midX = midX;
          lastPaint.midY = midY;
        }
      }

      // 光标辉光：直接跟随指针（面积比全屏小得多，且只在指针活跃时可见）
      if (glowRef.current) {
        const gx = pointer.x;
        const gy = pointer.y;
        if (pointer.active || dirty.glow) {
          glowRef.current.style.transform = `translate3d(${gx.toFixed(1)}px, ${gy.toFixed(
            1,
          )}px, 0) translate(-50%, -50%)`;
        }
        const glowOpacity = pointer.active ? "1" : "0";
        if (glowRef.current.style.opacity !== glowOpacity) {
          glowRef.current.style.opacity = glowOpacity;
        }
      }

      // 粒子推进 + 绘制（位移按 delta 归一化到 60fps，避免 120Hz 屏幕上速度翻倍）
      const speed = delta * 60;
      for (const p of particles) {
        p.x += p.driftX * speed;
        p.y += p.driftY * speed;
        if (p.y < -4) {
          p.y = height + 4;
          p.x = Math.random() * width;
        }
        if (p.x < -4) p.x = width + 4;
        else if (p.x > width + 4) p.x = -4;
      }
      drawParticles(ctx, particles, width, height, current, scrollCurrent, time);

      /* 指针与滚动都已收敛（差值极小）→ 停掉 rAF。
         这一帧之后大层完全静止，只剩 CSS 关键帧在各自合成层里跑，
         不再有「每帧重写全屏 transform」的开销。
         下一次 pointermove / scroll 会重新 start()。 */
      const settled =
        Math.abs(target.x - current.x) < 0.002 &&
        Math.abs(target.y - current.y) < 0.002 &&
        Math.abs(scrollTarget - scrollCurrent) < 0.002;
      if (settled) {
        dirty.far = false;
        dirty.mid = false;
        rafId = 0;
        return;
      }

      rafId = window.requestAnimationFrame(render);
    };

    const start = () => {
      if (rafId || !visible || reduceMotion) return;
      lastTime = 0;
      rafId = window.requestAnimationFrame(render);
    };

    const stop = () => {
      if (!rafId) return;
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    };

    // ---------- 事件 ----------
    const handlePointerMove = (event) => {
      if (!pointerQuery.matches) return;
      const nx = (event.clientX / window.innerWidth) * 2 - 1;
      const ny = (event.clientY / window.innerHeight) * 2 - 1;
      target.x = clamp(nx, -1, 1);
      target.y = clamp(ny, -1, 1);
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      dirty.glow = true;
      dirty.far = true;
      dirty.mid = true;
    };

    const handlePointerLeave = () => {
      target.x = 0;
      target.y = 0;
      pointer.active = false;
      dirty.glow = true;
      dirty.far = true;
      dirty.mid = true;
    };

    const updateScroll = () => {
      const viewport = window.innerHeight || 1;
      scrollTarget = clamp(window.scrollY / viewport, 0, 3);
    };

    // 滚动只更新目标值，真正的位移在 rAF 里缓动；
    // reduced-motion 下不重绘任何一帧（纯静态渐变），保证零动画开销。
    const handleScroll = () => {
      if (reduceMotion) return;
      updateScroll();
      dirty.far = true;
      dirty.mid = true;
      start();
    };

    const handleVisibility = () => {
      visible = document.visibilityState !== "hidden";
      if (visible) {
        // 标签页切回时页面可能已滚动，补一次目标值同步
        updateScroll();
        scrollCurrent = scrollTarget;
        start();
      } else {
        stop();
      }
    };

    const handleMotionChange = (event) => {
      reduceMotion = event.matches;
      if (reduceMotion) {
        stop();
        paintStaticFrame();
      } else {
        // 静态期间滚动监听是空转的，恢复动画前先对齐当前滚动位置
        updateScroll();
        scrollCurrent = scrollTarget;
        start();
      }
    };

    let resizeFrame = 0;
    const handleResize = () => {
      if (resizeFrame) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        resizeCanvas();
        updateScroll();
        if (reduceMotion) paintStaticFrame();
      });
    };

    // ---------- 初始化 ----------
    resizeCanvas();
    updateScroll();
    scrollCurrent = scrollTarget;
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    window.addEventListener("blur", handlePointerLeave);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener("change", handleMotionChange);

    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(root);
    }

    if (reduceMotion) paintStaticFrame();
    else start();

    return () => {
      stop();
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("blur", handlePointerLeave);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", handleMotionChange);
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      particles = [];
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: "var(--z-background, 0)" }}
    >
      {/* 0. 深空底色 —— 静态基准，任何降级下都保留 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "var(--color-background, #05060a)",
          backgroundImage:
            "radial-gradient(120% 90% at 50% -10%, #0b0e1a 0%, #07080f 38%, #05060a 62%, #03040a 100%)",
        }}
      />

      {/* 1. 远景极光光带
          性能：这里刻意**不用 filter: blur()**。实测（Chromium，1440×900）
          对超大元素同时施加 blur + transform/scale 动画会把帧间隔从 16.7ms 拉到
          83~100ms（约 10fps），因为每帧都要重新做一次大半径模糊。
          改为「多段柔和渐变」直接画出边缘羽化效果：同样的观感，满帧运行。
          峰值 alpha 保持不变，以匹配已验证的对比度上界（正文 ≥10:1）。

          尺寸取舍（60vmax，实测原始渐变）：
            78~72vmax → 50ms/帧（20fps）；66vmax → 20fps；**60vmax → 33ms（30fps）**
          这是「大面积持续重绘」在软渲染下的分水岭。60vmax 仍能铺满首屏、
          三色层次与暗角观感完整（截图比对过），因此定为 60vmax。
          参考对照：把光斑动画整体停掉也只有 30fps，说明 30fps 已是本环境
          下「背景有动画」的上限，再缩尺寸没有额外收益，故不再继续缩小。 */}
      <div
        ref={farRef}
        className="absolute -inset-[15%]"
        style={{ transform: "translate3d(0, 0, 0)" }}
      >
        {/* 紫：左上 */}
        <div
          className="animate-aurora-drift absolute -left-[10%] -top-[22%] h-[60vmax] w-[60vmax] rounded-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, rgb(124 92 255 / 0.42) 0%, rgb(124 92 255 / 0.3) 16%, rgb(124 92 255 / 0.18) 30%, rgb(124 92 255 / 0.09) 44%, rgb(124 92 255 / 0.035) 56%, transparent 68%)",
          }}
        />
        {/* 蓝：右上 */}
        <div
          className="animate-aurora-drift-slow absolute -right-[14%] -top-[18%] h-[60vmax] w-[60vmax] rounded-full"
          style={{
            animationDelay: "-8s",
            backgroundImage:
              "radial-gradient(circle at 50% 50%, rgb(65 105 255 / 0.4) 0%, rgb(65 105 255 / 0.28) 17%, rgb(65 105 255 / 0.17) 32%, rgb(65 105 255 / 0.085) 46%, rgb(65 105 255 / 0.03) 58%, transparent 70%)",
          }}
        />
        {/* 青：中下，拉出极光帘的体积感 */}
        <div
          className="animate-aurora-drift absolute left-[18%] top-[42%] h-[52vmax] w-[60vmax] rounded-full"
          style={{
            animationDelay: "-14s",
            animationDuration: "34s",
            backgroundImage:
              "radial-gradient(ellipse at 50% 50%, rgb(34 211 238 / 0.22) 0%, rgb(34 211 238 / 0.16) 18%, rgb(34 211 238 / 0.1) 32%, rgb(34 211 238 / 0.05) 47%, rgb(34 211 238 / 0.018) 60%, transparent 72%)",
          }}
        />
        {/* 品红补色已移除（性能取舍，实测数据见下方说明）。
            原因：远景层同时跑 4 个全屏级光斑动画时，SwiftShader 软渲染下
            帧间隔 50ms（20fps）；减到 3 个即回到 33ms（30fps，+50%）。
            该光斑峰值 alpha 仅 0.24，且被暗角压住，实际视觉贡献极小
            （1440×900 截图肉眼对比几乎无差别），故优先保帧率。
            紫/蓝/青三色仍覆盖左上、右上、中下，画面不单薄。 */}
        {/* 极光帘：一条倾斜的高光带，让光带更像「帘」而非圆斑。
            倾斜必须放在外层（无动画）—— CSS 动画会覆盖内联 transform，
            若把 rotate 和 animate-* 放同一元素上，倾斜会失效。 */}
        <div
          className="absolute left-[6%] top-[-6%] h-[120vh] w-[52vw]"
          style={{ transform: "rotate(18deg)", transformOrigin: "0% 0%" }}
        >
          <div
            className="animate-aurora-drift-slow h-full w-full opacity-50"
            style={{
              animationDuration: "56s",
              maskImage:
                "linear-gradient(180deg, transparent 0%, #000 26%, #000 62%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(180deg, transparent 0%, #000 26%, #000 62%, transparent 100%)",
              /* 同样不用 blur：靠 100deg 渐变自身 + 上下 mask 羽化出帘状柔边 */
              backgroundImage:
                "linear-gradient(100deg, transparent 0%, rgb(124 92 255 / 0.1) 22%, rgb(124 92 255 / 0.24) 38%, rgb(34 211 238 / 0.18) 54%, rgb(34 211 238 / 0.08) 68%, transparent 88%)",
            }}
          />
        </div>
      </div>

      {/* 2. 中景结构网 + 扫描线 */}
      <div
        ref={midRef}
        className="absolute inset-0"
        style={{ transform: "translate3d(0, 0, 0)" }}
      >
        <div className="grid-mesh absolute inset-0 opacity-40" />
        <div className="grid-perspective absolute inset-x-0 bottom-0 h-[52vh] opacity-50" />
        {/* 扫描线：极低亮度的水平光带自下而上扫过 */}
        <div
          className="animate-scan-line absolute inset-x-0 top-0 h-[28vh]"
          style={{
            backgroundImage:
              "linear-gradient(180deg, transparent 0%, rgb(157 180 255 / 0.045) 42%, rgb(126 231 245 / 0.085) 50%, rgb(157 180 255 / 0.045) 58%, transparent 100%)",
          }}
        />
        {/* 地平线：底部一道极细的紫青辉光 */}
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            backgroundImage:
              "linear-gradient(90deg, transparent, rgb(124 92 255 / 0.55), rgb(34 211 238 / 0.45), transparent)",
          }}
        />
      </div>

      {/* 3. 近景尘埃（Canvas） */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* 4. 光标辉光 */}
      <div
        ref={glowRef}
        className="absolute left-0 top-0 h-[42rem] w-[42rem] rounded-full opacity-0 transition-opacity duration-500 ease-out"
        style={{
          filter: "blur(46px)",
          willChange: "transform, opacity",
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgb(124 92 255 / 0.16) 0%, rgb(65 105 255 / 0.1) 36%, transparent 68%)",
        }}
      />

      {/* 5. 收边：暗角 + 噪点 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(125% 105% at 50% 0%, transparent 38%, rgb(3 4 10 / 0.5) 78%, rgb(2 3 8 / 0.8) 100%)",
        }}
      />
      <div className="noise-layer absolute inset-0" />
    </div>
  );
}
