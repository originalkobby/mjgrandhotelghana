import { useState, useCallback } from "react";

export type BookingStep = "search" | "rooms" | "addons" | "details" | "confirmation";

export interface BookingSearch {
  checkIn: Date | undefined;
  checkOut: Date | undefined;
  adults: number;
  children: number;
  promoCode: string;
}

export interface SelectedRoom {
  id: string;
  name: string;
  slug: string;
  description: string;
  size_sqm: number;
  bed_type: string;
  base_price_ghs: number;
  amenities: string[];
  images: string[];
  nightlyRate: number;
  totalNights: number;
  totalPrice: number;
}

export interface SelectedAddOn {
  id: string;
  name: string;
  price_ghs: number;
  icon: string;
  quantity: number;
}

export interface GuestInfo {
  fullName: string;
  email: string;
  phone: string;
  specialRequests: string;
  arrivalTime: string;
  nationality: string;
}

export interface BookingState {
  step: BookingStep;
  search: BookingSearch;
  selectedRoom: SelectedRoom | null;
  selectedAddOns: SelectedAddOn[];
  guestInfo: GuestInfo;
  bookingReference: string | null;
  totalAmount: number;
}

const STEPS: BookingStep[] = ["search", "rooms", "addons", "details", "confirmation"];

export function useBooking() {
  const [state, setState] = useState<BookingState>({
    step: "search",
    search: {
      checkIn: undefined,
      checkOut: undefined,
      adults: 2,
      children: 0,
      promoCode: "",
    },
    selectedRoom: null,
    selectedAddOns: [],
    guestInfo: {
      fullName: "",
      email: "",
      phone: "",
      specialRequests: "",
      arrivalTime: "",
      nationality: "",
    },
    bookingReference: null,
    totalAmount: 0,
  });

  const setStep = useCallback((step: BookingStep) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const setSearch = useCallback((search: Partial<BookingSearch>) => {
    setState((prev) => ({ ...prev, search: { ...prev.search, ...search } }));
  }, []);

  const setSelectedRoom = useCallback((room: SelectedRoom | null) => {
    setState((prev) => ({ ...prev, selectedRoom: room }));
  }, []);

  const toggleAddOn = useCallback((addOn: Omit<SelectedAddOn, "quantity">) => {
    setState((prev) => {
      const exists = prev.selectedAddOns.find((a) => a.id === addOn.id);
      const selectedAddOns = exists
        ? prev.selectedAddOns.filter((a) => a.id !== addOn.id)
        : [...prev.selectedAddOns, { ...addOn, quantity: 1 }];
      return { ...prev, selectedAddOns };
    });
  }, []);

  const setGuestInfo = useCallback((info: Partial<GuestInfo>) => {
    setState((prev) => ({ ...prev, guestInfo: { ...prev.guestInfo, ...info } }));
  }, []);

  const setBookingReference = useCallback((ref: string) => {
    setState((prev) => ({ ...prev, bookingReference: ref }));
  }, []);

  const currentStepIndex = STEPS.indexOf(state.step);

  const goNext = useCallback(() => {
    const idx = STEPS.indexOf(state.step);
    if (idx < STEPS.length - 1) setState((prev) => ({ ...prev, step: STEPS[idx + 1] }));
  }, [state.step]);

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(state.step);
    if (idx > 0) setState((prev) => ({ ...prev, step: STEPS[idx - 1] }));
  }, [state.step]);

  const addOnsTotal = state.selectedAddOns.reduce((sum, a) => sum + a.price_ghs * a.quantity, 0);
  const totalAmount = (state.selectedRoom?.totalPrice ?? 0) + addOnsTotal;

  return {
    state: { ...state, totalAmount },
    setStep,
    setSearch,
    setSelectedRoom,
    toggleAddOn,
    setGuestInfo,
    setBookingReference,
    goNext,
    goBack,
    currentStepIndex,
    steps: STEPS,
  };
}
