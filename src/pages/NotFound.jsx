import { Link } from "react-router-dom";
import { ArrowLeft, Compass, Mail } from "lucide-react";
import AuroraBackground from "../components/AuroraBackground";

/**
 * 404 页 —— 与全站同一套深空紫蓝视觉。
 *
 * 两个约束（踩过的坑，改动时不要破坏）：
 * 1) aurora-text 依赖 background-clip:text，它的**子元素不能加 opacity/transform 动画**，
 *    否则渐变会被裁掉、文字整块消失。所以下面的文字一律静态摆放，
 *    动画只加在最外层的容器上（tilt-in）。
 * 2) 内容块水平居中：外层 grid place-items-center 负责水平方向，
 *    文字用 text-center，按钮组用 justify-center —— 三层都到位才不会偏。
 */
export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <AuroraBackground />

      <main className="relative z-[var(--z-content)] grid min-h-screen place-items-center px-4 py-16">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
          {/* 大号 404：极光渐变字，外层负责进场，内部不加动画 */}
          <div className="animate-[tilt-in_0.9s_cubic-bezier(0.22,1,0.36,1)_both]">
            <span
              aria-hidden="true"
              className="aurora-text block font-black leading-none tracking-[-0.04em] text-[clamp(4.5rem,16vw,9rem)]"
            >
              404
            </span>
          </div>

          <h1 className="mt-6 text-xl font-bold tracking-tight sm:text-2xl">
            页面未找到
          </h1>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
            这条路径不存在，或者内容已经被移动了。
            <br className="hidden sm:block" />
            你可以回到首页，也可以直接联系我。
          </p>

          {/* 按钮组：水平居中 */}
          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <Link to="/" className="cosmic-button inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              返回首页
            </Link>
            <Link
              to="/#contact"
              className="ghost-button inline-flex items-center gap-2"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              联系我
            </Link>
          </div>

          {/* 一点点低调的元信息，避免下方大片空白 */}
          <div className="mt-10 flex items-center gap-2 text-[0.68rem] tracking-[0.2em] text-subtle uppercase">
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            Error 404 · Not Found
          </div>
        </div>
      </main>
    </div>
  );
}
