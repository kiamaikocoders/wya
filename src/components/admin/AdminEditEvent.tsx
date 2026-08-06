import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminService, AdminEvent } from '@/lib/admin-service';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import LocationPicker from '@/components/maps/LocationPicker';
import { googleMapsDirectionsUrl } from '@/lib/location-service';
import { AddSubcategoryField } from '@/components/admin/AddSubcategoryField';
import { organizeEventCategoryParents } from '@/lib/category-hierarchy';
import { prepareMediaForUpload } from '@/lib/media-upload-prepare';
import { uploadToR2 } from '@/lib/r2-upload';
import { AdminAiWriteButton } from '@/components/admin/AdminAiAssist';
import { draftEventDescription } from '@/lib/admin-ai-analysis';
import {
  EventTicketTiersEditor,
  createEmptyTicketTier,
  type TicketTierDraft,
} from '@/components/admin/EventTicketTiersEditor';
import {
  fetchEventTicketTypes,
  lowestTierPrice,
  replaceEventTicketTypes,
} from '@/lib/event-ticket-types';
import {
  updateEventWithSeriesScope,
  type SeriesEditScope,
} from '@/lib/event-series-service';
import { cn } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  icon: string | null;
  order_index: number;
}

const categories = ['Business', 'Culture', 'Sports', 'Music', 'Technology', 'Education', 'Social', 'Other'];
interface AdminEditEventProps {
  event: AdminEvent;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AdminEditEvent: React.FC<AdminEditEventProps> = ({ event, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: event.title || '',
    description: event.description || '',
    category: event.category || '',
    category_id: null as number | null,
    category_ids: [] as number[], // Multiple categories
    date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
    end_date: event.end_date ? String(event.end_date).slice(0, 10) : '',
    time: event.time || '',
    location: event.location || '',
    latitude: (event as any).latitude ?? null,
    longitude: (event as any).longitude ?? null,
    location_url: (event as any).location_url || '',
    image_url: event.image_url || '',
    price: event.price || 0,
    capacity: event.capacity || 0,
    tags: [] as string[],
    performing_artists: [] as string[],
    ticket_link: (event as any).ticket_link || '',
    featured: event.featured || false,
  });
  
  const [tagsInput, setTagsInput] = useState('');
  const [artistsInput, setArtistsInput] = useState('');
  const [editScope, setEditScope] = useState<SeriesEditScope>('this');
  const [ticketTiers, setTicketTiers] = useState<TicketTierDraft[]>([
    createEmptyTicketTier('Regular', event.price || 0),
  ]);
  const [tiersLoaded, setTiersLoaded] = useState(false);
  const isSeriesEvent = Boolean(event.series_id);

  // Fetch categories from database
  const { data: categoriesData = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await (supabase as any)
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Category[];
    },
  });

  // Organize categories hierarchically (merge duplicate root rows by name)
  const organizedCategories = useMemo(
    () => organizeEventCategoryParents(categoriesData),
    [categoriesData],
  );

  // Fetch existing event categories from junction table
  const { data: existingEventCategories = [] } = useQuery({
    queryKey: ['event-categories', event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_categories')
        .select('category_id')
        .eq('event_id', event.id);
      
      if (error) {
        console.error('Error fetching event categories:', error);
        return [];
      }
      return (data || []).map((ec: any) => ec.category_id) as number[];
    },
    enabled: !!event.id,
  });

  // Initialize category_ids from existing event categories
  useEffect(() => {
    if (existingEventCategories.length > 0 && formData.category_ids.length === 0) {
      setFormData(prev => ({
        ...prev,
        category_ids: existingEventCategories,
        category_id: existingEventCategories[0] || null,
      }));
    } else if (event.category_id && formData.category_ids.length === 0) {
      // Fallback: use category_id from event if junction table is empty
      setFormData(prev => ({
        ...prev,
        category_ids: event.category_id ? [event.category_id] : [],
        category_id: event.category_id || null,
      }));
    }
  }, [existingEventCategories, event.category_id]);

  useEffect(() => {
    if (event.image_url) {
      setPreviewUrl(event.image_url);
    }
  }, [event]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchEventTicketTypes(event.id);
        if (cancelled) return;
        if (rows.length > 0) {
          setTicketTiers(
            rows.map((r) => ({
              key: `tier-${r.id}`,
              name: r.name,
              price: Number(r.price) || 0,
              capacity: r.capacity ?? '',
            })),
          );
        } else {
          setTicketTiers([createEmptyTicketTier('Regular', event.price || 0)]);
        }
      } catch (err) {
        console.warn('Failed to load ticket types', err);
        if (!cancelled) {
          setTicketTiers([createEmptyTicketTier('Regular', event.price || 0)]);
        }
      } finally {
        if (!cancelled) setTiersLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [event.id, event.price]);

  const syncPriceFromTiers = (tiers: TicketTierDraft[]) => {
    setTicketTiers(tiers);
    setFormData((prev) => ({ ...prev, price: lowestTierPrice(tiers) }));
  };

  // Get selected category names for display
  const selectedCategoryNames = useMemo(() => {
    if (formData.category_ids.length === 0) return [];
    return formData.category_ids
      .map(id => categoriesData.find(c => c.id === id)?.name)
      .filter(Boolean) as string[];
  }, [formData.category_ids, categoriesData]);

  // Toggle category selection
  const toggleCategory = (categoryId: number) => {
    setFormData(prev => {
      const categoryIds = prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId];
      
      // Also update category_id to first selected (for backward compatibility)
      const category_id = categoryIds.length > 0 ? categoryIds[0] : null;
      const selectedCategory = categoriesData.find(c => c.id === category_id);
      
      return {
        ...prev,
        category_ids: categoryIds,
        category_id,
        category: selectedCategory?.name || prev.category,
      };
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price' || name === 'capacity') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === 'featured') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (tagsInput.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagsInput.trim()]
      }));
      setTagsInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddArtist = () => {
    if (artistsInput.trim()) {
      setFormData(prev => ({
        ...prev,
        performing_artists: [...prev.performing_artists, artistsInput.trim()]
      }));
      setArtistsInput('');
    }
  };

  const handleRemoveArtist = (artistToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      performing_artists: prev.performing_artists.filter(artist => artist !== artistToRemove)
    }));
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const prepared = await prepareMediaForUpload(file, 'event-image');
      const fileExt = prepared.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const { publicUrl } = await uploadToR2({
        bucket: 'event-images',
        file: prepared,
        path: `event-images/${fileName}`,
        contentType: prepared.type || 'image/jpeg',
      });

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      setPreviewUrl(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    handleFileUpload(file);
  };

  const updateEventMutation = useMutation({
    mutationFn: async (vars: {
      eventData: any;
      categoryIds: number[];
      scope: SeriesEditScope;
      ticketTiers: TicketTierDraft[];
    }) => {
      const { eventData, categoryIds, scope, ticketTiers: tiers } = vars;
      const result = await updateEventWithSeriesScope({
        eventId: event.id,
        eventData,
        categoryIds,
        scope: isSeriesEvent ? scope : 'this',
      });
      // Persist tiers for every occurrence that was updated
      for (const id of result.updatedIds) {
        await replaceEventTicketTypes(id, tiers);
      }
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-events-figma'] });
      queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
      queryClient.invalidateQueries({ queryKey: ['event-categories', event.id] });
      queryClient.invalidateQueries({ queryKey: ['event-ticket-types', event.id] });
      const n = result.updatedIds.length;
      toast.success(
        result.scope === 'this'
          ? 'Event updated successfully'
          : `Updated ${n} occurrence${n === 1 ? '' : 's'} in the series`,
      );
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Error updating event:', error);
      toast.error(error.message || 'Failed to update event');
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter an event title');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Please enter an event description');
      return;
    }
    
    if (formData.category_ids.length === 0) {
      toast.error('Please select at least one category');
      return;
    }
    
    if (!formData.date) {
      toast.error('Please set an event date');
      return;
    }

    if (!ticketTiers.length || ticketTiers.some((t) => !t.name.trim())) {
      toast.error('Each ticket type needs a name');
      return;
    }

    setIsSubmitting(true);
    
    // Get category ID from first selected category_id
    let categoryId = formData.category_id;
    if (formData.category_ids.length > 0) {
      categoryId = formData.category_ids[0];
    }
    
    // Remove category_ids from the data being sent to the events table.
    // Always include latitude/longitude (including null) so admins can clear an existing pin.
    const { category_ids, ...eventDataWithoutCategoryIds } = formData;
    (eventDataWithoutCategoryIds as any).latitude = formData.latitude;
    (eventDataWithoutCategoryIds as any).longitude = formData.longitude;
    
    const eventData = {
      ...eventDataWithoutCategoryIds,
      category_id: categoryId, // Set category_id to first selected category
      price: lowestTierPrice(ticketTiers),
      date: new Date(formData.date).toISOString(),
      end_date: formData.end_date && formData.end_date >= formData.date ? formData.end_date : null,
      time: formData.time && formData.time.trim() ? formData.time.trim() : undefined,
    };
    
    updateEventMutation.mutate({
      eventData,
      categoryIds: formData.category_ids,
      scope: editScope,
      ticketTiers,
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
          {isSeriesEvent ? (
            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Series edit scope</h3>
                <p className="text-xs text-muted-foreground">
                  {event.series?.summary || 'Recurring series'} · date changes always apply to this
                  occurrence only
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    {
                      value: 'this' as const,
                      label: 'This occurrence',
                      hint: 'Only this date',
                    },
                    {
                      value: 'future' as const,
                      label: 'This & future',
                      hint: 'From this date onward',
                    },
                    {
                      value: 'all' as const,
                      label: 'Entire series',
                      hint: 'All dates in the series',
                    },
                  ] as const
                ).map((opt) => {
                  const active = editScope === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditScope(opt.value)}
                      className={cn(
                        'rounded-[10px] border px-3 py-2.5 text-left transition-colors',
                        active
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-background hover:bg-muted/40',
                      )}
                    >
                      <p
                        className={cn(
                          'text-[13px] font-semibold',
                          active ? 'text-primary' : 'text-foreground',
                        )}
                      >
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{opt.hint}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter event title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="description">Description *</Label>
                <AdminAiWriteButton
                  label={formData.description.trim() ? 'Enhance with AI' : 'Write with AI'}
                  disabled={!formData.title.trim()}
                  needHint="Enter an event title first"
                  run={() =>
                    draftEventDescription({
                      title: formData.title.trim(),
                      location: formData.location || undefined,
                      date: formData.date || undefined,
                      category: selectedCategoryNames.join(', ') || undefined,
                      existing: formData.description,
                    })
                  }
                  onResult={(text) =>
                    setFormData((prev) => ({ ...prev, description: text }))
                  }
                />
              </div>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your event or Write with AI"
                rows={4}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categories *</Label>
                {selectedCategoryNames.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedCategoryNames.map((name, idx) => {
                      const categoryId = formData.category_ids[idx];
                      return (
                        <Badge key={categoryId} variant="secondary" className="flex items-center gap-1">
                          {name}
                          <button
                            type="button"
                            onClick={() => toggleCategory(categoryId)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                ) : null}
                <Accordion type="multiple" className="w-full border rounded-lg">
                  {organizedCategories.map((parentCategory) => (
                    <AccordionItem key={parentCategory.id} value={`parent-${parentCategory.id}`} className="border-b">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          {parentCategory.icon && <span>{parentCategory.icon}</span>}
                          <span className="font-medium">{parentCategory.name}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-2">
                        <div className="space-y-2">
                          {parentCategory.subcategories.map((subcategory) => (
                            <div key={subcategory.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`category-${subcategory.id}`}
                                checked={formData.category_ids.includes(subcategory.id)}
                                onCheckedChange={() => toggleCategory(subcategory.id)}
                              />
                              <label
                                htmlFor={`category-${subcategory.id}`}
                                className="text-sm font-normal cursor-pointer flex-1"
                              >
                                {subcategory.name}
                              </label>
                            </div>
                          ))}
                          <AddSubcategoryField
                            parentCategoryId={parentCategory.id}
                            categories={categoriesData}
                            onCreated={(id) => toggleCategory(id)}
                          />
                          {/* Also allow selecting parent category directly */}
                          <div className="flex items-center space-x-2 pt-1 border-t border-white/10">
                            <Checkbox
                              id={`category-${parentCategory.id}`}
                              checked={formData.category_ids.includes(parentCategory.id)}
                              onCheckedChange={() => toggleCategory(parentCategory.id)}
                            />
                            <label
                              htmlFor={`category-${parentCategory.id}`}
                              className="text-sm font-medium text-gradient-orange-accent cursor-pointer flex-1"
                            >
                              All {parentCategory.name}
                            </label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Location</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Search for a location in Kenya. This pins the event on the map.
                </p>
                <LocationPicker
                  onLocationSelect={(loc) => {
                    setFormData(prev => ({
                      ...prev,
                      location: loc.address,
                      latitude: loc.latitude,
                      longitude: loc.longitude,
                      location_url:
                        prev.location_url.trim() ||
                        googleMapsDirectionsUrl(loc.latitude, loc.longitude, loc.address),
                    }));
                  }}
                  onLocationClear={() => {
                    setFormData((prev) => ({
                      ...prev,
                      latitude: null,
                      longitude: null,
                    }));
                  }}
                  initialLocation={
                    formData.latitude != null && formData.longitude != null
                      ? { address: formData.location, latitude: formData.latitude, longitude: formData.longitude }
                      : undefined
                  }
                  height={280}
                  mode="event"
                  compact
                />

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        latitude: null,
                        longitude: null,
                      }));
                      toast.success('Pinned location cleared. Save changes to apply.');
                    }}
                  >
                    Clear pinned location
                  </Button>
                </div>

                <div className="space-y-2 pt-3">
                  <Label htmlFor="location">Location name/address</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Jifunze International, Nairobi"
                  />
                  <p className="text-xs text-muted-foreground">
                    If the search can’t find the exact venue, you can manually edit the location text shown to users.
                  </p>
                </div>

                <div className="space-y-2 pt-3">
                  <Label htmlFor="location_url">Manual location link (optional)</Label>
                  <Input
                    id="location_url"
                    name="location_url"
                    value={formData.location_url}
                    onChange={handleInputChange}
                    placeholder="Paste a maps link (Google, Apple, Mapbox, etc.)"
                    inputMode="url"
                  />
                  <p className="text-xs text-muted-foreground">
                    If search can’t find the exact venue, paste a maps link here so users can get directions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Scheduling</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">From (date) *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">To (date, optional)</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  min={formData.date || undefined}
                  value={formData.end_date || ''}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground">Leave empty for single-day events</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {tiersLoaded ? (
              <EventTicketTiersEditor
                tiers={ticketTiers}
                onChange={syncPriceFromTiers}
              />
            ) : (
              <p className="text-xs text-muted-foreground">Loading ticket types…</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* price field replaced by EventTicketTiersEditor */}
              <div className="hidden" aria-hidden>
                <Input id="price" name="price" type="hidden" value={formData.price || 0} readOnly />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="0"
                  value={formData.capacity || ''}
                  onChange={handleInputChange}
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket_link">External Ticket Link</Label>
                <Input
                  id="ticket_link"
                  name="ticket_link"
                  type="url"
                  value={formData.ticket_link}
                  onChange={handleInputChange}
                  placeholder="https://eventbrite.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Users will be redirected here when clicking "Get Tickets"
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="featured">Featured Event</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    id="featured"
                    name="featured"
                    type="checkbox"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">
                    Feature this event on the homepage
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Event Image</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Upload Image</Label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="image-upload"
                      disabled={isUploading}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={isUploading}
                      onClick={() => document.getElementById('image-upload')?.click()}
                      className="w-full sm:w-auto"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </>
                      )}
                    </Button>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Or Enter Image URL</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => {
                    handleInputChange(e);
                    setPreviewUrl(e.target.value);
                  }}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              {previewUrl && (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-64 object-cover" 
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setPreviewUrl(null);
                      setFormData(prev => ({ ...prev, image_url: '' }));
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Additional Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Add event tags"
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Add
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <div 
                      key={index} 
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      <span>{tag}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="artists">Performing Artists</Label>
              <div className="flex gap-2">
                <Input
                  id="artists"
                  value={artistsInput}
                  onChange={(e) => setArtistsInput(e.target.value)}
                  placeholder="Add performing artist name"
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddArtist();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddArtist} variant="outline">
                  Add
                </Button>
              </div>
              
              {formData.performing_artists.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.performing_artists.map((artist, index) => (
                    <div 
                      key={index} 
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      <span>{artist}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveArtist(artist)}
                        className="hover:text-destructive focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || isUploading || updateEventMutation.isPending}>
              {isSubmitting || updateEventMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : isSeriesEvent && editScope === 'future' ? (
                'Update this & future'
              ) : isSeriesEvent && editScope === 'all' ? (
                'Update entire series'
              ) : (
                'Update Event'
              )}
            </Button>
          </div>
        </form>
    </div>
  );
};

export default AdminEditEvent;
