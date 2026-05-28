## Remove refresh button on Bookings page

**File:** `src/pages/admin/Bookings.tsx`

- Delete the `<Button>` (lines 591–599) that triggers `queryClient.invalidateQueries` with the `RefreshCw` icon.
- Remove `RefreshCw` from the `lucide-react` import if no other usages remain.
- Remove the `refreshing` variable and `isFetching` from the `useQuery` destructuring if they're no longer referenced.
- Remove the `queryClient` / `useQueryClient` import if it becomes unused.

Data will continue to refresh via existing React Query polling/refetch triggers.