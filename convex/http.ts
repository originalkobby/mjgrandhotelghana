import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/ota-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const secret = request.headers.get("x-ota-secret");

    if (secret !== process.env.OTA_WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      // Process booking sync logic
      await ctx.runMutation(api.ota.syncBooking, { payload: body });
      
      // Log to webhook_logs
      await ctx.runMutation(api.ota.logWebhook, { 
        source: body.source || "unknown",
        payload: body,
        status: "success"
      });

      return new Response("OK", { status: 200 });
    } catch (err: any) {
      await ctx.runMutation(api.ota.logWebhook, { 
        source: body.source || "unknown",
        payload: body,
        status: "error",
        error: err.message
      });
      return new Response(err.message, { status: 500 });
    }
  }),
});

export default http;
