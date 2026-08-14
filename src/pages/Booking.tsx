import { useState, useCallback, useEffect } from "react";
import SEO from "@/components/SEO";
import { AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { differenceInDays } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingStepper from "@/components/booking/BookingStepper";
import SearchStep from "@/components/booking/SearchStep";
import RoomSelectionStep from "@/components/booking/RoomSelectionStep";
import AddOnsStep from "@/components/booking/AddOnsStep";
import GuestDetailsStep from "@/components/booking/GuestDetailsStep";
import PaymentStep from "@/components/booking/PaymentStep";
import ConfirmationStep from "@/components/booking/ConfirmationStep";
import BookingLookupSection from "@/components/booking/BookingLookupSection";
import { useBooking } from "@/hooks/useBooking";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PUBLIC_ROOM_COLUMNS =
  "id, name, slug, description, size_sqm, bed_type, max_adults, max_children, base_price_ghs, amenities, images, sort_order, is_active, total_units";

const Booking = () => {
  const {
    state,
    setStep,
    setSearch,
    setSelectedRoom,
    setIsGroup,
    setGroupRooms,
    setGroupResult,
    setRoomPreselected,
    toggleAddOn,
    setGuestInfo,
    setBookingReference,
    setAppliedPromo,
    goNext,
    goBack,
    currentStepIndex,
    steps,
  } = useBooking();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Pre-select room from query param
  useEffect(() => {
    const roomId = searchParams.get("room");
    if (roomId && !state.selectedRoom) {
      (async () => {
        const { data: room } = await supabase
          .from("rooms")
          .select(PUBLIC_ROOM_COLUMNS)
          .eq("id", roomId)
          .eq("is_active", true)
          .maybeSingle();

        if (room) {
          setRoomPreselected(true);
          // Store basic room info; totalPrice will be computed after dates are chosen
          setSelectedRoom({
            id: room.id,
            name: room.name,
            slug: room.slug,
            description: room.description ?? "",
            size_sqm: room.size_sqm ?? 0,
            bed_type: room.bed_type ?? "",
            base_price_ghs: room.base_price_ghs,
            amenities: (room.amenities as string[]) ?? [],
            images: (room.images as string[]) ?? [],
            nightlyRate: room.base_price_ghs,
            totalNights: 0,
            totalPrice: 0,
          });
        }
      })();
    }
  }, [searchParams]);

  // Recompute room pricing when dates change (for pre-selected rooms)
  useEffect(() => {
    if (!state.roomPreselected || !state.selectedRoom || !state.search.checkIn || !state.search.checkOut) return;

    const roomId = state.selectedRoom.id;
    const checkIn = state.search.checkIn.toISOString().split("T")[0];
    const checkOut = state.search.checkOut.toISOString().split("T")[0];
    const nights = differenceInDays(state.search.checkOut, state.search.checkIn);
    if (nights <= 0) return;

    (async () => {
      const avgRate = state.selectedRoom!.base_price_ghs;

      setSelectedRoom({
        ...state.selectedRoom!,
        nightlyRate: avgRate,
        totalNights: nights,
        totalPrice: avgRate * nights,
      });
    })();
  }, [state.roomPreselected, state.search.checkIn, state.search.checkOut]);

  // Handle Paystack callback verification — restore booking state from DB
  useEffect(() => {
    const verifyRef = searchParams.get("verify");
    const verifyEmail = searchParams.get("e") || undefined;
    if (verifyRef && state.step !== "confirmation") {
      (async () => {
        try {
          const { data } = await supabase.functions.invoke("paystack", {
            body: { action: "verify", reference: verifyRef, email: verifyEmail },
          });

          if (data?.verified) {
            const { data: booking } = await supabase
              .from("bookings")
              .select("reference_code, check_in, check_out, adults, children, final_total_ghs, rooms(name), guests(full_name, email)")
              .eq("reference_code", verifyRef)
              .maybeSingle();

            setBookingReference(verifyRef);

            if (booking) {
              setSearch({
                checkIn: new Date(booking.check_in),
                checkOut: new Date(booking.check_out),
                adults: booking.adults,
                children: booking.children,
              });
            }

            setStep("confirmation");
            toast({ title: "Payment Successful!", description: `Reference: ${verifyRef}` });
          }
        } catch (err) {
          console.error("Verification error:", err);
        }
      })();
    }
  }, [searchParams]);

  // Validate promo code when entering details/payment steps or when inputs change
  useEffect(() => {
    const code = state.search.promoCode?.trim().toUpperCase();
    const room = state.selectedRoom;
    const baseTotal = state.isGroup
      ? state.groupRooms.reduce((sum, r) => sum + r.totalPrice * r.quantity, 0)
      : room?.totalPrice ?? 0;
    const shouldValidate = (state.step === "details" || state.step === "payment") && code && room && baseTotal > 0;

    if (!code) {
      if (state.appliedPromo || state.promoError) setAppliedPromo(null, null);
      return;
    }
    if (!shouldValidate) return;
    // Always re-validate on payment step (catches admin toggling promo off mid-flow)
    if (state.step !== "payment" && state.appliedPromo?.code === code) return;

    let cancelled = false;
    const validationTimer = window.setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("validate-promo", {
          body: {
            code,
            roomId: room!.id,
            baseTotalGhs: baseTotal,
            nights: room!.totalNights,
            checkIn: state.search.checkIn?.toISOString().split("T")[0],
            checkOut: state.search.checkOut?.toISOString().split("T")[0],
          },
        });

        if (cancelled) return;
        if (error && !data) {
          console.error("validate-promo error:", error);
          setAppliedPromo(null, "Could not validate promo code");
          return;
        }
        if (data?.valid) {
          setAppliedPromo({
            code: data.code,
            discountType: data.discountType,
            discountValue: data.discountValue,
            discountGhs: data.discountGhs,
            description: data.description,
          }, null);
        } else {
          const reasonMap: Record<string, string> = {
            not_found: "Promo code not found",
            inactive: "This promo code is no longer active",
            expired: "Promo code has expired",
            not_started: "Promo code not yet active",
            usage_limit: "Promo code usage limit reached",
            room_not_allowed: "Promo not valid for this room",
            invalid_dates: "Select your stay dates to apply this promo",
            invalid_input: "Promo code could not be applied to this stay",
            error: "Could not validate promo code — please try again",
          };
          console.warn("validate-promo rejected:", data?.reason, data);
          setAppliedPromo(null, reasonMap[data?.reason] ?? `Promo code not valid (${data?.reason ?? "unknown"})`);
        }

      } catch (err) {
        if (!cancelled) setAppliedPromo(null, "Could not validate promo code");
      }
    }, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(validationTimer);
    };
  }, [state.step, state.search.promoCode, state.selectedRoom?.id, state.selectedRoom?.totalPrice, state.selectedRoom?.totalNights, state.search.checkIn, state.search.checkOut]);

  const handleSubmitBooking = useCallback(async () => {
    if (!state.selectedRoom || !state.search.checkIn || !state.search.checkOut) return;

    setIsSubmitting(true);
    try {
      const addOnsTotal = state.selectedAddOns.reduce((s, a) => s + a.price_ghs * a.quantity, 0);
      const discountGhs = state.appliedPromo?.discountGhs ?? 0;
      const roomsTotal = state.isGroup
        ? state.groupRooms.reduce((sum, r) => sum + r.totalPrice * r.quantity, 0)
        : state.selectedRoom.totalPrice;
      const finalTotal = Math.max(0, roomsTotal + addOnsTotal - discountGhs);
      const groupPayload =
        state.isGroup && state.groupRooms.length > 0
          ? state.groupRooms.map((r) => ({ roomId: r.id, quantity: r.quantity }))
          : undefined;

      const { data, error: fnError } = await supabase.functions.invoke("create-booking", {
        body: {
          guest: {
            fullName: state.guestInfo.fullName,
            email: state.guestInfo.email,
            phone: state.guestInfo.phone,
          },
          booking: {
            roomId: state.selectedRoom.id,
            checkIn: state.search.checkIn.toISOString().split("T")[0],
            checkOut: state.search.checkOut.toISOString().split("T")[0],
            adults: state.search.adults,
            children: state.search.children,
            baseTotalGhs: roomsTotal,
            addOnsTotalGhs: addOnsTotal,
            finalTotalGhs: finalTotal,
            promoCode: state.search.promoCode || null,
            specialRequests: state.guestInfo.specialRequests || null,
            arrivalTime: state.guestInfo.arrivalTime || null,
            nationality: state.guestInfo.nationality || null,
            flightItinerary: state.guestInfo.flightItinerary || null,
          },
          rooms: groupPayload,
          addOns: state.selectedAddOns.map((a) => ({
            id: a.id,
            quantity: a.quantity,
            priceGhs: a.price_ghs,
          })),
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setBookingReference(data.reference);
      setGroupResult(data.groupRef ?? null, data.bookings ?? null);
      goNext();

      toast({
        title: data.groupRef ? "Group Booking Created!" : "Booking Created!",
        description: data.groupRef
          ? `${data.bookings?.length ?? 0} rooms held · Group ref: ${data.groupRef}. Proceed to payment.`
          : `Reference: ${data.reference}. Proceed to payment.`,
      });
    } catch (err: any) {
      console.error("Booking error:", err);
      toast({
        title: "Booking Failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [state, setBookingReference, setGroupResult, goNext, toast]);

  const handlePaymentComplete = useCallback(() => {
    setStep("confirmation");
  }, [setStep]);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Book a Room — MJ Grand Hotel Ghana" description="Reserve your stay at MJ Grand Hotel, Accra. Single, Double, Deluxe, and Executive rooms with secure online booking and instant confirmation." path="/booking" />
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          {state.step !== "confirmation" && (
            <BookingStepper
              currentStep={state.step}
              currentIndex={currentStepIndex}
              roomPreselected={state.roomPreselected}
            />
          )}

          <AnimatePresence mode="wait">
            {state.step === "search" && (
              <SearchStep key="search" search={state.search} onUpdate={setSearch} onNext={goNext} />
            )}
            {state.step === "rooms" && (
              <RoomSelectionStep
                key="rooms"
                search={state.search}
                onSelect={(room) => { setSelectedRoom(room); goNext(); }}
                onBack={goBack}
                isGroup={state.isGroup}
                onToggleGroup={setIsGroup}
                onGroupContinue={(rooms) => { setGroupRooms(rooms); goNext(); }}
              />
            )}
            {state.step === "addons" && state.selectedRoom && (
              <AddOnsStep
                key="addons"
                selectedRoom={state.selectedRoom}
                selectedAddOns={state.selectedAddOns}
                onToggle={toggleAddOn}
                onNext={goNext}
                onBack={goBack}
              />
            )}
            {state.step === "details" && state.selectedRoom && (
              <GuestDetailsStep
                key="details"
                guestInfo={state.guestInfo}
                selectedRoom={state.selectedRoom}
                selectedAddOns={state.selectedAddOns}
                totalAmount={state.totalAmount}
                appliedPromo={state.appliedPromo}
                promoError={state.promoError}
                onUpdate={setGuestInfo}
                onSubmit={handleSubmitBooking}
                onBack={goBack}
                isSubmitting={isSubmitting}
              />
            )}
            {state.step === "payment" && state.selectedRoom && (
              <PaymentStep
                key="payment"
                selectedRoom={state.selectedRoom}
                selectedAddOns={state.selectedAddOns}
                guestInfo={state.guestInfo}
                totalAmount={state.totalAmount}
                appliedPromo={state.appliedPromo}
                promoError={state.promoError}
                bookingReference={state.bookingReference}
                onPaymentComplete={handlePaymentComplete}
                onBack={goBack}
              />
            )}
            {state.step === "confirmation" && (
              <ConfirmationStep key="confirmation" state={state} />
            )}
          </AnimatePresence>

          {state.step !== "confirmation" && <BookingLookupSection />}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Booking;
