import { ArrowUp, Mail } from "lucide-react";
import ICPLogo from "../assets/ICP-Logo.png";

const GITHUB_URL = "https://github.com/Anyeling0620";
const BEIAN_URL = "https://beian.miit.gov.cn/";
const BEIAN_TEXT = "粤ICP备2025492035号";
const EMAIL = "3463645195@qq.com";

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


export default function Footer() {
  return (
    <footer className="relative z-[var(--z-content)] mt-8 px-3 pb-4 sm:px-4 sm:pb-6">
      {/* 顶部极光分隔线 */}
      <div
        aria-hidden="true"
        className="mx-auto mb-4 h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-primary/45 to-transparent"
      />

      <div className="glass-card glass-edge noise-overlay mx-auto flex max-w-6xl flex-col gap-5 rounded-2xl px-5 py-6 sm:px-8">
        {/* 上排：品牌 ↔ 按钮两端对齐；导航单独一层绝对居中。
            原先三项都放进 justify-between，导航会被左右两块「挤」到偏右，
            不是真正居中（左右宽度不等）。现在导航用绝对定位 + translate
            钉在容器中线，与两侧块宽度无关。
            移动端（<sm）改为纵向堆叠，导航回到正常流，不做绝对居中。 */}
        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-1.5 sm:items-start">
            <span className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">
              <span
                aria-hidden="true"
                className="grid h-6 w-6 place-items-center rounded-[0.55rem] bg-gradient-to-br from-[#8b6dff] via-[#7c5cff] to-[#4169ff] text-[0.6rem] font-bold text-[#05060a] shadow-[0_0_16px_-4px_rgba(124,92,255,0.9)]"
              >
                KZ
              </span>
              Kuang Zihao
            </span>
            <span className="text-[0.68rem] tracking-[0.22em] text-subtle">
              FULLSTACK · 用心构建产品
            </span>
          </div>

          <nav
            aria-label="页脚导航"
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:absolute sm:left-1/2 sm:-translate-x-1/2"
          >
            <a
              href="#hero"
              className="text-xs text-muted transition-colors duration-300 hover:text-primary-soft"
            >
              首页
            </a>
            <a
              href="#about"
              className="text-xs text-muted transition-colors duration-300 hover:text-primary-soft"
            >
              关于
            </a>
            <a
              href="#skill"
              className="text-xs text-muted transition-colors duration-300 hover:text-primary-soft"
            >
              技能
            </a>
            <a
              href="#contact"
              className="text-xs text-muted transition-colors duration-300 hover:text-primary-soft"
            >
              联系
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener"
              aria-label="访问 GitHub 主页"
              data-fx-ripple=""
              className="fx-ripple-host group grid h-8 w-8 place-items-center rounded-full border border-white/[0.1] bg-white/[0.03] text-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-soft/40 hover:bg-primary/[0.12] hover:text-foreground active:scale-95"
            >
              <GithubMark className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
            </a>
            <a
              href={`mailto:${EMAIL}`}
              aria-label={`发送邮件至 ${EMAIL}`}
              data-fx-ripple=""
              className="fx-ripple-host group grid h-8 w-8 place-items-center rounded-full border border-white/[0.1] bg-white/[0.03] text-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-soft/40 hover:bg-cyan/[0.12] hover:text-foreground active:scale-95"
            >
              <Mail className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
            </a>
            <a
              href="#hero"
              aria-label="回到顶部"
              data-fx-ripple=""
              className="fx-ripple-host group grid h-8 w-8 place-items-center rounded-full border border-white/[0.1] bg-white/[0.03] text-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-soft/40 hover:bg-primary/[0.12] hover:text-foreground active:scale-95"
            >
              <ArrowUp className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>

        <div aria-hidden="true" className="h-px w-full bg-white/[0.06]" />

        {/* 下排：版权 + ICP 备案，两行各自水平居中
            （窄屏不会挤成两端对齐，备案号始终居中） */}
        <div className="flex flex-col items-center justify-center gap-2.5 text-center">
          <p className="text-[0.68rem] leading-relaxed text-subtle sm:text-xs">
            © {new Date().getFullYear()} Kuang Zihao · 保留所有权利
          </p>

          {/* ICP 备案：图标 + 号码合成一个低调的胶囊，悬停才略微亮起。
              跳转逻辑保持原样（新窗口 + noopener noreferrer）。
              aria-label 说明去向，屏幕阅读器不会只念号码；
              图标 alt 置空 + aria-hidden，避免重复朗读。 */}
          <a
            href={BEIAN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${BEIAN_TEXT}，工业和信息化部备案管理系统，新窗口打开`}
            className="group mx-auto inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[0.68rem] leading-none text-subtle transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-muted sm:text-[0.7rem]"
          >
            <img
              src={ICPLogo}
              alt=""
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 opacity-85 transition-opacity duration-300 group-hover:opacity-100"
              loading="lazy"
              decoding="async"
            />
            <span className="whitespace-nowrap font-medium">{BEIAN_TEXT}</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
