"use client";

/**
 * Contact plumbing — every channel is built at runtime so no address,
 * handle or user ID is ever rendered as text on the page.
 */

const MAIL_USER = "contractmeskat";
const MAIL_DOMAIN = "gmail.com";

export const EV_CONTACT = "ma:contact";

export const X_TEAM_URL = "https://x.com/axiomdeploy";
export const X_PERSONAL_URL = "https://x.com/DotSeekX";
export const DISCORD_URL = "https://discord.com/users/1496966372524167441";

export interface ContactDetail {
  topic?: string;
  message?: string;
  /** "gmail" opens the compose window; anything else opens the on-site form. */
  channel?: "form" | "gmail" | "x" | "discord";
}

function mailAddress(): string {
  return `${MAIL_USER}@${MAIL_DOMAIN}`;
}

/** Real Gmail compose link — the destination stays inside the URL, never the UI. */
export function gmailCompose(subject = "", body = ""): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: mailAddress(),
  });
  if (subject) params.set("su", subject);
  if (body) params.set("body", body);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function openGmail(subject = "", body = "") {
  if (typeof window === "undefined") return;
  const url = gmailCompose(subject, body);
  const win = window.open(url, "_blank");
  if (win) {
    try {
      win.opener = null;
    } catch {}
  } else {
    window.location.href = url;
  }
}

export async function copyMailAddress(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(mailAddress());
    return true;
  } catch {
    return false;
  }
}

/** Fire from any CTA: the Contact component listens and opens the modal. */
export function openContact(detail: ContactDetail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ContactDetail>(EV_CONTACT, { detail }));
}

export function openChannel(channel: ContactDetail["channel"], detail: Omit<ContactDetail, "channel"> = {}) {
  if (channel === "gmail") {
    openGmail(detail.topic ?? "Hello Meskat", detail.message ?? "");
    return;
  }
  if (channel === "x") {
    if (typeof window !== "undefined") window.open(X_TEAM_URL, "_blank", "noopener,noreferrer");
    return;
  }
  if (channel === "discord") {
    if (typeof window !== "undefined") window.open(DISCORD_URL, "_blank", "noopener,noreferrer");
    return;
  }
  openContact(detail);
}
