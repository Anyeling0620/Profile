import * as ToastPrimitive from "@radix-ui/react-toast";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * 通知（Toast）—— 与全站「深空紫蓝 + 玻璃拟态」统一的样式。
 *
 * 设计要点：
 * 1) 容器**水平居中**：viewport 用 left-1/2 + -translate-x-1/2，
 *    不再是原来的「右下角堆叠」。单条通知不会撑成整屏（max-w-md），
 *    多条时纵向排队，仍以屏幕中轴对齐。
 * 2) 不再用 green-500 / red-500 实色底（原 shadcn 默认样式，与深色玻璃割裂）。
 *    改为玻璃卡 + 语义色描边 / 图标 / 极细光晕，文字保持高对比。
 * 3) 三种状态各配图标，颜色只做点缀，不靠整块底色表达语义。
 * 4) 内容整体居中（标题与描述均 text-center），与「居中对齐」的要求一致。
 * 5) 进场：从上方轻落；退场：向上收回。
 */

const ToastProvider = ToastPrimitive.Provider;

function ToastViewport({ className, ...props }) {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        /* 水平居中：钉在中轴，纵向从顶部往下排 */
        "fixed left-1/2 top-4 z-[100] flex w-full max-w-md -translate-x-1/2",
        "flex-col items-center gap-2 px-4 outline-none",
        className,
      )}
      {...props}
    />
  );
}

/* 各状态的视觉配置：只换描边 / 光晕 / 图标颜色，底色始终是玻璃卡 */
const VARIANT_STYLE = {
  default: {
    icon: Info,
    accent: "text-primary-soft",
    ring: "border-white/[0.12]",
    glow: "shadow-[0_18px_50px_-18px_rgba(124,92,255,0.55)]",
    bar: "from-[#7c5cff] to-[#4169ff]",
  },
  success: {
    icon: CheckCircle2,
    accent: "text-[#4ade80]",
    ring: "border-[#4ade80]/30",
    glow: "shadow-[0_18px_50px_-18px_rgba(74,222,128,0.45)]",
    bar: "from-[#4ade80] to-[#22d3ee]",
  },
  destructive: {
    icon: AlertTriangle,
    accent: "text-[#ff8fa3]",
    ring: "border-[#ff6b8a]/30",
    glow: "shadow-[0_18px_50px_-18px_rgba(255,107,138,0.45)]",
    bar: "from-[#ff6b8a] to-[#a855f7]",
  },
};

function Toast({ className, variant = "default", children, ...props }) {
  const style = VARIANT_STYLE[variant] ?? VARIANT_STYLE.default;
  const Icon = style.icon;

  return (
    <ToastPrimitive.Root
      className={cn(
        "group pointer-events-auto relative w-full overflow-hidden rounded-2xl",
        "glass-card glass-edge noise-overlay",
        "flex items-start gap-3 border px-4 py-3.5 backdrop-blur-xl",
        /* 居中容器的进出场：从上方轻落 / 向上收回 */
        "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "data-[state=open]:translate-y-0 data-[state=open]:scale-100 data-[state=open]:opacity-100",
        "data-[state=closed]:-translate-y-2 data-[state=closed]:scale-[0.97] data-[state=closed]:opacity-0",
        "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
        "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
        style.ring,
        style.glow,
        className,
      )}
      {...props}
    >
      {/* 左侧状态图标 */}
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/[0.1] bg-white/[0.05]",
          style.accent,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>

      {/* 正文：整体居中 */}
      <div className="min-w-0 flex-1 pr-4 text-center">{children}</div>

      {/* 底部语义色进度条（装饰），提示这是会自动消失的通知 */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r opacity-80",
          style.bar,
        )}
      />
    </ToastPrimitive.Root>
  );
}

function ToastAction({ className, ...props }) {
  return (
    <ToastPrimitive.Action
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.04] px-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/[0.14] focus:outline-hidden disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function ToastClose({ className, ...props }) {
  return (
    <ToastPrimitive.Close
      className={cn(
        "absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-subtle opacity-0 transition-all duration-200 hover:bg-white/[0.08] hover:text-foreground",
        "focus:opacity-100 focus:outline-hidden group-hover:opacity-100",
        className,
      )}
      toast-close=""
      aria-label="关闭通知"
      {...props}
    >
      <X className="h-3.5 w-3.5" />
    </ToastPrimitive.Close>
  );
}

function ToastTitle({ className, ...props }) {
  return (
    <ToastPrimitive.Title
      className={cn("text-sm font-bold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

function ToastDescription({ className, ...props }) {
  return (
    <ToastPrimitive.Description
      className={cn(
        /* 限制最多 3 行：错误信息里会出现很长的英文变量名（如 EmailJS 的环境变量），
           不限制会把通知撑成一大块，破坏「小提示」的观感。
           保留 break-words，避免长串无空格字符串（VITE_EMAILJS_SERVICE_ID）
           直接把容器撑破。 */
        "mt-1 line-clamp-3 break-words text-[0.8rem] leading-relaxed text-muted",
        className,
      )}
      {...props}
    />
  );
}

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
