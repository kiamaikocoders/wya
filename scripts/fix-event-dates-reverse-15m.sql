-- Reverse demo bulk shift: event dates were advanced by 15 months
-- (see wya-native/todo.md — "Updated all 216 event dates to future (added 15 months)").
-- Scope: calendar year 2027 only. Safe to re-run: second run affects 0 rows.

-- Preview:
-- SELECT id, title, date::date AS current_date,
--        (date - INTERVAL '15 months')::date AS restored_date
-- FROM events
-- WHERE EXTRACT(YEAR FROM date::date) = 2027
-- ORDER BY date DESC;

UPDATE public.events
SET
  date = date - INTERVAL '15 months',
  end_date = CASE
    WHEN end_date IS NOT NULL THEN end_date - INTERVAL '15 months'
    ELSE NULL
  END,
  updated_at = now()
WHERE EXTRACT(YEAR FROM date::date) = 2027;

-- Verify:
-- SELECT EXTRACT(YEAR FROM date::date)::int AS y, COUNT(*)::int AS n
-- FROM events WHERE status = 'approved' GROUP BY 1 ORDER BY 1;
-- SELECT id, title, date::date FROM events WHERE id IN (9, 125, 204) ORDER BY id;
