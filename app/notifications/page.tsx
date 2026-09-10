"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  relatedItemType: string | null;
  relatedItemId: number | null;
  metadata: {
    hsCode?: string;
    countryName?: string;
    actionUrl?: string;
    [key: string]: unknown;
  } | null;
  isRead: boolean;
  createdAt: Date;
}

const NOTIFICATION_TYPES = [
  { value: "", label: "All Types" },
  { value: "tariff_change", label: "Tariff Changes" },
  { value: "new_barrier", label: "New Barriers" },
  { value: "barrier_resolved", label: "Resolved Barriers" },
  { value: "opportunity_score_change", label: "Opportunity Updates" },
  { value: "new_opportunity", label: "New Opportunities" },
  { value: "price_alert", label: "Price Alerts" },
];

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [filterType, setFilterType] = useState("");
  const [filterUnread, setFilterUnread] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const LIMIT = 20;

  // Also called directly from the "Load more" button below — kept as a
  // regular function (not effect-local) since it's reused outside effects.
  const fetchNotifications = async (reset = false) => {
    setLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        limit: LIMIT.toString(),
        offset: currentOffset.toString(),
      });

      if (filterUnread) params.append("unread", "true");
      if (filterType) params.append("type", filterType);

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();

      if (reset) {
        setNotifications(data.notifications || []);
        setOffset(LIMIT);
      } else {
        setNotifications((prev) => [...prev, ...(data.notifications || [])]);
        setOffset((prev) => prev + LIMIT);
      }

      setUnreadCount(data.unreadCount || 0);
      setTotalCount(data.total || 0);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/notifications");
    } else if (status === "authenticated") {
      // fetchNotifications is intentionally excluded from the deps array —
      // it's redefined every render, and depending on it (or router, stable
      // as it is) would re-fetch on every render instead of only when the
      // filters actually change. The set-state-in-effect lint rule flags
      // this as a general anti-pattern, but re-fetching on a
      // status/filter change is exactly React's own documented use case
      // for an effect — fetchNotifications can't be moved inline since the
      // "Load more" button below also calls it directly.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNotifications(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, filterType, filterUnread]);

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notificationId, isRead: true }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const markSelectedAsRead = async () => {
    if (selectedIds.size === 0) return;

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), isRead: true }),
      });

      setNotifications((prev) =>
        prev.map((n) => (selectedIds.has(n.id) ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - selectedIds.size));
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error marking selected as read:", error);
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} notification(s)?`)) return;

    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
      setTotalCount((prev) => prev - selectedIds.size);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error deleting notifications:", error);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(notifications.map((n) => n.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNotificationIcon = (type: string) => {
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
      default:
        return "🔔";
    }
  };

  if (status === "loading" || (status === "authenticated" && loading && offset === 0)) {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-1 flex-col px-6 py-10 sm:px-10">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-2 h-4 w-96 bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-1 flex-col px-6 py-10 sm:px-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Notification Center
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Stay informed about changes to your watchlist items and new trade opportunities.
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-9 border border-zinc-300 bg-white px-3 text-sm text-zinc-700 transition-colors hover:border-zinc-400 focus:border-kenya-green focus:outline-none focus:ring-2 focus:ring-kenya-green/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {NOTIFICATION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {/* Unread Filter */}
          <button
            onClick={() => setFilterUnread(!filterUnread)}
            className={`h-9 border px-4 text-sm font-medium transition-colors ${
              filterUnread
                ? "border-kenya-green bg-kenya-green text-white hover:bg-[#004d00]"
                : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            }`}
          >
            {filterUnread ? "Unread Only" : "All"}
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="h-9 border border-zinc-300 bg-white px-4 text-sm font-medium text-kenya-green transition-colors hover:border-kenya-green dark:border-zinc-700 dark:bg-zinc-900"
            >
              Mark All Read
            </button>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <button
              onClick={markSelectedAsRead}
              className="h-9 border border-zinc-300 bg-white px-4 text-sm font-medium text-kenya-green transition-colors hover:border-kenya-green dark:border-zinc-700 dark:bg-zinc-900"
            >
              Mark Read ({selectedIds.size})
            </button>
            <button
              onClick={deleteSelected}
              className="h-9 border border-kenya-red bg-white px-4 text-sm font-medium text-kenya-red transition-colors hover:bg-kenya-red hover:text-white dark:border-zinc-700 dark:bg-zinc-900"
            >
              Delete ({selectedIds.size})
            </button>
            <button
              onClick={deselectAll}
              className="h-9 border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Selection Actions */}
      {notifications.length > 0 && selectedIds.size === 0 && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {unreadCount > 0 && `${unreadCount} unread • `}
            Showing {notifications.length} of {totalCount} notifications
          </p>
          <button
            onClick={selectAll}
            className="text-xs font-medium text-kenya-green hover:text-[#004d00]"
          >
            Select All
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="flex flex-col gap-2">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-stone-300 bg-white/70 p-12 text-center dark:border-zinc-700 dark:bg-zinc-800/70">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-16 w-16 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="mt-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              No notifications found
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {filterUnread
                ? "You're all caught up! No unread notifications."
                : "Notifications about your watchlist items will appear here."}
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border transition-colors ${
                selectedIds.has(notification.id)
                  ? "border-kenya-green bg-kenya-green/5"
                  : !notification.isRead
                  ? "border-zinc-300 bg-kenya-green/5 dark:border-zinc-700 dark:bg-zinc-800"
                  : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              } hover:border-zinc-400 dark:hover:border-zinc-600`}
            >
              <div className="flex items-start gap-3 p-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedIds.has(notification.id)}
                  onChange={() => toggleSelection(notification.id)}
                  className="mt-1 h-4 w-4 cursor-pointer border-zinc-300 text-kenya-green focus:ring-kenya-green dark:border-zinc-600"
                />

                {/* Icon */}
                <span className="text-2xl">{getNotificationIcon(notification.type)}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-kenya-green" />
                    )}
                  </div>

                  {/* Metadata */}
                  {notification.metadata && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {notification.metadata.hsCode && (
                        <span className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
                          HS {notification.metadata.hsCode}
                        </span>
                      )}
                      {notification.metadata.countryName && (
                        <span className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
                          {notification.metadata.countryName}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {formatDate(notification.createdAt)}
                    </span>
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="font-medium text-kenya-green hover:text-[#004d00]"
                      >
                        Mark as read
                      </button>
                    )}
                    {notification.metadata?.actionUrl && (
                      <Link
                        href={notification.metadata.actionUrl}
                        onClick={() => markAsRead(notification.id)}
                        className="font-medium text-kenya-green hover:text-[#004d00]"
                      >
                        View details →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={() => fetchNotifications(false)}
          disabled={loading}
          className="mt-4 h-10 border border-zinc-300 bg-white px-6 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
