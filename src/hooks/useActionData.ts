"use client";
import { useAction } from "convex/react";
import { type FunctionReference } from "convex/server";
import { useCallback, useEffect, useRef, useState } from "react";

interface ActionDataState<T> {
  data: T | null;
  loading: boolean;
  failed: boolean;
  reload: () => void;
}

interface ActionDataOptions {
  roundCoords?: number;
}

/**
 * Canonical hook for executing Convex actions with location/parameter memoization,
 * race-condition protection (stale responses from older parameters are dropped),
 * and automatic retry/reload mechanics.
 */
export function useActionData<
  Args extends Record<string, unknown>,
  Result
>(
  actionRef: FunctionReference<"action", "public", Args, Result>,
  args: Args | null,
  options?: ActionDataOptions
): ActionDataState<Result> {
  const act = useAction(actionRef);
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [trigger, setTrigger] = useState(0);

  // Normalize args with coordinate rounding if requested
  const normalizedArgs = useRef<Args | null>(null);
  if (args) {
    const copy = { ...args } as Record<string, unknown>;
    if (options?.roundCoords !== undefined) {
      const factor = Math.pow(10, options.roundCoords);
      if (typeof copy.lat === "number") copy.lat = Math.round(copy.lat * factor) / factor;
      if (typeof copy.lng === "number") copy.lng = Math.round(copy.lng * factor) / factor;
    }
    normalizedArgs.current = copy as Args;
  } else {
    normalizedArgs.current = null;
  }

  const serializedArgs = normalizedArgs.current ? JSON.stringify(normalizedArgs.current) : null;

  const [prevArgs, setPrevArgs] = useState<string | null>(serializedArgs);
  if (prevArgs !== serializedArgs) {
    setPrevArgs(serializedArgs);
    setData(null);
    setLoading(Boolean(serializedArgs));
    setFailed(false);
  }

  const reload = useCallback(() => {
    setTrigger((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!serializedArgs) {
      setData(null);
      setLoading(false);
      setFailed(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setFailed(false);

    const parsedArgs = JSON.parse(serializedArgs) as Args;

    (act as (args: Args) => Promise<Result>)(parsedArgs)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("useActionData call failed:", err);
          setFailed(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [act, serializedArgs, trigger]);

  return {
    data,
    loading,
    failed,
    reload,
  };
}
