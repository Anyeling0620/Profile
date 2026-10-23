// 联系表单发信：调用本站后端 /api/contact（contact-mailer）
//
// 历史：这里原来是直连 EmailJS 的实现，需要三个构建期变量
// VITE_EMAILJS_SERVICE_ID / VITE_EMAILJS_TEMPLATE_ID / VITE_EMAILJS_PUBLIC_KEY，
// 而仓库与 CI 都没有注入，导致表单一点就报「缺少 EmailJS 环境变量」。
//
// 现在改为同源提交到本站的 contact-mailer 服务：SMTP 凭据只存在服务端，
// 前端不再需要任何密钥，也不受构建环境变量影响。

const CONTACT_ENDPOINT = "/api/contact";
const CONTACT_MESSAGE_COOLDOWN_MS = 60 * 1000;

function validateContactForm(formData) {
  if (!formData?.user_name?.trim()) {
    return "请填写你的姓名。";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData?.user_email?.trim())) {
    return "请填写有效的邮箱地址。";
  }

  if (!formData?.message?.trim()) {
    return "请填写留言内容。";
  }

  return "";
}

function getContactMessageCooldown(lastSentAt, now = Date.now()) {
  if (!lastSentAt) {
    return 0;
  }

  return Math.max(0, CONTACT_MESSAGE_COOLDOWN_MS - (now - lastSentAt));
}

function buildContactPayload(templateParams) {
  return {
    name: templateParams.user_name.trim(),
    email: templateParams.user_email.trim(),
    message: templateParams.message.trim(),
  };
}

async function sendContactMessage(formData, options = {}) {
  const validationError = validateContactForm(formData);

  if (validationError) {
    throw new Error(validationError);
  }

  const payload = buildContactPayload(formData);
  const fetcher = options.fetcher ?? fetch;

  let response;
  try {
    response = await fetcher(CONTACT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("网络异常，请稍后重试，或直接通过邮箱联系我。");
  }

  if (!response.ok) {
    // 后端在 body 里给了人话错误，优先用它
    let message = "";
    try {
      const data = await response.json();
      message = data?.error || "";
    } catch {
      message = "";
    }
    throw new Error(message || `发送失败（${response.status}），请稍后重试。`);
  }
}

export {
  CONTACT_ENDPOINT,
  CONTACT_MESSAGE_COOLDOWN_MS,
  buildContactPayload,
  getContactMessageCooldown,
  sendContactMessage,
  validateContactForm,
};
