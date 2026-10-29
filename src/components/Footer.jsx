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

const footerNav = [
  { href: "#hero", label: "首页" },
  { href: "#about", label: "关于" },
  { href: "#skill", label: "技能" },
  { href: "#contact", label: "联系" },
];

/**
 * 页脚 —— 杂志末页的资料栏（colophon），不是一块玻璃卡片。
 *
 * 做法：一条顶细线起头，之下全部是「小号大写宽字距标签 + 极细分隔线」，
 * 不再有圆角、背景渐变、backdrop-blur 与玻璃高光；
 * 品牌字号下调、字距放宽，让它读起来像刊头版权页而不是 App 顶栏。
 * 功能面（导航锚点、GitHub / 邮件 / 回到顶部、ICP 备案）一律原样保留。
 */
export default function Footer() {
  return (
    <footer className="editorial-shell relative z-[var(--z-content)] mt-16 pb-10 pt-2 md:mt-24 md:pb-14">
      {/* 顶部规则线：整条细线，不再用两端渐隐的极光渐变色带 */}
      <span aria-hidden="true" className="rule-hair" />

      <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        {/* 品牌块：KZ 字标做成无底色的描边方框，只留一个字母，比渐变小方块克制 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <span
              aria-hidden="true"
              className="grid h-6 w-6 shrink-0 place-items-center border border-rule-strong text-[0.6rem] font-medium tracking-[0.1em] text-foreground"
            >
              KZ
            </span>
            <span className="type-h3 text-foreground">Kuang Zihao</span>
          </div>
          <span className="label-caps">Fullstack · 用心构建产品</span>
        </div>

        {/* 导航：小号大写宽字距，靠一条竖细线与品牌块分开（桌面端才出现） */}
        <nav
          aria-label="页脚导航"
          className="flex flex-wrap items-baseline gap-x-6 gap-y-2 sm:border-l sm:border-rule-strong sm:pl-8"
        >
          {footerNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="label-caps border-b border-transparent pb-1 transition-colors duration-300 hover:border-rule-strong hover:text-primary-soft"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* 图标通道：去掉圆形描边底座，改成裸图标 + 悬停上浮 */}
        {/* 图标命中区：视觉尺寸保持小（编辑式要克制），但点击区必须够大。
            实测原 h-6 w-6（24px）已是 WCAG 2.5.8 的下限，而图标本身只有 16px，
            真实可点区域约 15.3px，低于 24px 要求。这里用 min-h/min-w 44px 撑开
            命中区（WCAG 2.5.5 舒适目标），图标本身仍是 h-4 w-4，观感不变。 */}
        <div className="flex items-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener"
            aria-label="访问 GitHub 主页"
            className="group grid min-h-11 min-w-11 place-items-center text-muted transition-all duration-300 hover:-translate-y-0.5 hover:text-foreground"
          >
            <GithubMark className="h-4 w-4" />
          </a>
          <a
            href={`mailto:${EMAIL}`}
            aria-label={`发送邮件至 ${EMAIL}`}
            className="group grid min-h-11 min-w-11 place-items-center text-muted transition-all duration-300 hover:-translate-y-0.5 hover:text-cyan-soft"
          >
            <Mail className="h-4 w-4" />
          </a>
          <a
            href="#hero"
            aria-label="回到顶部"
            className="group grid min-h-11 min-w-11 place-items-center text-muted transition-all duration-300 hover:-translate-y-0.5 hover:text-foreground"
          >
            <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>

      {/* 版权行：细线之下，小号大写宽字距；ICP 备案保留原链接、原 aria-label */}
      <div className="mt-8 flex flex-col gap-3 border-t border-rule pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="type-micro">
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
          className="group inline-flex items-center gap-1.5 self-start type-micro transition-colors duration-300 hover:text-muted sm:self-auto"
        >
          <img
            src={ICPLogo}
            alt=""
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 opacity-85 transition-opacity duration-300 group-hover:opacity-100"
            loading="lazy"
            decoding="async"
          />
          <span className="whitespace-nowrap">{BEIAN_TEXT}</span>
        </a>
      </div>
    </footer>
  );
}
