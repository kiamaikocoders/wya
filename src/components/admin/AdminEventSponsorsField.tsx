import { useRef, useState } from 'react';
import { Loader2, Plus, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { prepareMediaForUpload } from '@/lib/media-upload-prepare';
import { uploadToR2 } from '@/lib/r2-upload';
import { sponsorService } from '@/lib/sponsor/sponsor-service';
import type { Sponsor } from '@/lib/sponsor/types';

type Props = {
  sponsorIds: number[];
  onChange: (ids: number[]) => void;
  catalog: Sponsor[];
  className?: string;
};

export function AdminEventSponsorsField({
  sponsorIds,
  onChange,
  catalog,
  className,
}: Props) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggle = (id: number) => {
    onChange(
      sponsorIds.includes(id)
        ? sponsorIds.filter((current) => current !== id)
        : [...sponsorIds, id],
    );
  };

  const uploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const prepared = await prepareMediaForUpload(file, 'event-image');
      const ext = prepared.name.split('.').pop() || 'png';
      const { publicUrl } = await uploadToR2({
        bucket: 'event-images',
        file: prepared,
        path: `sponsors/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`,
        contentType: prepared.type || 'image/png',
      });
      setLogoUrl(publicUrl);
      toast.success('Sponsor logo uploaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Logo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const createSponsor = async () => {
    if (!newName.trim()) {
      toast.error('Enter a sponsor name');
      return;
    }
    setSaving(true);
    try {
      const created = await sponsorService.createSponsor({
        name: newName,
        logo_url: logoUrl || null,
      });
      await queryClient.invalidateQueries({ queryKey: ['admin-sponsors-catalog'] });
      onChange([...sponsorIds, created.id]);
      setNewName('');
      setLogoUrl('');
      setCreating(false);
      toast.success(`${created.name} added and attached`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create sponsor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn('space-y-3 rounded-[12px] border border-border bg-[hsl(var(--admin-surface-2))] p-3.5', className)}>
      <div>
        <Label className="text-xs font-semibold">Sponsors on this event</Label>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Logos appear on the event card. First selected is the title sponsor. Create a new
          brand here if it is not in the catalog yet.
        </p>
      </div>

      {sponsorIds.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sponsorIds.map((id, index) => {
            const sponsor = catalog.find((row) => row.id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
              >
                {sponsor?.logo_url ? (
                  <img src={sponsor.logo_url} alt="" className="h-4 w-4 rounded-sm object-contain" />
                ) : null}
                {sponsor?.name || `Sponsor #${id}`}
                {index === 0 ? (
                  <span className="text-[10px] uppercase tracking-wide opacity-80">Title</span>
                ) : null}
                <button type="button" onClick={() => toggle(id)} aria-label="Remove sponsor">
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No sponsors attached yet.</p>
      )}

      {catalog.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {catalog.map((sponsor) => {
            const selected = sponsorIds.includes(sponsor.id);
            return (
              <button
                key={sponsor.id}
                type="button"
                onClick={() => toggle(sponsor.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold',
                  selected
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border bg-background text-muted-foreground',
                )}
              >
                {sponsor.logo_url ? (
                  <img src={sponsor.logo_url} alt="" className="h-4 w-4 rounded-sm object-contain" />
                ) : null}
                {sponsor.name}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Catalog is empty — add the first sponsor below so it can show on the card.
        </p>
      )}

      {creating ? (
        <div className="space-y-2 rounded-[10px] border border-dashed border-border bg-background p-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Brand name, e.g. Tusker"
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void uploadLogo(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
              {logoUrl ? 'Replace logo' : 'Upload logo'}
            </Button>
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-8 w-8 rounded object-contain" />
            ) : null}
            <Button type="button" size="sm" disabled={saving || uploading} onClick={() => void createSponsor()}>
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
              Save & attach
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add new sponsor
        </Button>
      )}
    </div>
  );
}
