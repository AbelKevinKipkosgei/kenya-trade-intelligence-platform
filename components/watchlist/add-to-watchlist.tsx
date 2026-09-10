"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Watchlist {
  id: number;
  name: string;
  itemCount: number;
}

interface AddToWatchlistProps {
  itemType: "product" | "country" | "opportunity" | "barrier" | "exporter";
  itemId: number;
  itemName: string;
  itemMeta?: Record<string, any>;
  variant?: "button" | "icon";
  size?: "sm" | "md";
}

export function AddToWatchlist({
  itemType,
  itemId,
  itemName,
  itemMeta,
  variant = "icon",
  size = "md",
}: AddToWatchlistProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [inWatchlists, setInWatchlists] = useState<number[]>([]);
  const [error, setError] = useState("");

  // Fetch user's watchlists and check if item is already tracked
  useEffect(() => {
    if (status === "authenticated" && showDropdown) {
      fetchWatchlists();
      checkWatchlistStatus();
    }
  }, [status, showDropdown]);

  const fetchWatchlists = async () => {
    try {
      const response = await fetch("/api/watchlists");
      const data = await response.json();
      setWatchlists(data.watchlists || []);
    } catch (err) {
      console.error("Failed to fetch watchlists:", err);
    }
  };

  const checkWatchlistStatus = async () => {
    try {
      const response = await fetch(
        `/api/watchlists/check?itemType=${itemType}&itemId=${itemId}`
      );
      const data = await response.json();
      setInWatchlists(data.watchlists.map((w: any) => w.watchlistId));
    } catch (err) {
      console.error("Failed to check watchlist status:", err);
    }
  };

  const handleAddToWatchlist = async (watchlistId: number) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/watchlists/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          watchlistId,
          itemType,
          itemId,
          itemName,
          itemMeta: itemMeta || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError("Already in this watchlist");
        } else {
          setError(data.error || "Failed to add to watchlist");
        }
        setLoading(false);
        return;
      }

      // Success - update local state
      setInWatchlists([...inWatchlists, watchlistId]);
      setShowDropdown(false);
      setLoading(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (watchlistId: number) => {
    setLoading(true);
    setError("");

    try {
      // Find the item ID for this watchlist
      const checkResponse = await fetch(
        `/api/watchlists/check?itemType=${itemType}&itemId=${itemId}`
      );
      const checkData = await checkResponse.json();
      const watchlistItem = checkData.watchlists.find(
        (w: any) => w.watchlistId === watchlistId
      );

      if (!watchlistItem) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/watchlists/items?id=${watchlistItem.itemId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        setError("Failed to remove from watchlist");
        setLoading(false);
        return;
      }

      // Success - update local state
      setInWatchlists(inWatchlists.filter((id) => id !== watchlistId));
      setLoading(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    setShowDropdown(!showDropdown);
  };

  if (status === "loading") {
    return null;
  }

  const buttonSize = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  if (variant === "icon") {
    return (
      <div className="relative">
        <button
          onClick={handleClick}
          disabled={loading}
          className={`${buttonSize} flex items-center justify-center border border-zinc-300 text-zinc-700 transition-colors hover:border-kenya-green hover:text-kenya-green disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:text-kenya-green`}
          title="Add to watchlist"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={iconSize}
            fill={inWatchlists.length > 0 ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-2 w-64 border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <div className="border-b border-zinc-200 p-3 dark:border-zinc-800">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Add to Watchlist
                </p>
              </div>

              {error && (
                <div className="border-b border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:bg-red-950/30 dark:text-red-200">
                  {error}
                </div>
              )}

              <div className="max-h-64 overflow-y-auto">
                {watchlists.length === 0 ? (
                  <div className="p-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
                    <p>No watchlists yet.</p>
                    <button
                      onClick={() => router.push("/watchlists")}
                      className="mt-2 text-kenya-green hover:underline"
                    >
                      Create your first watchlist
                    </button>
                  </div>
                ) : (
                  <div className="py-1">
                    {watchlists.map((watchlist) => {
                      const isInWatchlist = inWatchlists.includes(watchlist.id);
                      return (
                        <button
                          key={watchlist.id}
                          onClick={() =>
                            isInWatchlist
                              ? handleRemoveFromWatchlist(watchlist.id)
                              : handleAddToWatchlist(watchlist.id)
                          }
                          disabled={loading}
                          className="flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:hover:bg-zinc-800"
                        >
                          <span className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill={isInWatchlist ? "currentColor" : "none"}
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span className="text-zinc-900 dark:text-zinc-100">
                              {watchlist.name}
                            </span>
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {watchlist.itemCount} items
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
                <button
                  onClick={() => router.push("/watchlists")}
                  className="w-full px-3 py-2 text-center text-xs font-medium text-kenya-green hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Manage Watchlists
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Button variant
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex h-9 items-center gap-2 border border-zinc-400 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-kenya-green hover:text-kenya-green disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill={inWatchlists.length > 0 ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      {inWatchlists.length > 0 ? "In Watchlist" : "Add to Watchlist"}
    </button>
  );
}
