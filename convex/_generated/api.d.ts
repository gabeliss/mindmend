/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as chat from "../chat.js";
import type * as chatContext from "../chatContext.js";
import type * as correlations from "../correlations.js";
import type * as dailyPlans from "../dailyPlans.js";
import type * as habitEvents from "../habitEvents.js";
import type * as habits from "../habits.js";
import type * as journalEntries from "../journalEntries.js";
import type * as reflections from "../reflections.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  chat: typeof chat;
  chatContext: typeof chatContext;
  correlations: typeof correlations;
  dailyPlans: typeof dailyPlans;
  habitEvents: typeof habitEvents;
  habits: typeof habits;
  journalEntries: typeof journalEntries;
  reflections: typeof reflections;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
