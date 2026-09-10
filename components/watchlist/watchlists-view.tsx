"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Watchlist {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
}

interface WatchlistsViewProps {
  initialWatchlists: Watchlist[];
}

export function WatchlistsView({ initialWatchlists }: WatchlistsViewProps) {
  const router = useRouter();
  const [watchlists, setWatchlists] = useState(initialWatchlists);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isDefault: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = () => {
    setFormData({ name: "", description: "", isDefault: false });
    setError("");
    setShowCreateModal(true);
  };

  const handleEdit = (watchlist: Watchlist) => {
    setSelectedWatchlist(watchlist);
    setFormData({
      name: watchlist.name,
      description: watchlist.description || "",
      isDefault: watchlist.isDefault,
    });
    setError("");
    setShowEditModal(true);
  };

  const handleDelete = (watchlist: Watchlist) => {
    setSelectedWatchlist(watchlist);
    setShowDeleteModal(true);
  };

  const submitCreate = async () => {
    if (!formData.name.trim()) {
      setError("Watchlist name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create watchlist");
        setLoading(false);
        return;
      }

      // Refresh the page to show new watchlist
      router.refresh();
      setShowCreateModal(false);
      setLoading(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const submitEdit = async () => {
    if (!selectedWatchlist || !formData.name.trim()) {
      setError("Watchlist name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/watchlists?id=${selectedWatchlist.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update watchlist");
        setLoading(false);
        return;
      }

      // Refresh the page
      router.refresh();
      setShowEditModal(false);
      setLoading(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const submitDelete = async () => {
    if (!selectedWatchlist) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/watchlists?id=${selectedWatchlist.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        setLoading(false);
        return;
      }

      // Refresh the page
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

  return (
    <div className="space-y-6">
      {/* Create Button */}
      <div className="flex justify-end">
        <button
          onClick={handleCreate}
          className="flex h-10 items-center gap-2 border border-kenya-green bg-kenya-green px-4 text-sm font-semibold text-white transition-colors hover:bg-[#004d00]"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Watchlist
        </button>
      </div>

      {/* Watchlists Grid */}
      {watchlists.length === 0 ? (
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
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">
            No watchlists yet
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Create your first watchlist to start tracking products and markets
          </p>
          <button
            onClick={handleCreate}
            className="mt-6 inline-flex h-10 items-center border border-kenya-green bg-kenya-green px-6 text-sm font-semibold text-white transition-colors hover:bg-[#004d00]"
          >
            Create Your First Watchlist
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {watchlists.map((watchlist) => (
            <div
              key={watchlist.id}
              className="border-t-4 border-zinc-300 bg-white p-6 transition-colors hover:border-kenya-green dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-lg font-semibold text-zinc-950 dark:text-white">
                      {watchlist.name}
                    </h3>
                    {watchlist.isDefault && (
                      <span className="shrink-0 rounded bg-kenya-green/10 px-2 py-0.5 text-xs font-medium text-kenya-green">
                        Default
                      </span>
                    )}
                  </div>
                  {watchlist.description && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {watchlist.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                <span>{watchlist.itemCount} items</span>
                <span>Updated {formatDate(watchlist.updatedAt)}</span>
              </div>

              <div className="mt-4 flex gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <Link
                  href={`/watchlists/${watchlist.id}`}
                  className="flex-1 text-center h-9 flex items-center justify-center border border-kenya-green text-sm font-medium text-kenya-green transition-colors hover:bg-kenya-green hover:text-white"
                >
                  View Items
                </Link>
                <button
                  onClick={() => handleEdit(watchlist)}
                  className="h-9 w-9 flex items-center justify-center border border-zinc-400 text-zinc-700 transition-colors hover:border-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  title="Edit watchlist"
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
                  onClick={() => handleDelete(watchlist)}
                  className="h-9 w-9 flex items-center justify-center border border-red-300 text-red-600 transition-colors hover:border-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                  title="Delete watchlist"
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
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
            }}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border-t-4 border-kenya-black bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
              {showCreateModal ? "Create Watchlist" : "Edit Watchlist"}
            </h2>

            {error && (
              <div className="mt-4 border-l-4 border-kenya-red bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Name <span className="text-kenya-red">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., High Priority Markets"
                  className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Add notes about this watchlist..."
                  className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData({ ...formData, isDefault: e.target.checked })
                    }
                    className="h-4 w-4 border-zinc-300 text-kenya-green focus:ring-kenya-green"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Set as default watchlist
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={showCreateModal ? submitCreate : submitEdit}
                disabled={loading}
                className="flex h-10 flex-1 items-center justify-center border border-kenya-green bg-kenya-green text-sm font-semibold text-white transition-colors hover:bg-[#004d00] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Saving..."
                  : showCreateModal
                  ? "Create"
                  : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
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
      {showDeleteModal && selectedWatchlist && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border-t-4 border-kenya-red bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
              Delete Watchlist
            </h2>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to delete "{selectedWatchlist.name}"? This
              will remove all {selectedWatchlist.itemCount} tracked items. This
              action cannot be undone.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={submitDelete}
                disabled={loading}
                className="flex h-10 flex-1 items-center justify-center border border-red-600 bg-red-600 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete Watchlist"}
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
