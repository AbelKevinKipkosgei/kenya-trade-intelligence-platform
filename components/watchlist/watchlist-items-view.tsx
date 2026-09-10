"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface WatchlistItem {
  id: number;
  watchlistId: number;
  itemType: "product" | "country" | "opportunity" | "barrier" | "exporter";
  itemId: string;
  itemName: string;
  itemMeta: Record<string, any> | null;
  notes: string | null;
  alertsEnabled: boolean;
  addedAt: Date;
}

interface WatchlistItemsViewProps {
  watchlistId: number;
  watchlistName: string;
  initialItems: WatchlistItem[];
}

export function WatchlistItemsView({
  watchlistId,
  watchlistName,
  initialItems,
}: WatchlistItemsViewProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
  const [notes, setNotes] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Group items by type
  const groupedItems = useMemo(() => {
    const groups: Record<string, WatchlistItem[]> = {
      product: [],
      country: [],
      opportunity: [],
      barrier: [],
      exporter: [],
    };

    items.forEach((item) => {
      groups[item.itemType].push(item);
    });

    return groups;
  }, [items]);

  const handleEdit = (item: WatchlistItem) => {
    setSelectedItem(item);
    setNotes(item.notes || "");
    setAlertsEnabled(item.alertsEnabled);
    setShowEditModal(true);
  };

  const handleDelete = (item: WatchlistItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const submitEdit = async () => {
    if (!selectedItem) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/watchlists/items?id=${selectedItem.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes, alertsEnabled }),
        }
      );

      if (!response.ok) {
        setLoading(false);
        return;
      }

      router.refresh();
      setShowEditModal(false);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const submitDelete = async () => {
    if (!selectedItem) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/watchlists/items?id=${selectedItem.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        setLoading(false);
        return;
      }

      router.refresh();
      setShowDeleteModal(false);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getItemLink = (item: WatchlistItem) => {
    switch (item.itemType) {
      case "product":
        return `/explorer?hs=${item.itemId}`;
      case "country":
        return `/explorer?market=${item.itemId}`;
      case "opportunity":
        return `/opportunities`;
      case "barrier":
        return `/barriers`;
      case "exporter":
        return `/exporters`;
      default:
        return "#";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "product":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        );
      case "country":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "opportunity":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        );
      case "barrier":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "exporter":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1) + "s";
  };

  const typeOrder = ["product", "country", "opportunity", "barrier", "exporter"];
  const hasItems = items.length > 0;

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div>
        <Link
          href="/watchlists"
          className="inline-flex items-center gap-2 text-sm font-medium text-kenya-green hover:text-[#004d00]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Watchlists
        </Link>
      </div>

      {/* Empty State */}
      {!hasItems && (
        <div className="border-t-4 border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">
            No items yet
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Use the bookmark button on products, markets, and other items to add
            them to this watchlist
          </p>
        </div>
      )}

      {/* Grouped Items */}
      {typeOrder.map((type) => {
        const typeItems = groupedItems[type];
        if (typeItems.length === 0) return null;

        return (
          <div key={type}>
            <div className="mb-4 flex items-center gap-3">
              <div className="text-kenya-green">{getTypeIcon(type)}</div>
              <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
                {getTypeLabel(type)}
              </h2>
              <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {typeItems.length}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {typeItems.map((item) => (
                <div
                  key={item.id}
                  className="border-t-4 border-zinc-300 bg-white p-5 transition-colors hover:border-kenya-green dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={getItemLink(item)}
                        className="block group"
                      >
                        <h3 className="font-semibold text-zinc-950 group-hover:text-kenya-green dark:text-white dark:group-hover:text-kenya-green line-clamp-2">
                          {item.itemName}
                        </h3>
                      </Link>
                      {item.itemMeta && Object.keys(item.itemMeta).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                          {item.itemMeta.code && (
                            <span className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
                              {item.itemMeta.code}
                            </span>
                          )}
                          {item.itemMeta.sector && (
                            <span className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
                              {item.itemMeta.sector}
                            </span>
                          )}
                        </div>
                      )}
                      {item.notes && (
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    {item.alertsEnabled && (
                      <div
                        className="shrink-0 text-kenya-gold"
                        title="Alerts enabled"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Added {formatDate(item.addedAt)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-zinc-600 hover:text-kenya-green dark:text-zinc-400 dark:hover:text-kenya-green"
                        title="Edit notes"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
                        title="Remove from watchlist"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowEditModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border-t-4 border-kenya-black bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
              Edit Item
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
              {selectedItem.itemName}
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add personal notes about this item..."
                  className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={alertsEnabled}
                    onChange={(e) => setAlertsEnabled(e.target.checked)}
                    className="h-4 w-4 border-zinc-300 text-kenya-green focus:ring-kenya-green"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Enable alerts for this item
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={submitEdit}
                disabled={loading}
                className="flex h-10 flex-1 items-center justify-center border border-kenya-green bg-kenya-green text-sm font-semibold text-white transition-colors hover:bg-[#004d00] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                disabled={loading}
                className="h-10 border border-zinc-400 px-6 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedItem && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border-t-4 border-kenya-red bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
              Remove Item
            </h2>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Remove "{selectedItem.itemName}" from "{watchlistName}"?
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={submitDelete}
                disabled={loading}
                className="flex h-10 flex-1 items-center justify-center border border-red-600 bg-red-600 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Removing..." : "Remove"}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                className="h-10 border border-zinc-400 px-6 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
