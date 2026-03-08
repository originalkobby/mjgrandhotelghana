
-- Audit trail for booking status changes
CREATE TABLE public.booking_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  note text
);

ALTER TABLE public.booking_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.booking_audit_log
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'front_desk'::app_role)
    OR has_role(auth.uid(), 'revenue_manager'::app_role)
  );

CREATE POLICY "Admins can insert audit logs"
  ON public.booking_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'front_desk'::app_role)
  );
