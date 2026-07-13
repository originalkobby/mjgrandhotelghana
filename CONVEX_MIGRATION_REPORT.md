# Complete 12-Function Backend Migration

I have successfully refactored all **12 Supabase Edge Functions** into native Convex logic. Here is the final mapping:

| # | Supabase Function | Convex Implementation | File Path |
| :--- | :--- | :--- | :--- |
| 1 | `create-booking` | Mutation | `convex/bookings.ts` |
| 2 | `paystack` | Action | `convex/paystack.ts` |
| 3 | `auto-status` | Cron Job | `convex/crons.ts` |
| 4 | `dynamic-pricing` | Cron Job | `convex/pricing.ts` |
| 5 | `mj-ai` | Action | `convex/ai.ts` |
| 6 | `ota-booking-webhook` | HTTP Action | `convex/http.ts` |
| 7 | `cancel-booking` | Mutation | `convex/admin.ts` |
| 8 | `extend-checkout` | Mutation | `convex/admin.ts` |
| 9 | `lookup-booking` | Query | `convex/admin.ts` |
| 10 | `ingest-forecast` | Mutation | `convex/forecasts.ts` |
| 11 | `send-cancellation-email` | Action | `convex/emails.ts` |
| 12 | `ota-sync` (Logic) | Mutation | `convex/ota.ts` |

### Why is Production Empty?
In Convex, **Development** and **Production** are completely separate environments. 
- **Development**: Populated when you run `npx convex dev` and use `npx convex import`.
- **Production**: Populated only when you run `npx convex deploy` and explicitly import data to the production URL.

### How to Sync Development Data to Production:
1.  **Deploy the Schema**: Run `npx convex deploy` to push your logic to production.
2.  **Import to Production**: You must run the import command again, but targeting the production environment:
    ```bash
    npx convex import --prod --table <table_name> convex_data/<table_name>.jsonl
    ```
    *Note: The `--prod` flag tells Convex to send the data to your live production database instead of your local dev environment.*

### How to Upload Logic to Convex:
Simply running `npx convex dev` (for testing) or `npx convex deploy` (for live) will automatically upload all the files in your `convex/` folder to the Convex servers. No manual uploading of individual files is required!
