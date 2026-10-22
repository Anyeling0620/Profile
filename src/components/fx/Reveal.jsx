import { useInView } from "./useMotionPrefs";

/**
 * Reveal —— 滚动进场容器：位移 + 缩放 + 透明度，可选 clip-path 揭开。
 *
 * 统一错峰步进 60–90ms（t5 要求），默认 70ms：
 *   <Reveal index={0}>…</Reveal>  → 0ms
 *   <Reveal index={1}>…</Reveal>  → 70ms
 *
 * 与旧实现的差异：不再依赖 transitionDelay 手写毫秒数，也统一了
 * rootMargin（此前三个板块各写一套 -12% / -18% / -14%）。
 */
export default function Reveal({
  children,
  as: Tag = "div",
  className = "",
  /** 同组内序号，用来算错峰延迟 */
  index = 0,
  /** 步进（ms）。t5 规定 60–90 */
  step = 70,
  /** 起始延迟 */
  delay = 0,
  /** 用 clip-path 擦出而不是单纯淡入（文字块更有高级感） */
  clip = false,
  /** 位移距离 */
  distance = 22,
  ...rest
}) {
  const [ref, inView] = useInView();
  const total = delay + index * step;

  const style = {
    "--fx-delay": `${total}ms`,
    transitionDelay: `${total}ms`,
    ...(inView ? {} : { transform: `translate3d(0, ${distance}px, 0) scale(0.985)` }),
    ...rest.style,
  };

  return (
    <Tag
      ref={ref}
      className={`${clip ? "fx-clip-reveal" : ""} ${
        inView ? "opacity-100" : "opacity-0"
      } transition-[opacity,transform] duration-[820ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:transform-none ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
