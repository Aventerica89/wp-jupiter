import { db } from "./db";
import { notificationSettings, notificationHistory, type NotificationSetting } from "./db/schema";
import { eq } from "drizzle-orm";

export interface NotificationPayload {
  siteId?: number;
  siteName?: string;
  event: string;
  message: string;
  severity?: "info" | "warning" | "error";
}

// HIGH FIX: Define proper types for notification configs
interface EmailConfig {
  to: string;
  from?: string;
}

interface WebhookConfig {
  webhookUrl: string;
  headers?: Record<string, string>;
}

// CRITICAL FIX: Validate webhook URLs to prevent SSRF
function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Block internal/private addresses
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254'];
    if (blockedHosts.some(blocked => parsed.hostname === blocked || parsed.hostname.endsWith(`.${blocked}`))) {
      return false;
    }

    // Block private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
    if (parsed.hostname.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/)) {
      return false;
    }

    // Require HTTPS for production
    if (process.env.NODE_ENV === "production" && parsed.protocol !== 'https:') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function sendNotification(payload: NotificationPayload) {
  const { siteId, event, message } = payload;

  // Get enabled notification settings for this event type
  const settings = await db.query.notificationSettings.findMany({
    where: eq(notificationSettings.enabled, true),
  });

  for (const setting of settings) {
    const events = setting.events ? JSON.parse(setting.events) : [];

    // Check if this event should trigger this notification
    if (events.length > 0 && !events.includes(event)) {
      continue;
    }

    try {
      switch (setting.type) {
        case "email":
          await sendEmailNotification(setting, payload);
          break;

        case "slack":
          await sendSlackNotification(setting, payload);
          break;

        case "discord":
          await sendDiscordNotification(setting, payload);
          break;

        case "webhook":
          await sendWebhookNotification(setting, payload);
          break;
      }

      // Log successful notification
      await db.insert(notificationHistory).values({
        settingId: setting.id,
        siteId: siteId || null,
        event,
        message,
        status: "sent",
      });
    } catch (error) {
      console.error(`Failed to send ${setting.type} notification:`, error);

      // Log failed notification
      await db.insert(notificationHistory).values({
        settingId: setting.id,
        siteId: siteId || null,
        event,
        message,
        status: "failed",
        errorMessage: String(error),
      });
    }
  }
}

async function sendEmailNotification(
  setting: NotificationSetting,
  payload: NotificationPayload
) {
  const config: EmailConfig = setting.config ? JSON.parse(setting.config) : {};
  const { to, from } = config;

  if (!to) {
    throw new Error("Email notification config missing 'to' address");
  }

  // TODO: Integrate with email service (SendGrid, Resend, etc.)
  console.log(`[EMAIL] To: ${to}, Message: ${payload.message}`);

  // Example integration with Resend:
  /*
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: from || 'notifications@wpmanager.app',
    to,
    subject: `WP Manager Alert: ${payload.event}`,
    html: `
      <h2>${payload.siteName || 'Site'} - ${payload.event}</h2>
      <p>${payload.message}</p>
    `,
  });
  */
}

async function sendSlackNotification(
  setting: NotificationSetting,
  payload: NotificationPayload
) {
  const config: WebhookConfig = setting.config ? JSON.parse(setting.config) : {};
  const { webhookUrl } = config;

  if (!webhookUrl) {
    throw new Error("Slack notification config missing 'webhookUrl'");
  }

  // CRITICAL FIX: Validate webhook URL to prevent SSRF
  if (!isValidWebhookUrl(webhookUrl)) {
    throw new Error("Invalid or blocked webhook URL");
  }

  const color =
    payload.severity === "error"
      ? "#ef4444"
      : payload.severity === "warning"
        ? "#f59e0b"
        : "#3b82f6";

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attachments: [
        {
          color,
          title: payload.siteName || "WP Manager",
          text: payload.message,
          footer: `Event: ${payload.event}`,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack API returned ${response.status}`);
  }
}

async function sendDiscordNotification(
  setting: NotificationSetting,
  payload: NotificationPayload
) {
  const config: WebhookConfig = setting.config ? JSON.parse(setting.config) : {};
  const { webhookUrl } = config;

  if (!webhookUrl) {
    throw new Error("Discord notification config missing 'webhookUrl'");
  }

  // CRITICAL FIX: Validate webhook URL to prevent SSRF
  if (!isValidWebhookUrl(webhookUrl)) {
    throw new Error("Invalid or blocked webhook URL");
  }

  const color =
    payload.severity === "error"
      ? 0xef4444
      : payload.severity === "warning"
        ? 0xf59e0b
        : 0x3b82f6;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        {
          title: payload.siteName || "WP Manager Alert",
          description: payload.message,
          color,
          footer: {
            text: `Event: ${payload.event}`,
          },
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord API returned ${response.status}`);
  }
}

async function sendWebhookNotification(
  setting: NotificationSetting,
  payload: NotificationPayload
) {
  const config: WebhookConfig = setting.config ? JSON.parse(setting.config) : {};
  const { webhookUrl, headers } = config;

  if (!webhookUrl) {
    throw new Error("Webhook notification config missing 'webhookUrl'");
  }

  // CRITICAL FIX: Validate webhook URL to prevent SSRF
  if (!isValidWebhookUrl(webhookUrl)) {
    throw new Error("Invalid or blocked webhook URL");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    body: JSON.stringify({
      event: payload.event,
      siteId: payload.siteId,
      siteName: payload.siteName,
      message: payload.message,
      severity: payload.severity,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Webhook returned ${response.status}`);
  }
}

// Helper functions for common notification scenarios
export async function notifySiteOffline(siteId: number, siteName: string) {
  await sendNotification({
    siteId,
    siteName,
    event: "site_offline",
    message: `Site "${siteName}" is offline and unreachable.`,
    severity: "error",
  });
}

export async function notifyUpdatesAvailable(
  siteId: number,
  siteName: string,
  pluginCount: number,
  themeCount: number
) {
  await sendNotification({
    siteId,
    siteName,
    event: "updates_available",
    message: `${pluginCount} plugin update(s) and ${themeCount} theme update(s) available.`,
    severity: "info",
  });
}

export async function notifySecurityIssue(
  siteId: number,
  siteName: string,
  issueCount: number
) {
  await sendNotification({
    siteId,
    siteName,
    event: "security_issue",
    message: `${issueCount} security issue(s) detected on "${siteName}".`,
    severity: "error",
  });
}
