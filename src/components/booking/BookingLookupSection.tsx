import { useState } from "react";
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatDateGB } from "@/lib/dateUtils";

const BookingLookupSection = () => {
  const convex = useConvex();
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const booking = await convex.query(api.bookings.getBookingByReference, {
        reference: reference.trim().toUpperCase(),
      });
      if (!booking) setError("No reservation found with that reference.");
      else setResult(booking);
    } catch {
      setError("We couldn't look that up right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto mt-16 max-w-2xl rounded-2xl border border-border bg-card p-6">
      <h2 className="font-serif text-xl text-foreground">View my reservation</h2>
      <p className="mt-1 text-sm text-muted-foreground">Enter your booking reference to see your stay details.</p>

      <form onSubmit={lookup} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value.toUpperCase())}
          placeholder="e.g. MJG-2026-0142"
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Searching…" : "Find booking"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {result && (
        <dl className="mt-5 space-y-2 rounded-xl border border-border p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Room</dt>
            <dd className="text-foreground">{result.room?.name ?? "--"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Check-in</dt>
            <dd className="text-foreground">{formatDateGB(result.check_in)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Check-out</dt>
            <dd className="text-foreground">{formatDateGB(result.check_out)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="capitalize text-foreground">{result.status ?? "--"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Payment</dt>
            <dd className="capitalize text-foreground">{result.payment_status ?? "--"}</dd>
          </div>
        </dl>
      )}
    </section>
  );
};

export default BookingLookupSection;
