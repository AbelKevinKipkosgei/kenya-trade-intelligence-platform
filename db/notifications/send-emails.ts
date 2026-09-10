import "dotenv/config";
import { Resend } from "resend";
import { db } from "../client";
import { notifications, userProfiles, users } from "../schema";
import { eq, and, lte, isNull } from "drizzle-orm";
import { generateNotificationEmail, generateDigestEmail } from "./email-templates";

// Only initialize Resend if API key is present
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface EmailNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

/**
 * Send email notifications to users based on their preferences
 * Run this script periodically (e.g., hourly or as triggered by detection scripts)
 * 
 * Usage: npx tsx db/notifications/send-emails.ts
 */
export async function sendEmailNotifications() {
  console.log("Sending email notifications...");

  if (!resend) {
    console.error("❌ RESEND_API_KEY environment variable not set");
    console.log("   Add RESEND_API_KEY to your .env file to enable email notifications");
    console.log("   Get your API key at: https://resend.com/api-keys");
    return 0;
  }

  // Get users with email notifications enabled
  const usersWithEmailEnabled = await db
    .select({
      userId: userProfiles.userId,
      userEmail: users.email,
      userName: users.fullName,
      notificationPreferences: userProfiles.notificationPreferences,
    })
    .from(userProfiles)
    .innerJoin(users, eq(users.id, userProfiles.userId));

  // Filter in JavaScript for users with email enabled
  const emailEnabledUsers = usersWithEmailEnabled.filter(
    (user) => user.notificationPreferences?.email === true
  );

  console.log(`Found ${emailEnabledUsers.length} users with email notifications enabled`);

  let emailsSent = 0;
  const errors: string[] = [];

  for (const user of emailEnabledUsers) {
    try {
      const frequency = (user.notificationPreferences as any)?.emailFrequency || "immediate";

      if (frequency === "immediate") {
        // Send individual emails for unsent notifications
        emailsSent += await sendImmediateEmails(
          user.userId,
          user.userEmail,
          user.userName
        );
      } else if (frequency === "daily") {
        // Send daily digest (only if run once per day)
        emailsSent += await sendDailyDigest(
          user.userId,
          user.userEmail,
          user.userName
        );
      } else if (frequency === "weekly") {
        // Send weekly digest (only if run once per week)
        emailsSent += await sendWeeklyDigest(
          user.userId,
          user.userEmail,
          user.userName
        );
      }
    } catch (error) {
      console.error(`Error sending email to ${user.userEmail}:`, error);
      errors.push(`${user.userEmail}: ${error}`);
    }
  }

  console.log(`✓ Sent ${emailsSent} emails`);
  if (errors.length > 0) {
    console.log(`✗ Failed to send ${errors.length} emails`);
    errors.forEach((err) => console.log(`  - ${err}`));
  }

  return emailsSent;
}

/**
 * Send immediate emails for new notifications
 */
async function sendImmediateEmails(
  userId: number,
  userEmail: string,
  userName: string
): Promise<number> {
  // Get unread notifications that haven't been emailed yet
  // We'll use a heuristic: notifications created in last hour that user hasn't read
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const unsentNotifications = await db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      type: notifications.type,
      title: notifications.title,
      message: notifications.message,
      metadata: notifications.metadata,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
        lte(notifications.createdAt, oneHourAgo)
      )
    )
    .limit(10);

  if (unsentNotifications.length === 0) {
    return 0;
  }

  let sent = 0;

  for (const notification of unsentNotifications) {
    try {
      const { subject, html } = generateNotificationEmail(userName, {
        type: notification.type as any,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata || undefined,
        actionUrl: notification.metadata?.actionUrl,
      });

      await resend.emails.send({
        from: "Kenya Trade Intelligence <notifications@ktip.trade>",
        to: userEmail,
        subject,
        html,
      });

      sent++;
    } catch (error) {
      console.error(`Failed to send email for notification ${notification.id}:`, error);
    }
  }

  return sent;
}

/**
 * Send daily digest of notifications
 */
async function sendDailyDigest(
  userId: number,
  userEmail: string,
  userName: string
): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const dailyNotifications = await db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      type: notifications.type,
      title: notifications.title,
      message: notifications.message,
      metadata: notifications.metadata,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        lte(notifications.createdAt, oneDayAgo)
      )
    )
    .limit(50);

  if (dailyNotifications.length === 0) {
    return 0;
  }

  try {
    const { subject, html } = generateDigestEmail(
      userName,
      dailyNotifications.map((n) => ({
        type: n.type as any,
        title: n.title,
        message: n.message,
        metadata: n.metadata || undefined,
        actionUrl: n.metadata?.actionUrl,
      }))
    );

    await resend.emails.send({
      from: "Kenya Trade Intelligence <notifications@ktip.trade>",
      to: userEmail,
      subject,
      html,
    });

    return 1;
  } catch (error) {
    console.error(`Failed to send daily digest to ${userEmail}:`, error);
    return 0;
  }
}

/**
 * Send weekly digest of notifications
 */
async function sendWeeklyDigest(
  userId: number,
  userEmail: string,
  userName: string
): Promise<number> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const weeklyNotifications = await db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      type: notifications.type,
      title: notifications.title,
      message: notifications.message,
      metadata: notifications.metadata,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        lte(notifications.createdAt, oneWeekAgo)
      )
    )
    .limit(100);

  if (weeklyNotifications.length === 0) {
    return 0;
  }

  try {
    const { subject, html } = generateDigestEmail(
      userName,
      weeklyNotifications.map((n) => ({
        type: n.type as any,
        title: n.title,
        message: n.message,
        metadata: n.metadata || undefined,
        actionUrl: n.metadata?.actionUrl,
      }))
    );

    await resend.emails.send({
      from: "Kenya Trade Intelligence <notifications@ktip.trade>",
      to: userEmail,
      subject,
      html,
    });

    return 1;
  } catch (error) {
    console.error(`Failed to send weekly digest to ${userEmail}:`, error);
    return 0;
  }
}

// Run if called directly
if (require.main === module) {
  sendEmailNotifications()
    .then((count) => {
      console.log(`Completed: ${count} emails sent`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}
