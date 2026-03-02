import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingStepper from "@/components/booking/BookingStepper";
import SearchStep from "@/components/booking/SearchStep";
import RoomSelectionStep from "@/components/booking/RoomSelectionStep";
import AddOnsStep from "@/components/booking/AddOnsStep";
import GuestDetailsStep from "@/components/booking/GuestDetailsStep";
import ConfirmationStep from "@/components/booking/ConfirmationStep";
import { useBooking } from "@/hooks/useBooking";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Booking = () => {
  const {
    state,
    setStep,
    setSearch,
    setSelectedRoom,
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

  const handleSubmitBooking = useCallback(async () => {
    if (!state.selectedRoom || !state.search.checkIn || !state.search.checkOut) return;

    setIsSubmitting(true);
    try {
      // Create or find guest
      const { data: guestData, error: guestError } = await supabase
        .from("guests")
        .upsert(
          {
            full_name: state.guestInfo.fullName,
            email: state.guestInfo.email,
            phone: state.guestInfo.phone,
          },
          { onConflict: "email" }
        )
        .select("id")
        .single();

      // Generate reference
      const refCode = "MJ-" + Math.random().toString(36).substring(2, 10).toUpperCase();

      const addOnsTotal = state.selectedAddOns.reduce((s, a) => s + a.price_ghs * a.quantity, 0);
      const finalTotal = state.selectedRoom.totalPrice + addOnsTotal;

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          reference_code: refCode,
          guest_id: guestData?.id ?? null,
          room_id: state.selectedRoom.id,
          check_in: state.search.checkIn.toISOString().split("T")[0],
          check_out: state.search.checkOut.toISOString().split("T")[0],
          adults: state.search.adults,
          children: state.search.children,
          base_total_ghs: state.selectedRoom.totalPrice,
          add_ons_total_ghs: addOnsTotal,
          discount_ghs: 0,
          final_total_ghs: finalTotal,
          promo_code: state.search.promoCode || null,
          special_requests: state.guestInfo.specialRequests || null,
          arrival_time: state.guestInfo.arrivalTime || null,
          nationality: state.guestInfo.nationality || null,
          status: "confirmed",
          payment_status: "pending",
        })
        .select("id")
        .single();

      if (bookingError) throw bookingError;

      // Insert booking add-ons
      if (state.selectedAddOns.length > 0 && booking) {
        await supabase.from("booking_add_ons").insert(
          state.selectedAddOns.map((a) => ({
            booking_id: booking.id,
            add_on_id: a.id,
            quantity: a.quantity,
            unit_price_ghs: a.price_ghs,
            total_price_ghs: a.price_ghs * a.quantity,
          }))
        );
      }

      setBookingReference(refCode);
      setStep("confirmation");

      toast({
        title: "Booking Confirmed!",
        description: `Reference: ${refCode}`,
      });
    } catch (err) {
      console.error("Booking error:", err);
      toast({
        title: "Booking Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [state, setBookingReference, setStep, toast]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          {state.step !== "confirmation" && (
            <BookingStepper currentStep={state.step} currentIndex={currentStepIndex} />
          )}

          <AnimatePresence mode="wait">
            {state.step === "search" && (
              <SearchStep
                key="search"
                search={state.search}
                onUpdate={setSearch}
                onNext={goNext}
              />
            )}
            {state.step === "rooms" && (
              <RoomSelectionStep
                key="rooms"
                search={state.search}
                onSelect={(room) => {
                  setSelectedRoom(room);
                  goNext();
                }}
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
            {state.step === "confirmation" && (
              <ConfirmationStep key="confirmation" state={state} />
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Booking;
