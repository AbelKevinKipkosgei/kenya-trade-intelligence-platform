import type { NotificationType } from "../schema";

interface NotificationEmailData {
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
}

/**
 * Generate HTML email template for a notification
 */
export function generateNotificationEmail(
  userName: string,
  notification: NotificationEmailData
): { subject: string; html: string } {
  const subject = getEmailSubject(notification.type, notification.title);
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif; background-color: #f9fafb; color: #18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Kenya flag colors -->
    <tr>
      <td style="padding: 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="33.33%" style="height: 8px; background-color: #000000;"></td>
            <td width="33.33%" style="height: 8px; background-color: #BB0000;"></td>
            <td width="33.33%" style="height: 8px; background-color: #006600;"></td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Logo and Title -->
    <tr>
      <td style="padding: 32px 24px 24px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <h2 style="margin: 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a;">
                State Department for Trade
              </h2>
              <h1 style="margin: 4px 0 0 0; font-size: 14px; font-weight: 600; color: #18181b;">
                Kenya Trade Intelligence Platform
              </h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Notification Icon -->
    <tr>
      <td style="padding: 0 24px;">
        <div style="font-size: 48px; text-align: center; padding: 16px 0;">
          ${getNotificationIcon(notification.type)}
        </div>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 0 24px 24px 24px;">
        <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #18181b; text-align: center;">
          ${notification.title}
        </h2>
        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #52525b;">
          ${notification.message}
        </p>

        ${
          notification.metadata
            ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0; background-color: #f4f4f5; border-radius: 4px;">
          <tr>
            <td style="padding: 12px;">
              ${
                notification.metadata.hsCode
                  ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #71717a;"><strong>HS Code:</strong> ${notification.metadata.hsCode}</p>`
                  : ""
              }
              ${
                notification.metadata.countryName
                  ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #71717a;"><strong>Country:</strong> ${notification.metadata.countryName}</p>`
                  : ""
              }
              ${
                notification.metadata.oldValue && notification.metadata.newValue
                  ? `<p style="margin: 0; font-size: 12px; color: #71717a;"><strong>Change:</strong> ${notification.metadata.oldValue} → ${notification.metadata.newValue}</p>`
                  : ""
              }
            </td>
          </tr>
        </table>
        `
            : ""
        }

        ${
          notification.actionUrl
            ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0 0 0;">
          <tr>
            <td align="center">
              <a href="${getFullUrl(notification.actionUrl)}" 
                 style="display: inline-block; padding: 12px 32px; background-color: #006600; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 0;">
                View Details
              </a>
            </td>
          </tr>
        </table>
        `
            : ""
        }
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px; border-top: 1px solid #e4e4e7; background-color: #fafafa;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #71717a;">
          You received this email because you have notifications enabled for your Kenya Trade Intelligence Platform account.
        </p>
        <p style="margin: 0; font-size: 12px; color: #71717a;">
          <a href="${getFullUrl("/profile")}" style="color: #006600; text-decoration: none;">Manage notification preferences</a> | 
          <a href="${getFullUrl("/notifications")}" style="color: #006600; text-decoration: none;">View all notifications</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html };
}

/**
 * Generate HTML email template for a digest of multiple notifications
 */
export function generateDigestEmail(
  userName: string,
  notifications: NotificationEmailData[]
): { subject: string; html: string } {
  const subject = `Your Trade Intelligence Digest (${notifications.length} updates)`;
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif; background-color: #f9fafb; color: #18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Kenya flag colors -->
    <tr>
      <td style="padding: 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="33.33%" style="height: 8px; background-color: #000000;"></td>
            <td width="33.33%" style="height: 8px; background-color: #BB0000;"></td>
            <td width="33.33%" style="height: 8px; background-color: #006600;"></td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Logo and Title -->
    <tr>
      <td style="padding: 32px 24px 24px 24px;">
        <h2 style="margin: 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a;">
          State Department for Trade
        </h2>
        <h1 style="margin: 4px 0 0 0; font-size: 14px; font-weight: 600; color: #18181b;">
          Kenya Trade Intelligence Platform
        </h1>
      </td>
    </tr>

    <!-- Greeting -->
    <tr>
      <td style="padding: 0 24px 24px 24px;">
        <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #18181b;">
          Hi ${userName},
        </h2>
        <p style="margin: 0; font-size: 14px; color: #52525b;">
          You have ${notifications.length} new update${notifications.length > 1 ? "s" : ""} on your watchlist items.
        </p>
      </td>
    </tr>

    <!-- Notifications List -->
    ${notifications
      .map(
        (notification, index) => `
    <tr>
      <td style="padding: ${index === 0 ? "0" : "16px"} 24px 16px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e4e4e7; border-radius: 4px;">
          <tr>
            <td style="padding: 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="40" valign="top">
                    <div style="font-size: 24px;">${getNotificationIcon(notification.type)}</div>
                  </td>
                  <td valign="top">
                    <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #18181b;">
                      ${notification.title}
                    </h3>
                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #52525b;">
                      ${notification.message.substring(0, 150)}${notification.message.length > 150 ? "..." : ""}
                    </p>
                    ${
                      notification.actionUrl
                        ? `
                    <p style="margin: 8px 0 0 0;">
                      <a href="${getFullUrl(notification.actionUrl)}" style="font-size: 12px; color: #006600; text-decoration: none; font-weight: 600;">
                        View details →
                      </a>
                    </p>
                    `
                        : ""
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    `
      )
      .join("")}

    <!-- View All Button -->
    <tr>
      <td style="padding: 24px 24px 32px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="${getFullUrl("/notifications")}" 
                 style="display: inline-block; padding: 12px 32px; background-color: #006600; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 0;">
                View All Notifications
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px; border-top: 1px solid #e4e4e7; background-color: #fafafa;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #71717a;">
          You received this digest because you have email notifications enabled for your Kenya Trade Intelligence Platform account.
        </p>
        <p style="margin: 0; font-size: 12px; color: #71717a;">
          <a href="${getFullUrl("/profile")}" style="color: #006600; text-decoration: none;">Manage notification preferences</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html };
}

function getEmailSubject(type: NotificationType, title: string): string {
  const prefix = "Trade Alert:";
  return `${prefix} ${title}`;
}

function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case "tariff_change":
      return "📊";
    case "new_barrier":
      return "⚠️";
    case "barrier_resolved":
      return "✅";
    case "opportunity_score_change":
      return "📈";
    case "new_opportunity":
      return "🎯";
    case "price_alert":
      return "💰";
    case "watchlist_digest":
      return "📋";
    default:
      return "🔔";
  }
}

function getFullUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}${path}`;
}
