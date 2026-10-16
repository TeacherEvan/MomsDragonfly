"use client";
import { useMemo, useState } from "react";

import { api } from "@/app/providers";
import { Icon } from "@/components/ui/Icon";
import { useActionData } from "@/hooks/useActionData";
import { buildMapsSearchUrl } from "@/lib/ride/links";
import { getDeviceId } from "@/lib/utils/deviceId";

interface LocalDishesCardProps {
  lat: number;
  lng: number;
  searchQuery?: string;
}

interface Dish {
  name: string;
  description: string;
  imageUrl: string | null;
}

interface Dishes {
  areaName: string | null;
  dishes: Dish[];
  fetchedAt: number;
}

function DishThumb({ dish }: { dish: Dish }) {
  const [broken, setBroken] = useState(false);
  if (!dish.imageUrl || broken) {
    return (
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-dragonfly-navy-800 text-2xl"
        role="img"
        aria-label="Dish illustration"
      >
        🍲
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dish.imageUrl}
      alt={dish.name}
      loading="lazy"
      onError={() => setBroken(true)}
      className="h-14 w-14 shrink-0 rounded-lg border border-dragonfly-navy-700 object-cover"
    />
  );
}

/** "Taste of the area" — popular local dishes (cached ~7 days per city cell). */
export function LocalDishesCard({ lat, lng, searchQuery }: LocalDishesCardProps) {
  const { data, loading, failed, reload } = useActionData<
    { deviceId: string; lat: number; lng: number },
    Dishes
  >(
    api.actions.getLocalDishes,
    { deviceId: getDeviceId(), lat, lng },
    { roundCoords: 1 }
  );

  const filteredDishes = useMemo(() => {
    if (!data?.dishes) return [];
    if (!searchQuery?.trim()) return data.dishes;
    const q = searchQuery.trim().toLowerCase();
    return data.dishes.filter(
      (dish) =>
        dish.name.toLowerCase().includes(q) ||
        dish.description.toLowerCase().includes(q) ||
        (data.areaName && data.areaName.toLowerCase().includes(q))
    );
  }, [data?.dishes, data?.areaName, searchQuery]);

  if (loading && !data) {
    return (
      <div
        className="rounded-xl border border-dragonfly-navy-800 bg-surface-900/70 p-4 space-y-3"
        role="status"
        aria-label="Loading local dishes"
      >
        <div className="h-5 w-44 animate-pulse rounded bg-dragonfly-navy-800" />
        <div className="flex gap-3">
          <div className="h-14 w-14 shrink-0 animate-pulse rounded-lg bg-dragonfly-navy-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-dragonfly-navy-800" />
            <div className="h-3 w-48 animate-pulse rounded bg-dragonfly-navy-800/60" />
          </div>
        </div>
      </div>
    );
  }

  if (failed && (!data || data.dishes.length === 0)) {
    return (
      <section
        className="rounded-xl border border-dragonfly-navy-800 bg-surface-900/70 backdrop-blur-sm p-4 text-center shadow-soft"
        aria-label="Popular local dishes"
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <Icon name="restaurant" size={24} className="text-dragonfly-orange-400" />
          <p className="text-body font-semibold text-dragonfly-navy-200">
            Local dishes unavailable offline
          </p>
          <p className="text-caption text-dragonfly-navy-400 max-w-xs">
            Connect to the internet to discover culinary highlights in this area.
          </p>
          <button
            type="button"
            onClick={reload}
            className="mt-1 px-3 py-1.5 bg-dragonfly-orange-500/20 text-dragonfly-orange-300 hover:bg-dragonfly-orange-500/30 rounded-lg text-caption font-semibold transition-colors min-h-[var(--touch-target)]"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!data || data.dishes.length === 0) return null;

  return (
    <section
      className="rounded-xl border border-dragonfly-navy-800 bg-surface-900/70 backdrop-blur-sm p-4 shadow-soft"
      aria-label="Popular local dishes"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="restaurant" size={18} className="text-dragonfly-orange-400" />
          <h2 className="font-bold text-dragonfly-navy-50 text-body">
            Taste of {data.areaName ?? "the area"}
          </h2>
        </div>
        {searchQuery?.trim() && (
          <span className="text-caption text-dragonfly-orange-400 font-medium">
            {filteredDishes.length} {filteredDishes.length === 1 ? "dish" : "dishes"}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-caption text-dragonfly-navy-500">
        Popular local dishes &amp; what they are
      </p>

      {filteredDishes.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-dragonfly-navy-700 bg-dragonfly-navy-950/40 p-6 text-center">
          <p className="text-body font-medium text-dragonfly-navy-200">No dishes found</p>
          <p className="mt-1 text-caption text-dragonfly-navy-400">
            No local dishes match &ldquo;{searchQuery}&rdquo;. Try another ingredient or dish name.
          </p>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {filteredDishes.map((dish) => (
            <li key={dish.name} className="flex items-start gap-3">
              <DishThumb dish={dish} />
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold text-dragonfly-navy-100">{dish.name}</p>
                <p className="mt-0.5 text-caption text-dragonfly-navy-400">{dish.description}</p>
                <a
                  href={buildMapsSearchUrl(`${dish.name} ${data.areaName ?? ""}`.trim())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-caption font-medium text-dragonfly-teal-300 hover:text-dragonfly-teal-200 transition-colors"
                >
                  <Icon name="compass" size={12} /> Find places serving this
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}