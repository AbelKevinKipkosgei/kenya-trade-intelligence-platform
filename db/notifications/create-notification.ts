import "dotenv/config";
import { db } from "../client";
import { notifications, userProfiles, type NotificationType } from "../schema";
import { eq } from "drizzle-orm";

interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedItemType?: string;
  relatedItemId?: number;
  metadata?: Record<string, any>;
}

/**
 * Create a notification for a user if they have notifications enabled
 * for that category in their preferences
 */
export async function createNotification(params: CreateNotificationParams) {
  const {
    userId,
    type,
    title,
    message,
    relatedItemType,
    relatedItemId,
    metadata,
  } = params;

  // Check user notification preferences
  const [profile] = await db
    .select({ notificationPreferences: userProfiles.notificationPreferences })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  // If no profile or in-app notifications disabled, skip
  if (!profile?.notificationPreferences?.inApp) {
    return null;
  }

  // Check category preferences
  const categories = profile.notificationPreferences.categories || {};
  const categoryEnabled = getCategoryForType(type, categories);

  if (!categoryEnabled) {
    return null;
  }

  // Create notification
  const [notification] = await db
    .insert(notifications)
    .values({
      userId,
      type,
      title,
      message,
      relatedItemType,
      relatedItemId,
      metadata,
      isRead: false,
    })
    .returning();

  return notification;
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
  userIds: number[],
  notificationData: Omit<CreateNotificationParams, "userId">
) {
  const results = await Promise.allSettled(
    userIds.map((userId) => createNotification({ userId, ...notificationData }))
  );

  const successful = results.filter((r) => r.status === "fulfilled").length;
  console.log(`Created ${successful}/${userIds.length} notifications`);

  return successful;
}

/**
 * Map notification type to user preference category
 */
function getCategoryForType(
  type: NotificationType,
  categories: Record<string, boolean | undefined>
): boolean {
  switch (type) {
    case "tariff_change":
      return categories.tariffChanges !== false; // Default true
    case "new_barrier":
    case "barrier_resolved":
      return categories.barriers !== false;
    case "opportunity_score_change":
    case "new_opportunity":
      return categories.opportunities !== false;
    case "price_alert":
      return categories.newProducts !== false;
    case "watchlist_digest":
      return true; // Always enabled for digests
    default:
      return true;
  }
}
