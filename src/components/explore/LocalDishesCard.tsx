"use client";
import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/app/providers";
import { getDeviceId } from "@/lib/utils/deviceId";
import { Icon } from "@/components/ui/Icon";

interface LocalDishesCardProps {
  lat: number;
  lng: number;
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
export function LocalDishesCard({ lat, lng }: LocalDishesCardProps) {
  const fetchDishes = useAction(api.actions.getLocalDishes);
  const [data, setData] = useState<Dishes | null>(null);

  const rLat = Math.round(lat * 10) / 10;
  const rLng = Math.round(lng * 10) / 10;

  useEffect(() => {
    let cancelled = false;
    fetchDishes({ deviceId: getDeviceId(), lat: rLat, lng: rLng })
      .then((res) => {
        if (!cancelled) setData(res as Dishes);
      })
      .catch((err) => {
        console.warn("Local dishes fetch failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchDishes, rLat, rLng]);

  // Hide quietly when there's nothing to show (unknown area, offline, etc.)
  if (!data || data.dishes.length === 0) return null;

  return (
    <section
      className="rounded-xl border border-dragonfly-navy-800 bg-surface-900/70 backdrop-blur-sm p-4 shadow-soft"
      aria-label="Popular local dishes"
    >
      <div className="flex items-center gap-2">
        <Icon name="restaurant" size={18} className="text-dragonfly-orange-400" />
        <h2 className="font-bold text-dragonfly-navy-50 text-body">
          Taste of {data.areaName ?? "the area"}
        </h2>
      </div>
      <p className="mt-0.5 text-caption text-dragonfly-navy-500">
        Popular local dishes &amp; what they are
      </p>
      <ul className="mt-3 space-y-3">
        {data.dishes.map((dish) => (
          <li key={dish.name} className="flex items-start gap-3">
            <DishThumb dish={dish} />
            <div className="min-w-0">
              <p className="text-body font-semibold text-dragonfly-navy-100">{dish.name}</p>
              <p className="mt-0.5 text-caption text-dragonfly-navy-400">{dish.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}