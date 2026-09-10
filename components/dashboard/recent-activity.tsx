"use client";

interface Activity {
  id: number;
  itemType: string;
  itemName: string;
  itemMeta: Record<string, any> | null;
  watchlistName: string;
  addedAt: Date;
}

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (activities.length === 0) {
    return (
      <section className="border-t-4 border-zinc-300 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
          Recent Activity
        </h2>
        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No recent activity. Start tracking items to see them here.
        </p>
      </section>
    );
  }

  return (
    <section className="border-t-4 border-zinc-300 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
        Recent Activity
      </h2>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="border-l-4 border-kenya-green/30 bg-white p-3 transition-colors hover:border-kenya-green dark:bg-zinc-800/50"
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
              {activity.itemName}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold uppercase tracking-wide text-kenya-green">
                {getTypeLabel(activity.itemType)}
              </span>
              <span>→</span>
              <span>{activity.watchlistName}</span>
              <span>·</span>
              <span>{formatRelativeTime(activity.addedAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
