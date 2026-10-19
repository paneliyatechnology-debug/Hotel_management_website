"use client";

import { useEffect } from "react";

const TEXT_TYPES = new Set(["text", "email", "password", "tel", "search", "url", "number"]);

function isTextField(element) {
  if (element.tagName === "TEXTAREA") return true;
  if (element.tagName !== "INPUT") return false;
  const type = (element.getAttribute("type") || "text").toLowerCase();
  return TEXT_TYPES.has(type);
}

function unlock(element) {
  if (element.dataset.autofillGuard !== "1") return;
  element.readOnly = false;
  delete element.dataset.autofillGuard;
}

function protect(element) {
  element.setAttribute("autocomplete", "off");
  element.setAttribute("autocorrect", "off");
  element.setAttribute("autocapitalize", "off");
  element.spellcheck = false;

  if (!isTextField(element) || element.disabled || element.readOnly || element.dataset.autofillGuard === "1") {
    return;
  }

  element.dataset.autofillGuard = "1";
  element.readOnly = true;
  element.addEventListener("focus", () => unlock(element), { once: true });
  element.addEventListener("pointerdown", () => unlock(element), { once: true });
}

function protectTree(root) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll("form").forEach((form) => form.setAttribute("autocomplete", "off"));
  root.querySelectorAll("input, textarea").forEach(protect);
}

export default function DisableBrowserAutofill() {
  useEffect(() => {
    protectTree(document);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches?.("input, textarea")) protect(node);
          if (node.matches?.("form")) node.setAttribute("autocomplete", "off");
          protectTree(node);
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
