import { ConvexReactClient } from "convex/react";
import { api as generatedApi } from "../../../convex/_generated/api";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud";

export const convexClient = new ConvexReactClient(convexUrl);
export const api = generatedApi;
