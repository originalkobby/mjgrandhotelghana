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
import { useToast } from "@/hooks/use-toast";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

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

  const createBooking = useMutation(api.bookings.createBooking);
  const verifyPayment = useAction(api.paystack.verify);

  // Pre-select room from query param
  const roomId = searchParams.get("room");
  const roomData = useQuery(api.rooms.getRoomById, roomId ? { id: roomId } : "skip");

  useEffect(() => {
    if (roomData && !state.selectedRoom) {
      setRoomPreselected(true);
      setSelectedRoom({
        id: roomData._id,
        name: roomData.name,
        slug: roomData.slug,
        description: roomData.description ?? "",
        size_sqm: roomData.size_sqm ?? 0,
        bed_type: roomData.bed_type ?? "",
        base_price_ghs: roomData.base_price_ghs,
        amenities: roomData.amenities ?? [],
        images: roomData.images ?? [],
        nightlyRate: roomData.base_price_ghs,
        totalNights: 0,
        totalPrice: 0,
      });
    }
  }, [roomData]);

  // Recompute room pricing when dates change (for pre-selected rooms)
  useEffect(() => {
    if (!state.roomPreselected || !state.selectedRoom || !state.search.checkIn || !state.search.checkOut) return;

    const nights = differenceInDays(state.search.checkOut, state.search.checkIn);
    if (nights <= 0) return;

    const avgRate = state.selectedRoom.base_price_ghs;
    setSelectedRoom({
      ...state.selectedRoom,
      nightlyRate: avgRate,
      totalNights: nights,
      totalPrice: avgRate * nights,
    });
  }, [state.roomPreselected, state.search.checkIn, state.search.checkOut]);

  // Handle Paystack callback verification
  useEffect(() => {
    const verifyRef = searchParams.get("verify");
    if (verifyRef && state.step !== "confirmation") {
      (async () => {
        try {
          const result = await verifyPayment({ reference: verifyRef });
          if (result.verified) {
            setBookingReference(verifyRef);
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
      const result = await createBooking({
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
          promoCode: state.search.promoCode || undefined,
          specialRequests: state.guestInfo.specialRequests || undefined,
          arrivalTime: state.guestInfo.arrivalTime || undefined,
          nationality: state.guestInfo.nationality || undefined,
          flightItinerary: state.guestInfo.flightItinerary || undefined,
        },
        addOns: state.selectedAddOns.map((a) => ({
          id: a.id,
          quantity: a.quantity,
        })),
      });

      setBookingReference(result.reference);
      goNext();

      toast({
        title: "Booking Created!",
        description: `Reference: ${result.reference}. Proceed to payment.`,
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
  }, [state, createBooking, setBookingReference, goNext, toast]);

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
