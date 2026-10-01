import { toast as toastify } from "react-toastify";

export const showToast = (message, severity = "success", options = {}) => {
  if (!message) return;
  const toastId = options.toastId || (typeof message === "string" ? message : JSON.stringify(message));

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
      return toastify.error(message, config);
    case "warning":
      return toastify.warning(message, config);
    case "info":
      return toastify.info(message, config);
    case "success":
    default:
      return toastify.success(message, config);
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
