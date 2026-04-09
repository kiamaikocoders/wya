/**
 * Build parent → subcategory list for admin UI.
 *
 * Duplicate root rows (same name, parent_id IS NULL) are allowed in PostgreSQL
 * because UNIQUE(name, parent_id) treats each NULL parent_id as distinct.
 * This merges those roots into one accordion per name and unions subcategories.
 */
export function organizeEventCategoryParents<
  T extends {
    id: number;
    name: string;
    parent_id: number | null;
    icon: string | null;
    order_index: number;
  },
>(categories: T[]): Array<T & { subcategories: T[] }> {
  const roots = categories.filter((c) => c.parent_id === null);
  const byName = new Map<string, T[]>();
  for (const root of roots) {
    const arr = byName.get(root.name) ?? [];
    arr.push(root);
    byName.set(root.name, arr);
  }

  const result: Array<T & { subcategories: T[] }> = [];

  for (const group of byName.values()) {
    group.sort((a, b) => a.id - b.id);
    const canonical = group[0];
    const rootIds = new Set(group.map((g) => g.id));

    const subcategories = categories
      .filter((c) => c.parent_id != null && rootIds.has(c.parent_id))
      .sort(
        (a, b) =>
          a.order_index - b.order_index || a.name.localeCompare(b.name),
      );

    result.push({
      ...canonical,
      subcategories,
    });
  }

  result.sort(
    (a, b) => a.order_index - b.order_index || a.name.localeCompare(b.name),
  );

  return result;
}
