import { motion } from "framer-motion";
import { CheckCircle2, Calendar, Download, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logoSrc from "@/assets/logo.png";
import type { BookingState } from "@/hooks/useBooking";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Props {
  state: BookingState;
}

function generateICS(state: BookingState): void {
  const { selectedRoom, search, bookingReference } = state;
  if (!search.checkIn || !search.checkOut) return;

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const now = fmt(new Date());
  const start = fmt(search.checkIn);
  const end = fmt(search.checkOut);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MJ Grand Hotel//Booking//EN",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `DTSTAMP:${now}`,
    `UID:${bookingReference}@mjgrandhotelghana.com`,
    `SUMMARY:MJ Grand Hotel — ${selectedRoom?.name ?? "Stay"}`,
    `DESCRIPTION:Booking Ref: ${bookingReference}\\nRoom: ${selectedRoom?.name}\\nGuests: ${search.adults} Adults${search.children > 0 ? `, ${search.children} Children` : ""}`,
    "LOCATION:MJ Grand Hotel, Ghana",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `MJ-Grand-${bookingReference}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Load logo as base64 for PDF embedding */
function loadImageAsBase64(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });
}

async function generatePDF(state: BookingState): Promise<void> {
  const { selectedRoom, search, guestInfo, bookingReference, selectedAddOns, totalAmount } = state;
  if (!search.checkIn || !search.checkOut) return;

  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const cx = w / 2;
  let y = 15;

  // The official Ghana cedi symbol: GH₵
  const cedi = "GH\u20B5";

  // Logo — maintain aspect ratio
  try {
    const logoBase64 = await loadImageAsBase64(logoSrc);
    const img = new Image();
    img.src = logoBase64;
    // Use natural dimensions to calculate correct aspect ratio
    const logoH = 14;
    const aspectRatio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 2.5;
    const logoW = logoH * aspectRatio;
    doc.addImage(logoBase64, "PNG", (w - logoW) / 2, y, logoW, logoH);
    y += logoH + 4;
  } catch {
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("MJ Grand Hotel", cx, y + 8, { align: "center" });
    y += 16;
  }

  // Sub-header
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Booking Confirmation", cx, y, { align: "center" });
  y += 10;

  // Divider
  doc.setDrawColor(200);
  doc.line(20, y, w - 20, y);
  y += 10;

  // Reference — centered
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Booking Reference: ${bookingReference}`, cx, y, { align: "center" });
  y += 10;

  // Guest details — centered
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const details = [
    ["Guest", guestInfo.fullName],
    ["Email", guestInfo.email],
    ["Phone", guestInfo.phone],
    ["Room", selectedRoom?.name ?? "\u2014"],
    ["Check-in", format(search.checkIn, "dd/MM/yyyy")],
    ["Check-out", format(search.checkOut, "dd/MM/yyyy")],
    ["Guests", `${search.adults} Adult${search.adults !== 1 ? "s" : ""}${search.children > 0 ? `, ${search.children} Child${search.children !== 1 ? "ren" : ""}` : ""}`],
  ];

  details.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    const labelText = `${label}: `;
    const labelWidth = doc.getTextWidth(labelText);
    doc.setFont("helvetica", "normal");
    const fullText = `${label}: ${value}`;
    doc.setFont("helvetica", "bold");
    doc.text(labelText, cx - doc.getTextWidth(fullText) / 2, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, cx - doc.getTextWidth(fullText) / 2 + labelWidth, y);
    y += 7;
  });

  // Add-ons
  if (selectedAddOns.length > 0) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Add-Ons:", cx, y, { align: "center" });
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    selectedAddOns.forEach((a) => {
      const text = `${a.name} — ${cedi} ${(a.price_ghs * a.quantity).toLocaleString()}`;
      doc.text(text, cx, y, { align: "center" });
      y += 6;
    });
    doc.setFontSize(10);
  }

  // Total
  y += 6;
  doc.line(20, y, w - 20, y);
  y += 8;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${cedi} ${totalAmount.toLocaleString()}`, cx, y, { align: "center" });
  y += 14;

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(130);
  doc.text("Thank you for choosing MJ Grand Hotel. We look forward to welcoming you!", cx, y, { align: "center" });
  doc.text("www.mjgrandhotelghana.com", cx, y + 5, { align: "center" });

  doc.save(`MJ-Grand-${bookingReference}.pdf`);
}

export default function ConfirmationStep({ state }: Props) {
  const { selectedRoom, search, guestInfo, bookingReference, selectedAddOns, totalAmount } = state;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.3, 0, 0.2, 1] }}
      className="max-w-2xl mx-auto text-center"
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="flex justify-center mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-accent" />
        </div>
      </motion.div>

      <h2 className="font-serif text-3xl md:text-4xl text-foreground">Booking Confirmed!</h2>
      <p className="font-sans text-muted-foreground mt-3 mb-2">
        Your reservation has been received. A confirmation email will be sent to{" "}
        <strong className="text-foreground">{guestInfo.email}</strong>.
      </p>

      {/* Reference */}
      <div className="inline-block bg-secondary rounded-lg px-6 py-3 mt-4 mb-8">
        <p className="font-sans text-xs uppercase tracking-wider text-muted-foreground">Booking Reference</p>
        <p className="font-serif text-2xl text-foreground tracking-wide">{bookingReference}</p>
      </div>

      {/* Summary card */}
      <div className="bg-card rounded-xl border border-border p-6 text-left">
        <h3 className="font-serif text-lg text-foreground mb-4">Stay Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-sans">
          <div>
            <p className="text-muted-foreground">Room</p>
            <p className="text-foreground font-medium">{selectedRoom?.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Guest</p>
            <p className="text-foreground font-medium">{guestInfo.fullName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Check-in</p>
            <p className="text-foreground font-medium">
              {search.checkIn ? format(search.checkIn, "dd/MM/yyyy") : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Check-out</p>
            <p className="text-foreground font-medium">
              {search.checkOut ? format(search.checkOut, "dd/MM/yyyy") : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Guests</p>
            <p className="text-foreground font-medium">
              {search.adults} Adult{search.adults !== 1 ? "s" : ""}
              {search.children > 0 && `, ${search.children} Child${search.children !== 1 ? "ren" : ""}`}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Total</p>
            <ConfirmationPrice amount={totalAmount} />
          </div>
        </div>

        {selectedAddOns.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Add-Ons</p>
            <div className="flex flex-wrap gap-2">
              {selectedAddOns.map((a) => (
                <span
                  key={a.id}
                  className="bg-secondary text-secondary-foreground text-xs font-sans px-3 py-1 rounded-full"
                >
                  {a.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
        <Button variant="outline" className="h-11 gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground" onClick={() => generateICS(state)}>
          <Calendar className="w-4 h-4" /> Add to Calendar
        </Button>
        <Button variant="outline" className="h-11 gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground" onClick={() => generatePDF(state)}>
          <Download className="w-4 h-4" /> Download PDF
        </Button>
        <Link to="/">
          <Button variant="outline" className="h-11 gap-2 w-full sm:w-auto border-accent text-accent hover:bg-accent hover:text-accent-foreground">
            <MessageCircle className="w-4 h-4" /> Chat with MJ
          </Button>
        </Link>
      </div>

      {/* Upsell */}
      <div className="mt-10 bg-accent/5 border border-accent/20 rounded-xl p-6">
        <p className="font-serif text-lg text-foreground">Upgrade Your Experience</p>
        <p className="font-sans text-sm text-muted-foreground mt-1">
          Looking for something extra? Add a spa package or romantic setup to make your stay unforgettable.
        </p>
        <p className="font-sans text-sm text-accent font-medium mt-2">Contact us for upgrade options.</p>
      </div>
    </motion.div>
  );
}