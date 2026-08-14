import { useState, useCallback } from "react";

export type BookingStep = "search" | "rooms" | "addons" | "details" | "payment" | "confirmation";

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

export interface GroupRoom extends SelectedRoom {
  quantity: number;
}

export interface GroupBookingResult {
  reference: string;
  roomName: string;
  finalTotal: number;
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
  flightItinerary: string;
}

export interface AppliedPromo {
  code: string;
  discountType: string;
  discountValue: number;
  discountGhs: number;
  description?: string | null;
}

export interface BookingState {
  step: BookingStep;
  search: BookingSearch;
  selectedRoom: SelectedRoom | null;
  selectedAddOns: SelectedAddOn[];
  guestInfo: GuestInfo;
  bookingReference: string | null;
  totalAmount: number;
  roomPreselected: boolean;
  appliedPromo: AppliedPromo | null;
  promoError: string | null;
  isGroup: boolean;
  groupRooms: GroupRoom[];
  groupRef: string | null;
  groupBookings: GroupBookingResult[] | null;
}

const STEPS: BookingStep[] = ["search", "rooms", "addons", "details", "payment", "confirmation"];

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
      flightItinerary: "",
    },
    bookingReference: null,
    totalAmount: 0,
    roomPreselected: false,
    appliedPromo: null,
    promoError: null,
    isGroup: false,
    groupRooms: [],
    groupRef: null,
    groupBookings: null,
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

  const setIsGroup = useCallback((isGroup: boolean) => {
    setState((prev) => ({
      ...prev,
      isGroup,
      groupRooms: isGroup ? prev.groupRooms : [],
    }));
  }, []);

  const setGroupRooms = useCallback((rooms: GroupRoom[]) => {
    setState((prev) => ({
      ...prev,
      groupRooms: rooms,
      // The first room in the group acts as the lead room for the remaining steps
      selectedRoom: rooms.length > 0 ? rooms[0] : prev.selectedRoom,
    }));
  }, []);

  const setGroupResult = useCallback(
    (groupRef: string | null, bookings: GroupBookingResult[] | null) => {
      setState((prev) => ({ ...prev, groupRef, groupBookings: bookings }));
    },
    []
  );

  const setRoomPreselected = useCallback((val: boolean) => {
    setState((prev) => ({ ...prev, roomPreselected: val }));
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

  const setAppliedPromo = useCallback((promo: AppliedPromo | null, error: string | null = null) => {
    setState((prev) => ({ ...prev, appliedPromo: promo, promoError: error }));
  }, []);


  const currentStepIndex = STEPS.indexOf(state.step);

  const goNext = useCallback(() => {
    const idx = STEPS.indexOf(state.step);
    if (idx < STEPS.length - 1) {
      let nextIdx = idx + 1;
      // Skip "rooms" step (index 1) when room is pre-selected
      if (STEPS[nextIdx] === "rooms" && state.roomPreselected) {
        nextIdx++;
      }
      if (nextIdx < STEPS.length) {
        setState((prev) => ({ ...prev, step: STEPS[nextIdx] }));
      }
    }
  }, [state.step, state.roomPreselected]);

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(state.step);
    if (idx > 0) {
      let prevIdx = idx - 1;
      // Skip "rooms" step (index 1) when room is pre-selected
      if (STEPS[prevIdx] === "rooms" && state.roomPreselected) {
        prevIdx--;
      }
      if (prevIdx >= 0) {
        setState((prev) => ({ ...prev, step: STEPS[prevIdx] }));
      }
    }
  }, [state.step, state.roomPreselected]);

  const addOnsTotal = state.selectedAddOns.reduce((sum, a) => sum + a.price_ghs * a.quantity, 0);
  const groupUnits = state.isGroup
    ? state.groupRooms.reduce((sum, r) => sum + r.quantity, 0)
    : 1;
  const roomTotal = state.isGroup
    ? state.groupRooms.reduce((sum, r) => sum + r.totalPrice * r.quantity, 0)
    : state.selectedRoom?.totalPrice ?? 0;
  const preDiscountTotal = roomTotal + addOnsTotal;
  // For flat-rate group promos the room charge is always rate x nights, so derive the
  // adjustment from the currently selected room instead of a possibly stale server value.
  const nights = state.selectedRoom?.totalNights ?? 0;
  const discountGhs =
    state.appliedPromo?.discountType === "flat_rate" && nights > 0
      ? roomTotal - state.appliedPromo.discountValue * nights * groupUnits
      : state.appliedPromo?.discountGhs ?? 0;
  const totalAmount = Math.max(0, preDiscountTotal - discountGhs);


  return {
    state: {
      ...state,
      totalAmount,
      appliedPromo: state.appliedPromo ? { ...state.appliedPromo, discountGhs } : null,
    },

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
    steps: STEPS,
  };
}
