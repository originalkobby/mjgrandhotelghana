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
    setRoomPreselected,
    toggleAddOn,
    setGuestInfo,
    setBookingReference,
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
    if (verifyRef && state.step !== "confirmation") {
      (async () => {
        try {
          const { data } = await supabase.functions.invoke("paystack", {
            body: { action: "verify", reference: verifyRef },
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

  const handleSubmitBooking = useCallback(async () => {
    if (!state.selectedRoom || !state.search.checkIn || !state.search.checkOut) return;

    setIsSubmitting(true);
    try {
      const addOnsTotal = state.selectedAddOns.reduce((s, a) => s + a.price_ghs * a.quantity, 0);
      const finalTotal = state.selectedRoom.totalPrice + addOnsTotal;

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
            baseTotalGhs: state.selectedRoom.totalPrice,
            addOnsTotalGhs: addOnsTotal,
            finalTotalGhs: finalTotal,
            promoCode: state.search.promoCode || null,
            specialRequests: state.guestInfo.specialRequests || null,
            arrivalTime: state.guestInfo.arrivalTime || null,
            nationality: state.guestInfo.nationality || null,
            flightItinerary: state.guestInfo.flightItinerary || null,
          },
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
      goNext();

      toast({
        title: "Booking Created!",
        description: `Reference: ${data.reference}. Proceed to payment.`,
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
  }, [state, setBookingReference, goNext, toast]);

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
