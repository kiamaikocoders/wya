import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface CategoryRow {
  id: number;
  parent_id: number | null;
  order_index: number;
}

interface AddSubcategoryFieldProps {
  parentCategoryId: number;
  /** Current categories list (same query as parent) — used to pick next order_index */
  categories: CategoryRow[];
  /** Called with new row id so parent can select it for the event */
  onCreated?: (newCategoryId: number) => void;
}

export const AddSubcategoryField: React.FC<AddSubcategoryFieldProps> = ({
  parentCategoryId,
  categories,
  onCreated,
}) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const addMutation = useMutation({
    mutationFn: async (trimmed: string) => {
      const siblings = categories.filter((c) => c.parent_id === parentCategoryId);
      const nextOrder =
        siblings.length > 0 ? Math.max(...siblings.map((s) => s.order_index)) + 1 : 1;

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: trimmed,
          parent_id: parentCategoryId,
          order_index: nextOrder,
          icon: null,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data as { id: number };
    },
    onSuccess: async (data) => {
      setName('');
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.refetchQueries({ queryKey: ['categories'] });
      toast.success('Subcategory added');
      onCreated?.(data.id);
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Could not add subcategory';
      if (msg.includes('duplicate') || msg.includes('unique')) {
        toast.error('A subcategory with this name already exists under this category.');
      } else {
        toast.error(msg);
      }
    },
  });

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Enter a subcategory name');
      return;
    }
    addMutation.mutate(trimmed);
  };

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
      <p className="text-xs text-muted-foreground">Missing a tag? Add a subcategory under this group.</p>
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New subcategory name"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          disabled={addMutation.isPending}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={submit}
          disabled={addMutation.isPending}
        >
          {addMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
