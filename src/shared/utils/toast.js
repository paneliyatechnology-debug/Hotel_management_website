import { toast as toastify } from "react-toastify";

export const showToast = (message, severity = "success", options = {}) => {
  if (!message) return;

  let textMessage = message;
  if (typeof message === "object" && message !== null) {
    textMessage = message.message || message.error || message.detail || JSON.stringify(message);
  }
  textMessage = String(textMessage || "").trim();

  if (!textMessage || textMessage === "{}" || textMessage === "[object Object]") {
    return;
  }

  const toastId = options.toastId || textMessage;

  if (toastify.isActive && toastify.isActive(toastId)) {
    return toastId;
  }

  const config = {
    toastId,
    position: "top-right",
    autoClose: 3500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  };

  switch (severity) {
    case "error":
      return toastify.error(textMessage, config);
    case "warning":
      return toastify.warning(textMessage, config);
    case "info":
      return toastify.info(textMessage, config);
    case "success":
    default:
      return toastify.success(textMessage, config);
  }
};

export const toast = {
  success: (msg, options) => showToast(msg, "success", options),
  error: (msg, options) => showToast(msg, "error", options),
  warning: (msg, options) => showToast(msg, "warning", options),
  info: (msg, options) => showToast(msg, "info", options),
  show: showToast,
};

export default toast;
