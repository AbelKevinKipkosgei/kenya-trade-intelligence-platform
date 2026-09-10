import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { notifications } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

/**
 * GET /api/notifications
 * Fetch user's notifications with pagination and filtering
 * Query params:
 * - unread: "true" to get only unread notifications
 * - limit: number of notifications to fetch (default: 20)
 * - offset: pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const searchParams = request.nextUrl.searchParams;
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const conditions = [eq(notifications.userId, userId)];
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    const [notificationsList, [{ count }]] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(and(...conditions)),
    ]);

    // Get unread count
    const [{ unreadCount }] = await db
      .select({ unreadCount: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return NextResponse.json({
      notifications: notificationsList,
      total: count,
      unreadCount,
      hasMore: offset + limit < count,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notification(s) as read or unread
 * Body:
 * - id: notification ID (for single update)
 * - ids: array of notification IDs (for bulk update)
 * - markAllAsRead: true to mark all as read
 * - isRead: true/false
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const body = await request.json();

  try {
    if (body.markAllAsRead) {
      // Mark all notifications as read
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (body.ids && Array.isArray(body.ids)) {
      // Bulk update
      await db
        .update(notifications)
        .set({
          isRead: body.isRead ?? true,
          readAt: body.isRead ? new Date() : null,
        })
        .where(
          and(
            eq(notifications.userId, userId),
            sql`${notifications.id} = ANY(${body.ids})`
          )
        );

      return NextResponse.json({
        success: true,
        message: `${body.ids.length} notifications updated`,
      });
    }

    if (body.id) {
      // Single update
      const [notification] = await db
        .update(notifications)
        .set({
          isRead: body.isRead ?? true,
          readAt: body.isRead ? new Date() : null,
        })
        .where(and(eq(notifications.id, body.id), eq(notifications.userId, userId)))
        .returning();

      if (!notification) {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, notification });
    }

    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Delete notification(s)
 * Query params:
 * - id: notification ID (for single delete)
 * Body:
 * - ids: array of notification IDs (for bulk delete)
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  try {
    if (id) {
      // Single delete
      const notificationId = parseInt(id);
      await db
        .delete(notifications)
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));

      return NextResponse.json({ success: true, message: "Notification deleted" });
    }

    // Bulk delete
    const body = await request.json();
    if (body.ids && Array.isArray(body.ids)) {
      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            sql`${notifications.id} = ANY(${body.ids})`
          )
        );

      return NextResponse.json({
        success: true,
        message: `${body.ids.length} notifications deleted`,
      });
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return NextResponse.json(
      { error: "Failed to delete notifications" },
      { status: 500 }
    );
  }
}
