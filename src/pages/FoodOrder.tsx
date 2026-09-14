import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Minus,
  Plus,
  UtensilsCrossed,
  ArrowLeft,
  
  Bike,
  Wallet,
} from "lucide-react";
import DeliveryLocationPicker, { PickedLocation } from "@/components/delivery/DeliveryLocationPicker";
import CustomerDetailsDialog from "@/components/food/CustomerDetailsDialog";
import { getCachedCustomer, getDeviceId, type CustomerDetails } from "@/lib/customerDevice";

function parsePrice(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

type Quote = {
  delivery_enabled: boolean;
  distance_km?: number;
  fee_ghs?: number;
  eta_min_minutes?: number;
  eta_max_minutes?: number;
  requires_review?: boolean;
  out_of_range?: boolean;
  max_delivery_km?: number;
  message?: string;
};

export default function FoodOrder() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialItem = searchParams.get("item") || "";
  const initialPrice = searchParams.get("price") || "";
  const initialCategory = searchParams.get("category") || "";

  const [itemName, setItemName] = useState(initialItem);
  const [itemPrice, setItemPrice] = useState(initialPrice);
  const [quantity, setQuantity] = useState(1);

  const [guestName, setGuestName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [orderType, setOrderType] = useState<"dine_in" | "room_service" | "takeaway" | "delivery">("dine_in");
  const [notes, setNotes] = useState("");

  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [landmark, setLandmark] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash_on_delivery" | "paystack">("cash_on_delivery");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payNotice, setPayNotice] = useState<string | null>(null);

  // Returning from Paystack: confirm the payment server-side.
  useEffect(() => {
    const payRef = searchParams.get("pay");
    const trxRef = searchParams.get("reference") || searchParams.get("trxref");
    if (!payRef || !trxRef) return;
    (async () => {
      const { data } = await supabase.functions.invoke("food-payment", {
        body: { action: "verify", reference: trxRef },
      });
      const ok = (data as any)?.paid;
      setReference(payRef);
      setSubmitted(true);
      setPayNotice(
        ok
          ? "Payment received — thank you. The kitchen has your order."
          : "We could not confirm your payment yet. If you were charged, our team will confirm it shortly.",
      );
      setSearchParams({}, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setItemName(initialItem);
    setItemPrice(initialPrice);
  }, [initialItem, initialPrice]);

  // First-time device: capture details once, otherwise prefill from this device.
  const [detailsOpen, setDetailsOpen] = useState(false);
  useEffect(() => {
    const cached = getCachedCustomer();
    if (cached) {
      setGuestName((v) => v || cached.full_name);
      setEmail((v) => v || cached.email);
      setPhone((v) => v || cached.phone);
    } else {
      setDetailsOpen(true);
    }
  }, []);

  function applyCustomer(details: CustomerDetails) {
    setGuestName(details.full_name);
    setEmail(details.email);
    setPhone(details.phone);
    setDetailsOpen(false);
  }

  const isDelivery = orderType === "delivery";
  const unitPrice = useMemo(() => parsePrice(itemPrice), [itemPrice]);
  const subtotal = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);
  const deliveryFee = isDelivery && quote?.fee_ghs && !quote.out_of_range ? quote.fee_ghs : 0;
  const total = subtotal + deliveryFee;

  // Fetch a fresh, server-calculated delivery quote whenever the pin moves.
  useEffect(() => {
    if (!isDelivery || !location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    setQuoting(true);
    const t = setTimeout(async () => {
      const { data, error: qErr } = await supabase.functions.invoke("delivery-quote", {
        body: { lat: location.lat, lng: location.lng },
      });
      if (cancelled) return;
      setQuoting(false);
      if (qErr) {
        setQuote(null);
        return;
      }
      setQuote(data as Quote);
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
      setQuoting(false);
    };
  }, [isDelivery, location?.lat, location?.lng]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const canSubmit =
    !!guestName.trim() &&
    emailValid &&
    quantity > 0 &&
    unitPrice > 0 &&
    !!itemName.trim() &&
    (!isDelivery ||
      (!!location?.address?.trim() &&
        !!phone.trim() &&
        !quoting &&
        !quote?.out_of_range));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("place-food-order", {
        body: {
          guest_name: guestName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          room_number: roomNumber.trim(),
          order_type: orderType,
          notes: notes.trim(),
          payment_method: isDelivery ? paymentMethod : "cash_on_delivery",
          items: [{ name: itemName.trim(), price_ghs: unitPrice, quantity }],
          dest_lat: location?.lat,
          dest_lng: location?.lng,
          delivery_address: location?.address ?? "",
          delivery_landmark: landmark.trim(),
          device_id: getDeviceId(),
        },
      });

      if (fnError) {
        const message =
          (fnError as any)?.context?.body
            ? String((fnError as any).context.body)
            : fnError.message;
        throw new Error(message);
      }
      if ((data as any)?.error) throw new Error((data as any).error);

      const orderId = (data as any).order_id;

      // Online payment: hand the customer over to Paystack before confirming.
      if (isDelivery && paymentMethod === "paystack") {
        const { data: pay, error: payError } = await supabase.functions.invoke("food-payment", {
          body: { action: "initialize", order_id: orderId, origin: window.location.origin },
        });
        if (!payError && (pay as any)?.authorization_url) {
          window.location.href = (pay as any).authorization_url;
          return;
        }
        setPayNotice(
          "Your order is placed, but online payment could not be started. Please pay our rider on delivery.",
        );
      }

      setReference((data as any).reference_code);
      setTrackingToken((data as any).tracking_token ?? null);
      setSubmitted(true);
      setSearchParams({}, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const typeLabel: Record<string, string> = {
    dine_in: "Dine-in",
    room_service: "Room Service",
    takeaway: "Takeaway",
    delivery: "Delivery",
  };

  return (
    <div className="min-h-screen bg-charcoal">
      <SEO
        title="Order Food — MJ Grand Hotel Restaurant"
        description="Order from the MJ Grand Hotel restaurant menu for dine-in, room service, takeaway or doorstep delivery in Accra."
        path="/food-order"
      />
      <Navbar />

      <div className="w-full px-0 pt-28 md:pt-36 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.3, 0, 0.2, 1] }}
          className="w-full [&_*]:rounded-none"
        >
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 text-cream/50 hover:text-gold text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to menu
          </Link>

          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl md:text-4xl text-cream mb-3">Place Your Order</h1>
            <div className="w-16 h-[2px] bg-gold mx-auto mb-4" />
            <p className="font-sans text-cream/60 text-sm max-w-md mx-auto">
              {initialCategory && `From ${initialCategory}`}
              {initialCategory && ". "}
              Confirm your dish, quantity and how you'd like it served.
            </p>
          </div>

          {submitted ? (
            <Card className="border-cream/10 bg-cream/[0.03]">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
                <h2 className="font-serif text-2xl text-cream mb-2">Order Received</h2>
                <p className="text-cream/60 text-sm mb-6">
                  Thank you, {guestName}. Your order has been sent to the restaurant.
                  {` We'll email a confirmation to ${email.trim()} as soon as our team accepts it — please keep your reference code below.`}
                </p>

                {payNotice && (
                  <p className="text-sm text-gold/90 mb-6 max-w-md mx-auto">{payNotice}</p>
                )}

                <div className="inline-block px-5 py-3 rounded-lg border border-gold/30 bg-gold/10 mb-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">Reference</p>
                  <p className="font-serif text-xl text-gold tracking-wide">{reference}</p>
                </div>

                <div className="space-y-2 text-sm text-cream/70 mb-6">
                  <p>
                    <span className="text-cream/40">Item:</span> {itemName} × {quantity}
                  </p>
                  <p>
                    <span className="text-cream/40">Type:</span> {typeLabel[orderType]}
                  </p>
                  {isDelivery && (
                    <>
                      <p>
                        <span className="text-cream/40">Delivering to:</span> {location?.address}
                      </p>
                      <p>
                        <span className="text-cream/40">Delivery fee:</span> GH₵ {deliveryFee.toFixed(2)}
                      </p>
                    </>
                  )}
                  <p>
                    <span className="text-cream/40">Total:</span> GH₵ {total.toFixed(2)}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {trackingToken && (
                    <Button asChild className="w-full sm:w-auto">
                      <Link to={`/track/${trackingToken}`}>Track your order</Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" className="w-full sm:w-auto border-gold/40 text-gold hover:bg-gold/10">
                    <Link to="/menu">Order another dish</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-cream/10 bg-cream/[0.03]">
              <CardHeader className="pb-4">
                <CardTitle className="font-serif text-lg text-cream flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-gold" /> Order Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-cream/70 text-sm">Dish</Label>
                      <Input
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        className="bg-charcoal border-cream/10 text-cream"
                        placeholder="Dish name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-cream/70 text-sm">Unit price</Label>
                      <Input
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        className="bg-charcoal border-cream/10 text-cream"
                        placeholder="GH₵ 0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-cream/70 text-sm">Quantity</Label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="h-10 w-10 rounded-md border border-cream/10 text-cream hover:bg-cream/10 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-serif text-xl text-cream w-8 text-center">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="h-10 w-10 rounded-md border border-cream/10 text-cream hover:bg-cream/10 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-cream/70 text-sm">Order type</Label>
                    <Select value={orderType} onValueChange={(v) => setOrderType(v as any)}>
                      <SelectTrigger className="bg-charcoal border-cream/10 text-cream">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-charcoal border-cream/10 rounded-none">
                        <SelectItem value="dine_in">Dine-in</SelectItem>
                        <SelectItem value="room_service">Room Service</SelectItem>
                        <SelectItem value="takeaway">Takeaway</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {orderType === "room_service" && (
                    <div className="space-y-2">
                      <Label className="text-cream/70 text-sm">Room number</Label>
                      <Input
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="bg-charcoal border-cream/10 text-cream"
                        placeholder="e.g. 205"
                      />
                    </div>
                  )}

                  {isDelivery && (
                    <div className="space-y-4 py-4 px-0">
                      <div className="flex items-center gap-2 text-gold text-sm">
                        <Bike className="w-4 h-4" /> Where should we deliver?
                      </div>

                      <DeliveryLocationPicker value={location} onChange={setLocation} />

                      <div className="space-y-2">
                        <Label className="text-cream/70 text-sm">Landmark / directions</Label>
                        <Input
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          className="bg-charcoal border-cream/10 text-cream"
                          placeholder="e.g. opposite the filling station"
                        />
                      </div>


                      <div className="space-y-2">
                        <Label className="text-cream/70 text-sm">Payment</Label>
                        <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                          <SelectTrigger className="bg-charcoal border-cream/10 text-cream">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-charcoal border-cream/10 rounded-none">
                            <SelectItem value="cash_on_delivery">Cash on delivery</SelectItem>
                            <SelectItem value="paystack">Pay online (card or mobile money)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-cream/40 flex items-center gap-1.5">
                          <Wallet className="w-3 h-3" />{" "}
                          {paymentMethod === "paystack"
                            ? "You'll be taken to a secure payment page before your order is dispatched."
                            : "Have the exact amount ready for our rider."}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-cream/70 text-sm">Your name *</Label>
                      <Input
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="bg-charcoal border-cream/10 text-cream"
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-cream/70 text-sm">Phone {isDelivery && "*"}</Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-charcoal border-cream/10 text-cream"
                        placeholder="+233..."
                        required={isDelivery}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-cream/70 text-sm">Email *</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-charcoal border-cream/10 text-cream"
                      placeholder="you@example.com"
                      required
                    />
                    <p className="text-[11px] text-cream/40">
                      We'll send your order updates here.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-cream/70 text-sm">Notes</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-charcoal border-cream/10 text-cream"
                      placeholder="Allergies, spice level, preferred time..."
                      rows={3}
                    />
                  </div>

                  <Separator className="bg-cream/10" />

                  {isDelivery && (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-cream/60">
                        <span>Items subtotal</span>
                        <span>GH₵ {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-cream/60">
                        <span>Delivery</span>
                        <span>GH₵ {deliveryFee.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-cream/40">Total due</p>
                      <p className="font-serif text-2xl text-gold">GH₵ {total.toFixed(2)}</p>
                    </div>

                    <Button type="submit" disabled={!canSubmit || submitting} className="px-8">
                      {submitting ? "Sending…" : "Place Order"}
                    </Button>
                  </div>

                  {error && (
                    <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/30 rounded-md px-3 py-2">
                      {error}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      <CustomerDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onSaved={applyCustomer}
      />

      <Footer />
    </div>
  );
}
