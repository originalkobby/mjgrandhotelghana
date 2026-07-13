/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as ai from "../ai.js";
import type * as bookings from "../bookings.js";
import type * as crons from "../crons.js";
import type * as emails from "../emails.js";
import type * as forecasts from "../forecasts.js";
import type * as http from "../http.js";
import type * as migration_utils from "../migration_utils.js";
import type * as ota from "../ota.js";
import type * as payments from "../payments.js";
import type * as paystack from "../paystack.js";
import type * as pricing from "../pricing.js";
import type * as rooms from "../rooms.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  ai: typeof ai;
  bookings: typeof bookings;
  crons: typeof crons;
  emails: typeof emails;
  forecasts: typeof forecasts;
  http: typeof http;
  migration_utils: typeof migration_utils;
  ota: typeof ota;
  payments: typeof payments;
  paystack: typeof paystack;
  pricing: typeof pricing;
  rooms: typeof rooms;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
