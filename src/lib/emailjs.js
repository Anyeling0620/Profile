const EMAILJS_SEND_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";
const CONTACT_MESSAGE_COOLDOWN_MS = 60 * 1000;

const requiredEnvKeys = [
  "VITE_EMAILJS_SERVICE_ID",
  "VITE_EMAILJS_TEMPLATE_ID",
  "VITE_EMAILJS_PUBLIC_KEY",
];

function validateEmailjsConfig(config) {
  const missingKeys = [
    ["serviceId", "VITE_EMAILJS_SERVICE_ID"],
    ["templateId", "VITE_EMAILJS_TEMPLATE_ID"],
    ["publicKey", "VITE_EMAILJS_PUBLIC_KEY"],
  ]
    .filter(([configKey]) => !config?.[configKey]?.trim())
    .map(([, envKey]) => envKey);

  if (missingKeys.length > 0) {
    throw new Error(`缺少 EmailJS 环境变量：${missingKeys.join(", ")}`);
  }
}

function getEmailjsConfig(env = import.meta.env) {
  const missingKeys = requiredEnvKeys.filter((key) => !env?.[key]?.trim());

  if (missingKeys.length > 0) {
    throw new Error(`缺少 EmailJS 环境变量：${missingKeys.join(", ")}`);
  }

  return {
    serviceId: env.VITE_EMAILJS_SERVICE_ID.trim(),
    templateId: env.VITE_EMAILJS_TEMPLATE_ID.trim(),
    publicKey: env.VITE_EMAILJS_PUBLIC_KEY.trim(),
  };
}

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

function buildEmailjsPayload(config, templateParams) {
  validateEmailjsConfig(config);

  return {
    service_id: config.serviceId,
    template_id: config.templateId,
    user_id: config.publicKey,
    template_params: {
      user_name: templateParams.user_name.trim(),
      user_email: templateParams.user_email.trim(),
      message: templateParams.message.trim(),
    },
  };
}

async function sendEmailjsMessage(formData, config, options = {}) {
  const validationError = validateContactForm(formData);

  if (validationError) {
    throw new Error(validationError);
  }

  const payload = buildEmailjsPayload(config, formData);
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(EMAILJS_SEND_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `EmailJS 发送失败，状态码：${response.status}`);
  }
}

export {
  CONTACT_MESSAGE_COOLDOWN_MS,
  EMAILJS_SEND_ENDPOINT,
  buildEmailjsPayload,
  getContactMessageCooldown,
  getEmailjsConfig,
  sendEmailjsMessage,
  validateEmailjsConfig,
  validateContactForm,
};
