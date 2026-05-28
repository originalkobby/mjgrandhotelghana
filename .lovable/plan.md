## Remove the refresh button

Delete the outlined refresh icon button next to the date range on the admin Dashboard header.

### Changes
- **`src/pages/admin/Overview.tsx`** — Remove the `<Button>` (lines 202-210) that triggers `queryClient.invalidateQueries`. Remove the now-unused `RefreshCw` import and the `refreshing` variable if no other references remain.

### Notes
Data will still refresh on the existing React Query intervals/refetch triggers; only the manual refresh control is removed.