import { Mail, MapPin, Send } from "lucide-react";
import { useEffect, useState } from "react";
import MagneticButton from "./fx/MagneticButton";

import { useToast } from "../hooks/useToast";
import { getContactMessageCooldown, sendContactMessage } from "../lib/contact";
import { formatIndex } from "../lib/editorial";
import { cn } from "../lib/utils";

const initialFormData = {
  user_name: "",
  user_email: "",
  message: "",
};

/* 联系方式：原先三条「图标底座 + 标签 + 值」的同构条目，
   改造为「标签 : 值」的 tabular 对齐表。邮箱仍是可点击链接（保留 mailto:），
   只是不再套圆角玻璃盒，改由细线分行——编辑式版面的结构色只有线，没有盒子。
   电话一栏已移除：原先值是占位符「+86 none」，与其让占位词上屏，不如不展示。 */
const contactRows = [
  {
    icon: Mail,
    label: "邮箱",
    value: "3463645195@qq.com",
    href: "mailto:3463645195@qq.com",
  },
  {
    icon: MapPin,
    label: "位置",
    value: "中国，山东",
    href: null,
  },
];

export default function ContactSection() {
  const { toast } = useToast();
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);

  /**
   * 冷却倒计时（派生状态）。
   *
   * 原来只有 lastSentAt 一个时间戳、没有定时器，导致「冷却中」永远不会
   * 反映到界面上（按钮不变灰、也没有秒数）。
   *
   * 做法：维护一个每秒推进的 now，冷却剩余量由 (lastSentAt, now) 直接派生。
   *  - Math.ceil 保证最后一秒仍显示 1，不会出现「0 秒却仍禁用」；
   *  - 冷却结束立即停止心跳，空闲时不空转；lastSentAt 变化时重启；
   *  - 卸载时清理，避免泄漏。
   * 注意：effect 内**不做同步 setState**（会触发级联渲染，eslint 也禁止），
   * 首次 now 已在发送成功时由 handleSubmit 一并写入。
   */
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!lastSentAt) return undefined;
    if (getContactMessageCooldown(lastSentAt) <= 0) return undefined;

    const timer = window.setInterval(() => {
      /* 关键：无论是否已冷却结束都要更新 now。
         早期写法在 remaining<=0 时直接 return，导致 now 停在最后一帧，
         派生出的 cooldownLeft 永远是 1 → 按钮永久灰着不恢复。
         这里先写入真实时间，再由派生逻辑把 0 算出来。 */
      setNow(Date.now());
      if (getContactMessageCooldown(lastSentAt) <= 0) {
        window.clearInterval(timer);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [lastSentAt]);

  const cooldownLeft = lastSentAt
    ? Math.ceil(getContactMessageCooldown(lastSentAt, now) / 1000)
    : 0;

  const isCoolingDown = cooldownLeft > 0;
  const submitDisabled = isSubmitting || isCoolingDown;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cooldownMs = getContactMessageCooldown(lastSentAt);

    if (cooldownMs > 0) {
      toast({
        title: "发送太频繁",
        description: `请 ${Math.ceil(cooldownMs / 1000)} 秒后再试。`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    setTimeout(async () => {
      try {
        await sendContactMessage(formData);
        /* 同一时刻写入两个时间基准：
           lastSentAt 用于判断冷却，now 用于 derive 剩余秒数，
           两者一致才不会出现「刚开始冷却却显示 59 秒」的跳变。 */
        const sentAt = Date.now();
        setLastSentAt(sentAt);
        setNow(sentAt);
        toast({
          title: "消息已发送！",
          description: "感谢你的留言，我会尽快回复你。",
          variant: "success",
        });
        /* 发送成功后**保留**已填内容，不再重置表单：
           既能核对刚发出去的信息，失败重试或想补充留言时也无需重新输入。 */
      } catch (error) {
        toast({
          title: "发送失败",
          description:
            error instanceof Error
              ? error.message
              : "请稍后再试，或直接通过邮箱联系我。",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }, 1500);
  };

  /* 仅用于渲染的视觉配置：不参与任何提交逻辑。
     编辑式输入框：无边框盒、无底色、无玻璃模糊，只留一条底线；聚焦时底线换成
     极光青并叠一层极窄的底部辉光。去掉「厚重玻璃边框」正是本轮的验收项之一。
     保留 disabled 态样式，提交中仍能看出控件被锁。
     注意：字色 / placeholder 走底层的语义色，不在这里改对比度。 */
  const fieldShell =
    "w-full border-b border-rule-strong bg-transparent px-0 py-2.5 text-sm text-foreground placeholder:text-subtle/70 outline-none transition-[border-color,box-shadow] duration-300 focus:border-cyan-soft focus:shadow-[0_1px_0_0_rgba(34,211,238,0.55)] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    /* editorial-shell：非对称页边 + 文本左对齐（压掉 #root 的 text-align:center） */
    <section
      id="contact"
      className="editorial-shell relative overflow-hidden py-24 md:py-32"
    >
      {/* 板块级极光点缀 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/3 top-[-6%] h-[26rem] w-[44rem] -translate-x-1/3 rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.16),transparent_70%)] blur-[110px]" />
        <div className="absolute bottom-[-8%] left-[-6%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.1),transparent_72%)] blur-[100px]" />
        <div className="grid-mesh absolute inset-0 opacity-30" />
      </div>

      <div>
        {/* 标题：左对齐 + 板块编号 04 + 细线规则（rule-index 一次给出这三件事） */}
        <header className="flex flex-col gap-5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="label-caps">Contact</span>
            <span aria-hidden="true" className="rule-dot" />
            <span className="label-caps">取得联系</span>
          </div>
          <h2
            className="rule-index type-h1 editorial-text"
            style={{ "--index": `'${formatIndex(4)}'` }}
          >
            联系我
          </h2>
          <p className="type-lede editorial-measure">
            如果你有项目想法、合作机会，或者只是想聊聊技术，欢迎随时联系我。
          </p>
        </header>

        {/* 非对称两栏：左 4 列（窄，资料栏），右 7 列（宽，表单）。
            左窄右宽不是随意定的——资料是「被查阅」的，表单是「被填写」的。 */}
        <div className="mt-12 grid gap-y-12 lg:mt-16 lg:grid-cols-12 lg:gap-x-10">
          {/* 左：联系方式（tabular 表）+ 社交 */}
          <div className="flex flex-col gap-10 lg:col-span-4">
            <div>
              <h3 className="label-caps">联系方式 / Direct</h3>

              {/* tabular：标签列定宽 4.5rem，所有值严格从同一 x 起排；
                  值在窄栏里右对齐，读起来像简历/杂志的资料栏。 */}
              {/* 结构说明：dl 的直接子元素必须是 dt/dd 或包住它们的 div，
                  所以每行用 div 承载两列；链接放在 dd 内部而不是包住整行，
                  这样既保住 mailto: 链接的可点击性，也不破坏 dl 的语义。 */}
              <dl className="mt-4 flex flex-col">
                {contactRows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <div
                      key={row.label}
                      className="group grid grid-cols-[4.5rem_minmax(0,1fr)] items-baseline gap-x-4 border-t border-rule py-3.5"
                    >
                      <dt className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-primary-soft" aria-hidden="true" />
                        <span className="label-caps">{row.label}</span>
                      </dt>
                      <dd className="break-all text-right text-sm text-foreground transition-colors duration-300 group-hover:text-primary-soft">
                        {row.href ? (
                          <a
                            href={row.href}
                            className="underline-offset-4 transition-colors duration-300 hover:text-primary-soft hover:underline"
                          >
                            {row.value}
                          </a>
                        ) : (
                          row.value
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              <span aria-hidden="true" className="rule-hair" />
            </div>

            {/* 社交平台：原图标、原链接、原 aria-label 全部保留，只去掉玻璃底座，
                改成一条细线之下的裸图标行（悬停时才浮起并换品牌色）。 */}
            <div>
              <span aria-hidden="true" className="rule-hair" />
              <h4 className="label-caps mt-5">社交平台 / Elsewhere</h4>
              <div className="mt-4 flex items-center gap-5">
                <a
                  href=""
                  aria-label="Twitter"
                  className="group grid h-6 w-6 place-items-center opacity-70 transition-all duration-300 hover:-translate-y-0.5 hover:opacity-100"
                >
                  <svg
                    t="1783183182814"
                    className="icon"
                    viewBox="0 0 1190 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="5515"
                    width="18"
                    height="18"
                    aria-hidden="true"
                  >
                    <path
                      d="M1053.773298 160.744414c47.629428-29.760217 89.293731-83.354769 107.162943-142.888284-47.629428 29.773298-101.210899 53.633797-154.792371 59.533515C964.466485 29.760217 898.980927 0 827.530244 0 690.607085 0 583.431061 113.114986 583.431061 256.00327c0 17.85613 0 41.664303 5.952043 59.533515-202.421799-11.917168-381.022343-113.114986-506.054497-267.907357C65.485558 83.341688 53.633797 130.984198 53.633797 178.613626c0 89.293731 35.725341 166.696458 101.2109 214.325885-41.677385 0-113.114986-11.917168-113.114987-29.773298v5.952043c0 125.019073 89.306813 226.229972 202.408718 250.051228-17.85613 5.952043-41.664303 11.904087-59.520433 11.904086s-29.773298 0-47.629428-5.952043c29.760217 101.197818 119.040867 178.600544 226.229972 178.600544C279.811444 875.146591 172.674664 916.837057 59.533515 916.837057c-17.85613 0-41.677385 0-59.533515-5.952043a678.742242 678.742242 0 0 0 375.0703 113.114986c446.507901 0 696.559128-392.92643 696.559128-732.28447v-35.71226c47.629428-35.725341 89.306813-83.354769 119.040867-130.984197-35.725341 17.869211-83.341688 29.773298-136.92316 35.725341z m0 0"
                      fill="#1DA1F2"
                      p-id="5516"
                    ></path>
                  </svg>
                </a>
                <a
                  href=""
                  aria-label="Discord"
                  className="group grid h-6 w-6 place-items-center opacity-70 transition-all duration-300 hover:-translate-y-0.5 hover:opacity-100"
                >
                  <svg
                    t="1783183205446"
                    className="icon"
                    viewBox="0 0 1325 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="6513"
                    width="18"
                    height="18"
                    aria-hidden="true"
                  >
                    <path
                      d="M1121.552807 84.974123A1081.785559 1081.785559 0 0 0 851.889272 0.064435a4.094935 4.094935 0 0 0-4.335814 2.107687c-12.345026 22.702803-23.545878 46.068022-33.602557 69.854779a995.069282 995.069282 0 0 0-302.904774 0 711.495011 711.495011 0 0 0-34.024095-69.854779A4.215375 4.215375 0 0 0 472.686218 0.064435C379.52644 16.383957 288.895886 44.928065 202.962464 84.974123a3.854057 3.854057 0 0 0-1.806589 1.565711C29.529909 346.628446-17.561847 600.333777 5.502274 850.967906c0.120439 1.204393 0.722636 2.348566 1.74637 3.131421a1092.986412 1092.986412 0 0 0 330.786466 169.518278 4.215375 4.215375 0 0 0 4.636912-1.56571c25.533126-35.228488 48.17571-72.564663 67.686872-111.586988a4.275594 4.275594 0 0 0 0.180659-3.492739 4.215375 4.215375 0 0 0-2.469006-2.408785 719.203125 719.203125 0 0 1-103.336897-49.982299 4.335814 4.335814 0 0 1-0.421537-7.166137c6.925258-5.239108 13.850517-10.658876 20.474676-16.259302a4.034716 4.034716 0 0 1 4.335814-0.602196c216.790693 100.386135 451.526838 100.386135 665.788307 0a4.034716 4.034716 0 0 1 4.335814 0.602196c6.744599 5.600426 13.549418 11.020194 20.595116 16.259302a4.335814 4.335814 0 0 1-0.421538 7.226357c-33.000361 19.511162-67.566433 36.192002-103.336897 49.861859a4.335814 4.335814 0 0 0-2.228126 6.021964c19.752041 38.721227 42.394624 76.057402 67.566432 111.466548a4.215375 4.215375 0 0 0 4.636912 1.62593 1089.373234 1089.373234 0 0 0 331.388663-169.518278 4.335814 4.335814 0 0 0 1.68615-3.131421c27.701033-289.656454-46.248681-541.374537-195.83426-764.428072a3.3723 3.3723 0 0 0-1.746369-1.62593zM323.642616 562.937382c0-74.67235 52.752402-135.373744 119.114442-135.373744 66.843797 0 120.077956 61.30359 119.054223 135.373744 0 74.61213-52.752402 135.373744-119.054223 135.373744-65.278087 0-119.054222-60.821833-119.054222-135.373744z m559.319989 135.373744c-65.278087 0-119.054222-60.821833-119.054222-135.373744 0-74.67235 52.752402-135.373744 119.054222-135.373744 66.843797 0 120.077956 61.30359 119.054222 135.373744 0 74.61213-52.752402 135.373744-119.054222 135.373744z"
                      fill="#1296db"
                      p-id="6514"
                    ></path>
                  </svg>
                </a>
                <a
                  href=""
                  aria-label="Instagram"
                  className="group grid h-6 w-6 place-items-center opacity-70 transition-all duration-300 hover:-translate-y-0.5 hover:opacity-100"
                >
                  <svg
                    t="1783183236346"
                    className="icon"
                    viewBox="0 0 1024 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="7599"
                    width="18"
                    height="18"
                    aria-hidden="true"
                  >
                    <path
                      d="M739.84 232.96a51.2 51.2 0 1 0 51.2 51.2 51.2 51.2 0 0 0-51.2-51.2z m196.266667 103.253333a323.84 323.84 0 0 0-19.626667-103.68 210.773333 210.773333 0 0 0-49.493333-75.52 200.533333 200.533333 0 0 0-75.52-49.066666 311.466667 311.466667 0 0 0-103.68-20.053334C642.56 85.333333 628.053333 85.333333 512 85.333333s-130.56 0-175.786667 2.56a311.466667 311.466667 0 0 0-103.68 20.053334 203.946667 203.946667 0 0 0-75.52 49.066666 200.533333 200.533333 0 0 0-49.066666 75.52 311.466667 311.466667 0 0 0-20.053334 103.68C85.333333 381.44 85.333333 395.946667 85.333333 512s0 130.56 2.56 175.786667a311.466667 311.466667 0 0 0 20.053334 103.68 200.533333 200.533333 0 0 0 49.066666 75.52 203.946667 203.946667 0 0 0 75.52 49.066666 311.466667 311.466667 0 0 0 103.68 20.053334C381.44 938.666667 395.946667 938.666667 512 938.666667s130.56 0 175.786667-2.56a311.466667 311.466667 0 0 0 103.68-20.053334 200.533333 200.533333 0 0 0 75.52-49.066666 206.933333 206.933333 0 0 0 49.493333-75.52 323.84 323.84 0 0 0 19.626667-103.68c0-45.226667 2.56-59.733333 2.56-175.786667s0-130.56-2.56-175.786667zM859.306667 682.666667a239.36 239.36 0 0 1-14.506667 79.36 130.56 130.56 0 0 1-32 49.066666 136.106667 136.106667 0 0 1-49.066667 32 239.36 239.36 0 0 1-79.36 14.506667c-42.666667 2.133333-58.453333 2.56-170.666666 2.56s-128 0-170.666667-2.56a244.48 244.48 0 0 1-82.773333-12.8 139.52 139.52 0 0 1-46.933334-32 128 128 0 0 1-31.573333-49.066667 236.373333 236.373333 0 0 1-17.066667-81.066666c0-42.666667-2.56-58.453333-2.56-170.666667s0-128 2.56-170.666667a236.373333 236.373333 0 0 1 14.933334-81.066666A128 128 0 0 1 213.333333 213.333333a133.973333 133.973333 0 0 1 46.933334-34.133333A244.48 244.48 0 0 1 341.333333 164.693333c42.666667 0 58.453333-2.56 170.666667-2.56s128 0 170.666667 2.56a239.36 239.36 0 0 1 79.36 14.506667 130.56 130.56 0 0 1 50.773333 34.133333 130.56 130.56 0 0 1 32 46.933334 239.36 239.36 0 0 1 14.506667 81.066666c2.133333 42.666667 2.56 58.453333 2.56 170.666667s-2.133333 128-2.56 170.666667a244.48 244.48 0 0 1-12.8 82.773333 139.52 139.52 0 0 1-32 46.933334 128 128 0 0 1-49.066667 31.573333zM512 316.586667A195.413333 195.413333 0 1 0 707.413333 512 195.413333 195.413333 0 0 0 512 316.586667z m0 322.133333A126.72 126.72 0 1 1 638.72 512 126.72 126.72 0 0 1 512 638.72z"
                      p-id="7600"
                      fill="#d4237a"
                    ></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* 右：表单。去掉玻璃卡与玻璃描边，只保留一条顶细线划分栏位。 */}
          <div className="lg:col-span-7 lg:col-start-6">
            <span aria-hidden="true" className="rule-hair" />

            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="type-h3 text-foreground">发送消息</h3>
              <span className="label-caps">在线发送 / Direct message</span>
            </div>

            <form onSubmit={handleSubmit} className="mt-8">
              <div className="mb-6">
                <label
                  htmlFor="user_name"
                  className="label-caps mb-2 block"
                >
                  你的姓名
                </label>
                <input
                  type="text"
                  id="user_name"
                  name="user_name"
                  value={formData.user_name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  className={fieldShell}
                  placeholder="Anyeling..."
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="user_email"
                  className="label-caps mb-2 block"
                >
                  你的邮箱
                </label>
                <input
                  type="email"
                  id="user_email"
                  name="user_email"
                  value={formData.user_email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  className={fieldShell}
                  placeholder="jojo@gmail.com"
                />
              </div>

              <div className="mb-8">
                <label
                  htmlFor="message"
                  className="label-caps mb-2 block"
                >
                  留言内容
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  className={cn(fieldShell, "resize-none")}
                  placeholder="你好，我想和你聊聊..."
                />
              </div>

              <MagneticButton className="w-full" strength={7}>
              <button
                type="submit"
                disabled={submitDisabled}
                aria-disabled={submitDisabled}
                aria-live="polite"
                data-fx-ripple={submitDisabled ? undefined : ""}
                className={cn(
                  "editorial-button-solid fx-ripple-host group w-full justify-center gap-2 text-sm",
                  "disabled:cursor-not-allowed disabled:opacity-70",
                  /* 冷却中：退成描边态 + 弱化文字，与可点击的实底按钮一眼可分。
                     新按钮是「实底墨字」，冷却态直接关掉实底（bg-transparent），
                     不需要再像旧 cosmic-button 那样用 bg-none 去盖渐变。 */
                  isCoolingDown &&
                    "bg-transparent border-white/[0.16] text-subtle hover:bg-transparent hover:text-subtle",
                )}
              >
                {isSubmitting ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                    />
                    发送中...
                  </>
                ) : isCoolingDown ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent opacity-50"
                    />
                    {cooldownLeft} 秒后可再次发送
                  </>
                ) : (
                  <>
                    发送消息
                    <Send
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </>
                )}
              </button>
              </MagneticButton>

              <p
                className="type-micro mt-4 text-start"
                aria-live="polite"
              >
                {isCoolingDown
                  ? `发送冷却中 · 还可发送时间 ${cooldownLeft} 秒`
                  : "发送至站主邮箱 · 60 秒内仅可提交一次"}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
