// 编辑式（editorial）排版辅助函数
//
// 这一层的定位：把「序号怎么补零」「文字怎么分栏」「一行大概放多少字」
// 这些排版决策从组件里抽出来，变成可单测的纯函数。
// 组件侧只负责把结果渲染出来，不再各自实现一套 padStart / slice。
//
// 设计约束：
//   · 全部为纯函数（同输入必同输出），不读 DOM、不读 window、不读 locale 环境，
//     因此可以直接跑在 node --test 里（项目测试命令：node --test "src/**/*.test.js"）。
//   · 不引入任何第三方依赖（硬约束：不新增 npm 依赖）。
//   · 单位与取值要与 src/index.css 里的 --type-* / --measure 刻度对齐，
//     避免出现「CSS 说 62ch、JS 说一行 90 字」这种两套标准。

/** 默认序号位数：编辑式版面里 01~09 是最常见的规模，两位即可 */
export const DEFAULT_INDEX_PAD = 2;

/** 版心行宽（ch）的默认值，必须与 src/index.css 的 --measure 保持一致 */
export const DEFAULT_MEASURE_CH = 62;

/** 全角/宽字符的显示宽度（中文、日文、韩文、全角标点） */
const WIDE_CHAR_WIDTH = 2;
/** 半角字符的显示宽度 */
const NARROW_CHAR_WIDTH = 1;

/**
 * 判断某个码点是否按「宽字符」计算宽度。
 *
 * 覆盖范围（够本站用，且比完整 Unicode East Asian Width 表轻得多）：
 *   · CJK 统一表意文字及扩展区：U+3400–U+4DBF、U+4E00–U+9FFF、U+F900–U+FAFF
 *   · CJK 兼容补充与扩展 B 段起：U+20000 以上（用 surrogate pair 后的码点判断）
 *   · 全角/中文标点：U+3000–U+303F（。、〈〉等）
 *   · 常用中文标点与全角形式：U+FF00–U+FFEF
 *   · 省略号、破折号等中文排版符号：U+2018–U+201F 之间的引号按窄算，
 *     但 U+2026（…）与 U+2014（—）在中文里占一个全角位，按宽算
 *
 * 故意不算宽的：ASCII、拉丁扩展、希腊/西里尔、阿拉伯文、emoji（emoji 宽度
 * 因平台而异，算作 1 会让结果稳定但略偏窄；本层用于「一行大概多少字」的
 * 粗估，不需要逐字形精确）。
 *
 * @param {number} codePoint Unicode 码点
 * @returns {number} 1 或 2
 */
function codePointWidth(codePoint) {
  if (codePoint >= 0x1100 && codePoint <= 0x115f) return WIDE_CHAR_WIDTH; // 韩文字母
  if (codePoint >= 0x2e80 && codePoint <= 0x303e) return WIDE_CHAR_WIDTH; // CJK 部首 + 标点
  if (codePoint >= 0x3041 && codePoint <= 0x33ff) return WIDE_CHAR_WIDTH; // 假名 + CJK 兼容
  if (codePoint >= 0x3400 && codePoint <= 0x4dbf) return WIDE_CHAR_WIDTH; // CJK 扩展 A
  if (codePoint >= 0x4e00 && codePoint <= 0x9fff) return WIDE_CHAR_WIDTH; // CJK 基本区
  if (codePoint >= 0xa000 && codePoint <= 0xa4cf) return WIDE_CHAR_WIDTH; // 彝文
  if (codePoint >= 0xac00 && codePoint <= 0xd7a3) return WIDE_CHAR_WIDTH; // 韩文音节
  if (codePoint >= 0xf900 && codePoint <= 0xfaff) return WIDE_CHAR_WIDTH; // CJK 兼容表意
  if (codePoint >= 0xfe30 && codePoint <= 0xfe6f) return WIDE_CHAR_WIDTH; // CJK 兼容形式
  if (codePoint >= 0xff00 && codePoint <= 0xff60) return WIDE_CHAR_WIDTH; // 全角 ASCII
  if (codePoint >= 0xffe0 && codePoint <= 0xffe6) return WIDE_CHAR_WIDTH; // 全角符号
  if (codePoint >= 0x20000 && codePoint <= 0x3fffd) return WIDE_CHAR_WIDTH; // CJK 扩展 B+
  if (codePoint === 0x2026 || codePoint === 0x2014) return WIDE_CHAR_WIDTH; // … 与 ——
  return NARROW_CHAR_WIDTH;
}

/**
 * 估算一段文本的显示宽度（以「半角字符」为 1 个单位）。
 *
 * 用途：判断一段导语在当前版心（--measure 62ch）下会折成几行，
 * 或者在分栏前估算总宽度。**这是估算，不是真实字形测量**——真实测量必须
 * 走 canvas measureText，而那是浏览器专属、无法进 node 单测。
 * 中文为主的内容里，这个估算的误差主要来自拉丁字体的平均字宽，通常 < 8%。
 *
 * @param {string} text 任意文本
 * @returns {number} 显示宽度单位数；非字符串按空串处理
 */
export function measureDisplayWidth(text) {
  if (typeof text !== "string" || text.length === 0) return 0;

  let width = 0;
  // 用 for...of 按码点迭代，surrogate pair（如扩展 B 汉字）不会被拆成两个半角
  for (const char of text) {
    width += codePointWidth(char.codePointAt(0));
  }
  return width;
}

/**
 * 把数字格式化成编辑式序号："1" → "01"。
 *
 * 为什么需要它：超大序号（.index-figure）用 tabular-nums 对齐，
 * 一旦混入 "1" 和 "01" 两种写法，等宽数字也救不了列不对齐。
 * 统一在数据层补零，渲染层就不用再关心。
 *
 * @param {number} value 序号，从 1 开始
 * @param {{pad?: number, min?: number}} [options]
 *    pad  补零到几位，默认 2；超过实际位数时原样输出（"99" 保持 "99"）
 *    min  允许的最小值，默认 1；小于它直接抛错，避免把 0 号板块画出来
 * @returns {string} 补零后的序号
 * @throws {TypeError} value 不是有限数字
 * @throws {RangeError} value 小于 min，或 pad 越界（1–6）
 */
export function formatIndex(value, options = {}) {
  const { pad = DEFAULT_INDEX_PAD, min = 1 } = options;

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`formatIndex: 序号必须是有限数字，收到 ${String(value)}`);
  }
  if (!Number.isInteger(pad) || pad < 1 || pad > 6) {
    throw new RangeError(`formatIndex: pad 必须是 1–6 的整数，收到 ${String(pad)}`);
  }

  const rounded = Math.trunc(value);
  if (rounded < min) {
    throw new RangeError(`formatIndex: 序号必须 ≥ ${min}，收到 ${String(value)}`);
  }

  const sign = rounded < 0 ? "-" : "";
  const digits = String(Math.abs(rounded));
  return sign + digits.padStart(pad, "0");
}

/**
 * 生成一串连续序号，供板块列表直接 map 使用。
 *
 * @param {number} count 需要几个序号（≥ 0）
 * @param {{pad?: number, start?: number}} [options]
 *    start 起始序号，默认 1
 * @returns {string[]} 例如 count=3 → ["01","02","03"]
 * @throws {RangeError} count 不是非负整数，或 start 小于 1
 */
export function indexSequence(count, options = {}) {
  const { pad = DEFAULT_INDEX_PAD, start = 1 } = options;

  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(`indexSequence: count 必须是非负整数，收到 ${String(count)}`);
  }
  if (!Number.isInteger(start) || start < 1) {
    throw new RangeError(`indexSequence: start 必须是 ≥ 1 的整数，收到 ${String(start)}`);
  }

  return Array.from({ length: count }, (_, i) => formatIndex(start + i, { pad }));
}

/**
 * 把一组条目按顺序切成「视觉重量大致相等」的若干栏。
 *
 * 算法：先算总重，得到每栏的目标重；然后顺序累加，一旦某一栏达到目标就开新栏。
 * 这是经典的 greedy line-break，能保证**顺序不变**（语义不能乱），
 * 又不会像「数个数均分」那样把 3 个长段和 3 个短词分到同一栏。
 *
 * 已知取舍：最后一栏可能偏轻；这是 greedy 的固有特性，
 * 对编辑式版面反而自然（右栏收尾留白）。若要严格等重，请改用 DP。
 *
 * @template T
 * @param {T[]} items 条目数组
 * @param {{columns?: number, weigh?: (item: T, index: number) => number}} [options]
 *    columns 目标栏数，默认 2
 *    weigh   权重函数，默认 measureDisplayWidth(item)（字符串按显示宽度，其余算 1）
 * @returns {T[][]} 长度不超过 columns 的分栏数组（空输入返回 []）
 * @throws {RangeError} columns 不是 1–8 的整数
 */
export function balanceColumns(items, options = {}) {
  const { columns = 2, weigh } = options;

  if (!Number.isInteger(columns) || columns < 1 || columns > 8) {
    throw new RangeError(`balanceColumns: columns 必须是 1–8 的整数，收到 ${String(columns)}`);
  }
  if (!Array.isArray(items)) {
    throw new TypeError("balanceColumns: items 必须是数组");
  }
  if (items.length === 0) return [];
  if (columns === 1) return [items.slice()];

  const weightOf = typeof weigh === "function"
    ? (item, i) => {
        const w = weigh(item, i);
        // 权重必须是非负数；负数会破坏贪心终止条件，直接夹到 0
        return Number.isFinite(w) && w > 0 ? w : 0;
      }
    : (item) => {
        const w = measureDisplayWidth(item);
        // 空字符串条目权重为 0，回退成 1，避免整栏被它「免费」吞掉
        return w === 0 ? 1 : w;
      };

  const total = items.reduce((sum, item, i) => sum + weightOf(item, i), 0);
  const target = total / columns;

  const result = [];
  let current = [];
  let currentWeight = 0;

  for (let i = 0; i < items.length; i += 1) {
    const weight = weightOf(items[i], i);

    // 开新栏的条件：已有内容、还没到最后一栏、且当前栏已经达到目标重。
    // 判断「累加后」会把最后一个条目推到下一栏，所以用「累加前」判断，
    // 并额外放行 weight 为 0 的条目——它们不占版面，跟着上一栏更合理。
    //
    // remainingItems >= remainingColumns - 1 是「不许留空栏」的守卫：
    // 当前条目会被推进新栏，所以新栏一定非空，剩下的栏目数少一个；
    // 剩下的条目必须够填满它们（每栏至少 1 条）。
    const remainingColumns = columns - result.length;
    const remainingItems = items.length - i;
    if (
      current.length > 0 &&
      currentWeight >= target &&
      remainingColumns > 1 &&
      remainingItems >= remainingColumns - 1 &&
      weight > 0
    ) {
      result.push(current);
      current = [];
      currentWeight = 0;
    }

    current.push(items[i]);
    currentWeight += weight;
  }

  if (current.length > 0) result.push(current);
  return result;
}

/**
 * 估算一段文本在版心下会折成几行。
 *
 * 用途：决定导语是否要缩短、标题是否要降一档字号。属于「排版体检」，
 * 供组件在开发期或 SSR 前做判断，不用于运行时强制断行。
 *
 * @param {string} text 文本
 * @param {{measureCh?: number}} [options] measureCh 一行可容纳的半角单位数，
 *   默认取 DEFAULT_MEASURE_CH（62），与 --measure: 62ch 对齐
 * @returns {number} 估算行数；空文本返回 0
 * @throws {RangeError} measureCh 不是正数
 */
export function estimateLines(text, options = {}) {
  const { measureCh = DEFAULT_MEASURE_CH } = options;

  if (!Number.isFinite(measureCh) || measureCh <= 0) {
    throw new RangeError(`estimateLines: measureCh 必须是正数，收到 ${String(measureCh)}`);
  }
  if (typeof text !== "string" || text.length === 0) return 0;

  const width = measureDisplayWidth(text);
  return Math.max(1, Math.ceil(width / measureCh));
}
