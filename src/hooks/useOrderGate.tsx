import { useCallback, useRef, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import CustomerDetailsDialog from "@/components/food/CustomerDetailsDialog";
import { isKnownDevice, touchCustomerVisit } from "@/lib/customerDevice";

/**
 * Gates "Order Now" links: unknown devices are asked for name, email and phone
 * once, then continue to the order page. Known devices go straight through.
 */
export function useOrderGate() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const pendingUrl = useRef<string | null>(null);

  const handleOrderClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, url: string) => {
      if (isKnownDevice()) {
        void touchCustomerVisit();
        return;
      }
      e.preventDefault();
      pendingUrl.current = url;
      setOpen(true);
    },
    [],
  );

  const gateDialog = (
    <CustomerDetailsDialog
      open={open}
      onOpenChange={setOpen}
      onSaved={() => {
        setOpen(false);
        const url = pendingUrl.current;
        pendingUrl.current = null;
        if (url) navigate(url);
      }}
    />
  );

  return { handleOrderClick, gateDialog };
}
