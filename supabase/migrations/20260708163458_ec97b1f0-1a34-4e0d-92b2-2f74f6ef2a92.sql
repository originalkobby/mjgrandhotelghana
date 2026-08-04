DO $$
DECLARE
  auto_status_job_id bigint;
BEGIN
  SELECT jobid INTO auto_status_job_id
  FROM cron.job
  WHERE jobname IN ('auto-status-every-15-min', 'auto-status-hourly', 'auto-status-daily')
  ORDER BY jobid
  LIMIT 1;

  IF auto_status_job_id IS NOT NULL THEN
    PERFORM cron.alter_job(
      auto_status_job_id,
      schedule := '0 * * * *',
      active := true
    );
  END IF;
END $$;