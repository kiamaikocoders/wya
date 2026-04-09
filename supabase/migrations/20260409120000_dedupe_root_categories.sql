-- Deduplicate root category rows (same name, parent_id IS NULL).
-- UNIQUE(name, parent_id) does not prevent multiple (name, NULL) in PostgreSQL.
-- After merge, enforce uniqueness with a partial unique index.

DO $$
DECLARE
  r RECORD;
  keeper int;
  dup_id int;
  ch RECORD;
  existing_id int;
BEGIN
  FOR r IN
    SELECT name
    FROM public.categories
    WHERE parent_id IS NULL
    GROUP BY name
    HAVING COUNT(*) > 1
  LOOP
    SELECT c.id INTO keeper
    FROM public.categories c
    WHERE c.parent_id IS NULL AND c.name = r.name
    ORDER BY c.id ASC
    LIMIT 1;

    FOR dup_id IN
      SELECT c.id
      FROM public.categories c
      WHERE c.parent_id IS NULL AND c.name = r.name AND c.id != keeper
    LOOP
      FOR ch IN SELECT * FROM public.categories WHERE parent_id = dup_id
      LOOP
        SELECT k.id INTO existing_id
        FROM public.categories k
        WHERE k.parent_id = keeper AND k.name = ch.name
        LIMIT 1;

        IF existing_id IS NOT NULL THEN
          UPDATE public.events SET category_id = existing_id WHERE category_id = ch.id;
          IF EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'event_categories'
          ) THEN
            UPDATE public.event_categories SET category_id = existing_id WHERE category_id = ch.id;
          END IF;
          DELETE FROM public.categories WHERE id = ch.id;
        ELSE
          UPDATE public.categories SET parent_id = keeper WHERE id = ch.id;
        END IF;
      END LOOP;

      UPDATE public.events SET category_id = keeper WHERE category_id = dup_id;
      IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'event_categories'
      ) THEN
        UPDATE public.event_categories SET category_id = keeper WHERE category_id = dup_id;
      END IF;

      DELETE FROM public.categories WHERE id = dup_id;
    END LOOP;
  END LOOP;
END $$;

-- Remove duplicate (event_id, category_id) rows after merges (if junction table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'event_categories'
  ) THEN
    DELETE FROM public.event_categories ec
    WHERE ec.ctid IN (
      SELECT ctid
      FROM (
        SELECT ctid,
               row_number() OVER (
                 PARTITION BY event_id, category_id
                 ORDER BY ctid
               ) AS rn
        FROM public.event_categories
      ) t
      WHERE t.rn > 1
    );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS categories_root_name_unique
  ON public.categories (name)
  WHERE parent_id IS NULL;
