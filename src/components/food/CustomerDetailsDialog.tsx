import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveCustomer, type CustomerDetails } from "@/lib/customerDevice";

const schema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { message: "Please enter your full name" })
    .max(100, { message: "Name must be under 100 characters" }),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be under 255 characters" }),
  phone: z
    .string()
    .trim()
    .min(7, { message: "Please enter a valid phone number" })
    .max(20, { message: "Phone number is too long" })
    .regex(/^[0-9+()\s-]+$/, { message: "Phone number can only contain digits" }),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (details: CustomerDetails) => void;
};

export default function CustomerDetailsDialog({ open, onOpenChange, onSaved }: Props) {
  const [values, setValues] = useState<CustomerDetails>({ full_name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDetails, string>>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        full_name: fieldErrors.full_name?.[0],
        email: fieldErrors.email?.[0],
        phone: fieldErrors.phone?.[0],
      });
      return;
    }
    setErrors({});
    setSaving(true);
    const details = parsed.data as CustomerDetails;
    await saveCustomer(details);
    setSaving(false);
    onSaved(details);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Before you order</DialogTitle>
          <DialogDescription>
            Tell us who you are so we can confirm your order and keep you updated. We only ask once
            on this device.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="cd-name">Full name</Label>
            <Input
              id="cd-name"
              value={values.full_name}
              onChange={(e) => setValues((v) => ({ ...v, full_name: e.target.value }))}
              placeholder="Ama Mensah"
              maxLength={100}
              autoFocus
            />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cd-email">Email</Label>
            <Input
              id="cd-email"
              type="email"
              value={values.email}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
              placeholder="you@example.com"
              maxLength={255}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cd-phone">Phone</Label>
            <Input
              id="cd-phone"
              type="tel"
              value={values.phone}
              onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
              placeholder="+233 20 000 0000"
              maxLength={20}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving…" : "Continue to order"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
