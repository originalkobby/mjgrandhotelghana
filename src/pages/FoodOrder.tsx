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
import { CheckCircle2, Minus, Plus, UtensilsCrossed, ArrowLeft } from "lucide-react";

function parsePrice(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function newOrderRef() {
  return "FO-MJ-" + Math.random().toString(36).substring(2, 6).toUpperCase();
}

type DeliveryZone = { id: string; name: string; fee_ghs: number };

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

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLandmark, setDeliveryLandmark] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItemName(initialItem);
    setItemPrice(initialPrice);
  }, [initialItem, initialPrice]);

  useEffect(() => {
    supabase
      .from("delivery_zones")
      .select("id, name, fee_ghs")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setZones((data as DeliveryZone[]) ?? []));
  }, []);

  const isDelivery = orderType === "delivery";
  const selectedZone = useMemo(() => zones.find((z) => z.id === zoneId) || null, [zones, zoneId]);
  const deliveryFee = isDelivery && selectedZone ? Number(selectedZone.fee_ghs) : 0;

  const unitPrice = useMemo(() => parsePrice(itemPrice), [itemPrice]);
  const subtotal = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);
  const total = subtotal + deliveryFee;

  const canSubmit =
    !!guestName.trim() &&
    quantity > 0 &&
    unitPrice > 0 &&
    (!isDelivery || (!!zoneId && !!deliveryAddress.trim() && !!phone.trim()));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const ref = newOrderRef();

      const { data: order, error: orderError } = await supabase
        .from("food_orders")
        .insert({
          guest_name: guestName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          room_number: roomNumber.trim() || null,
          order_type: orderType,
          status: "pending",
          notes: notes.trim() || null,
          total_ghs: total,
          reference_code: ref,
          delivery_zone_id: isDelivery ? zoneId : null,
          delivery_address: isDelivery ? deliveryAddress.trim() : null,
          delivery_landmark: isDelivery ? deliveryLandmark.trim() || null : null,
          delivery_fee_ghs: deliveryFee,
        })
        .select("id")
        .single();

      if (orderError) throw orderError;
      if (!order?.id) throw new Error("Order could not be created");

      const { error: itemsError } = await supabase.from("food_order_items").insert({
        food_order_id: order.id,
        name: itemName.trim(),
        price_ghs: unitPrice,
        quantity,
        line_total_ghs: subtotal,
      });

      if (itemsError) throw itemsError;

      if (email.trim()) {
        supabase.functions
          .invoke("send-food-order-email", { body: { orderId: order.id } })
          .catch((e) => console.error("Confirmation email failed", e));
      }

      setReference(ref);
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
        description="Order from the MJ Grand Hotel restaurant menu for dine-in, room service or takeaway in East Legon, Accra."
        path="/food-order"
      />
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 pt-28 md:pt-36 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.3, 0, 0.2, 1] }}
          className="max-w-2xl mx-auto"
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
              Confirm your dish, quantity and collection details. Payment is made on collection or delivery.
            </p>
          </div>

          {submitted ? (
            <Card className="border-cream/10 bg-cream/[0.03]">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
                <h2 className="font-serif text-2xl text-cream mb-2">Order Received</h2>
                <p className="text-cream/60 text-sm mb-6">
                  Thank you, {guestName}. Your order has been sent to the kitchen.
                  {email.trim() ? ` A confirmation has been sent to ${email.trim()}.` : ""}
                </p>

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
                  <p>
                    <span className="text-cream/40">Total:</span> GH₵ {total.toFixed(2)}
                  </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                  <Link to="/menu">Order another dish</Link>
                </Button>
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
                    <Select
                      value={orderType}
                      onValueChange={(v) => setOrderType(v as any)}
                    >
                      <SelectTrigger className="bg-charcoal border-cream/10 text-cream">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-charcoal border-cream/10">
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
                    <div className="space-y-4 rounded-lg border border-gold/20 bg-gold/[0.04] p-4">
                      <div className="space-y-2">
                        <Label className="text-cream/70 text-sm">Delivery zone *</Label>
                        <Select value={zoneId} onValueChange={setZoneId}>
                          <SelectTrigger className="bg-charcoal border-cream/10 text-cream">
                            <SelectValue placeholder="Select your area" />
                          </SelectTrigger>
                          <SelectContent className="bg-charcoal border-cream/10">
                            {zones.map((z) => (
                              <SelectItem key={z.id} value={z.id}>
                                {z.name} — GH₵ {Number(z.fee_ghs).toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {zones.length === 0 && (
                          <p className="text-xs text-cream/40">
                            No delivery areas available at the moment.
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-cream/70 text-sm">Delivery address *</Label>
                        <Textarea
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="bg-charcoal border-cream/10 text-cream"
                          placeholder="House number, street, area"
                          rows={2}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-cream/70 text-sm">Landmark / directions</Label>
                        <Input
                          value={deliveryLandmark}
                          onChange={(e) => setDeliveryLandmark(e.target.value)}
                          className="bg-charcoal border-cream/10 text-cream"
                          placeholder="e.g. opposite the filling station"
                        />
                      </div>
                      <p className="text-xs text-cream/50">
                        A phone number is required for delivery so our rider can reach you.
                      </p>
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
                    <Label className="text-cream/70 text-sm">Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-charcoal border-cream/10 text-cream"
                      placeholder="you@example.com"
                    />
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
                        <span>Delivery{selectedZone ? ` — ${selectedZone.name}` : ""}</span>
                        <span>GH₵ {deliveryFee.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-cream/40">Total due</p>
                      <p className="font-serif text-2xl text-gold">GH₵ {total.toFixed(2)}</p>
                    </div>

                    <Button
                      type="submit"
                      disabled={!canSubmit || submitting}
                      className="px-8"
                    >
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

      <Footer />
    </div>
  );
}
