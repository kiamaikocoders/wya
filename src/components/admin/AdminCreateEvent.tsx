import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Loader2, Check, ChevronDown, Search, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminService } from '@/lib/admin-service';
import { notificationService } from '@/lib/notification/notification-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { googleMapsDirectionsUrl } from '@/lib/location-service';
import LocationPicker from '@/components/maps/LocationPicker';
import { organizeEventCategoryParents } from '@/lib/category-hierarchy';
import {
  prepareMediaForUpload,
  STORAGE_CACHE_CONTROL_IMMUTABLE,
} from '@/lib/media-upload-prepare';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { AdminAiWriteButton } from '@/components/admin/AdminAiAssist';
import { draftEventDescription, draftWhatToExpect } from '@/lib/admin-ai-analysis';

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  icon: string | null;
  order_index: number;
}

interface AdminCreateEventProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type Step = 1 | 2 | 3 | 4;

const STEP_META: Record<
  Step,
  { title: string; blurb: string; subtitle: string; nextLabel: string }
> = {
  1: {
    title: 'Event',
    blurb: 'Basics & location',
    subtitle: 'Basic information, categories, and location pin',
    nextLabel: 'Next · Access →',
  },
  2: {
    title: 'Access',
    blurb: 'Pricing & capacity',
    subtitle: 'Pricing, capacity, and organizer',
    nextLabel: 'Next · Content →',
  },
  3: {
    title: 'Content',
    blurb: 'Description & media',
    subtitle: 'Description, cover media, and event details',
    nextLabel: 'Next · Publish →',
  },
  4: {
    title: 'Publish',
    blurb: 'Review & go live',
    subtitle: 'Review details and publish',
    nextLabel: 'Publish event',
  },
};

const fieldClass =
  'h-11 rounded-[10px] border-border bg-[hsl(var(--admin-surface-2))] text-[13px]';
const surfaceCard =
  'rounded-xl border border-border bg-[hsl(var(--admin-surface))]';

const AdminCreateEvent: React.FC<AdminCreateEventProps> = ({ onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [organizerSearch, setOrganizerSearch] = useState('');
  const [requireApproval, setRequireApproval] = useState(false);
  const [useExternalTicket, setUseExternalTicket] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    category_id: null as number | null,
    category_ids: [] as number[],
    date: '',
    end_date: '' as string,
    time: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    location_url: '',
    image_url: '',
    price: 0,
    capacity: 0,
    tags: [] as string[],
    performing_artists: [] as string[],
    ticket_link: '',
    featured: false,
    organizer_id: null as string | null,
    status: 'approved' as 'pending' | 'approved' | 'rejected',
  });

  const [tagsInput, setTagsInput] = useState('');
  const [whatToExpect, setWhatToExpect] = useState('');

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

  const organizedCategories = useMemo(
    () => organizeEventCategoryParents(categoriesData),
    [categoriesData],
  );

  const selectedCategoryNames = useMemo(() => {
    if (!formData.category_ids?.length) return [];
    return formData.category_ids
      .map((id) => categoriesData.find((c) => c.id === id)?.name || null)
      .filter((name): name is string => name !== null);
  }, [formData.category_ids, categoriesData]);

  const toggleCategory = (categoryId: number) => {
    setFormData((prev) => {
      const categoryIds = prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter((id) => id !== categoryId)
        : [...prev.category_ids, categoryId];
      const category_id = categoryIds.length > 0 ? categoryIds[0] : null;
      const selectedCategory = categoriesData.find((c) => c.id === category_id);
      return {
        ...prev,
        category_ids: categoryIds,
        category_id,
        category: selectedCategory?.name || prev.category,
      };
    });
  };

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-for-organizer', organizerSearch],
    queryFn: () =>
      adminService.getUsers({
        page: 1,
        pageSize: 50,
        search: organizerSearch,
        role: 'all',
        status: 'all',
      }),
  });

  const progressPct = Math.round((currentStep / 4) * 100);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'price' || name === 'capacity') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const syncWhatToExpect = (text: string) => {
    setWhatToExpect(text);
    const lines = text
      .split('\n')
      .map((l) => l.replace(/^[\s•\-]+/, '').trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, performing_artists: lines }));
  };

  const handleAddTag = () => {
    if (tagsInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagsInput.trim()],
      }));
      setTagsInput('');
      setAddingTag(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleFileUpload = async (file: File, asGallery = false) => {
    setIsUploading(true);
    try {
      const prepared = await prepareMediaForUpload(file, 'event-image');
      const fileExt = prepared.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const bucket = 'event-images';
      const folder = 'event-images';
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, prepared, {
        cacheControl: STORAGE_CACHE_CONTROL_IMMUTABLE,
        upsert: false,
      });

      let publicUrl: string;

      if (uploadError) {
        if (
          uploadError.message.includes('Bucket not found') ||
          uploadError.message.includes('new row violates')
        ) {
          const fallbackBucket = 'event-media';
          const fallbackPath = `events/${fileName}`;
          const { error: fallbackError } = await supabase.storage
            .from(fallbackBucket)
            .upload(fallbackPath, prepared, {
              cacheControl: STORAGE_CACHE_CONTROL_IMMUTABLE,
              upsert: false,
            });
          if (fallbackError) throw fallbackError;
          publicUrl = supabase.storage.from(fallbackBucket).getPublicUrl(fallbackPath).data.publicUrl;
        } else {
          throw uploadError;
        }
      } else {
        publicUrl = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
      }

      if (asGallery) {
        setGalleryUrls((prev) => [...prev, publicUrl]);
        if (!formData.image_url) {
          setFormData((prev) => ({ ...prev, image_url: publicUrl }));
          setPreviewUrl(publicUrl);
        }
      } else {
        setFormData((prev) => ({ ...prev, image_url: publicUrl }));
        setPreviewUrl(publicUrl);
      }
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, asGallery = false) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    void handleFileUpload(file, asGallery);
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          toast.error('Please enter an event title');
          return false;
        }
        if (formData.category_ids.length === 0) {
          toast.error('Please select at least one category');
          return false;
        }
        if (!formData.date) {
          toast.error('Please set an event date');
          return false;
        }
        if (
          !formData.location.trim() ||
          formData.latitude == null ||
          formData.longitude == null ||
          !Number.isFinite(formData.latitude) ||
          !Number.isFinite(formData.longitude)
        ) {
          toast.error('Please set and confirm the event location on the map');
          return false;
        }
        return true;
      case 2:
        return true;
      case 3:
        if (!formData.description.trim()) {
          toast.error('Please enter an event description');
          return false;
        }
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const createEventMutation = useMutation({
    mutationFn: async (vars: { eventData: any; categoryIds: number[] }) => {
      const { eventData } = vars;
      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            ...eventData,
            organizer_id: eventData.organizer_id || null,
            status: 'approved',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data, vars) => {
      const categoryIds = vars?.categoryIds || [];
      try {
        await supabase.from('event_categories').delete().eq('event_id', data.id);
        if (categoryIds.length > 0) {
          const rows = categoryIds.map((category_id) => ({ event_id: data.id, category_id }));
          const { error: insertError } = await supabase.from('event_categories').insert(rows);
          if (insertError) throw insertError;
        }
      } catch (catError: any) {
        console.error('Failed to persist event categories:', catError);
        toast.error(catError?.message || 'Event created, but categories failed to save');
      }

      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });

      try {
        const { data: allUsers } = await supabase.from('profiles').select('id').limit(100);
        if (allUsers && allUsers.length > 0) {
          await Promise.all(
            allUsers.map((userProfile) =>
              notificationService.createNotification({
                user_id: userProfile.id,
                type: 'new_event',
                title: '🎉 New Event Posted!',
                message: `"${data.title}" was just posted. Check it out!`,
                resource_id: data.id,
                resource_type: 'event',
                link: `/events/${data.id}`,
                data: {
                  event_id: data.id,
                  event_title: data.title,
                },
              }),
            ),
          );
        }
      } catch (notifError) {
        console.warn('Failed to send event notifications:', notifError);
      }

      toast.success('Event created successfully! Users will be notified.');
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Error creating event:', error);
      toast.error(error.message || 'Failed to create event');
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    if (!formData.image_url && formData.category) {
      const defaultImages = {
        Business: 'https://images.unsplash.com/photo-1676372971824-ed498ef0db5f?q=80&w=2070',
        Culture: 'https://images.unsplash.com/photo-1529154045759-34c09aed3b73?q=80&w=2070',
        Sports: 'https://images.unsplash.com/photo-1474224017046-182ece80b263?q=80&w=2070',
        Music: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070',
        Technology: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072',
        default: 'https://images.unsplash.com/photo-1433622070098-754fdf81c929?q=80&w=2070',
      };
      const imageUrl =
        defaultImages[formData.category as keyof typeof defaultImages] || defaultImages.default;
      formData.image_url = imageUrl;
    }

    setIsSubmitting(true);

    let categoryName = formData.category;
    let categoryId = formData.category_id;
    if (formData.category_ids.length > 0) {
      const firstCategoryId = formData.category_ids[0];
      const selectedCategory = categoriesData.find((c) => c.id === firstCategoryId);
      categoryName = selectedCategory?.name || categoryName;
      categoryId = firstCategoryId;
    }

    const { category_ids, category_id, ...eventDataWithoutCategoryIds } = formData;

    const eventData = {
      ...eventDataWithoutCategoryIds,
      category: categoryName,
      category_id: categoryId,
      ticket_link: useExternalTicket ? formData.ticket_link : '',
      date: new Date(formData.date).toISOString(),
      end_date: formData.end_date && formData.end_date >= formData.date ? formData.end_date : null,
      time: formData.time && formData.time.trim() ? formData.time.trim() : '18:00:00',
      latitude: formData.latitude,
      longitude: formData.longitude,
      location_url:
        formData.location_url.trim() ||
        (formData.latitude != null && formData.longitude != null
          ? googleMapsDirectionsUrl(formData.latitude, formData.longitude, formData.location)
          : ''),
    };

    createEventMutation.mutate({ eventData, categoryIds: formData.category_ids });
  };

  const whenLabel = (() => {
    if (!formData.date) return 'Not set';
    try {
      const d = format(parseISO(formData.date.length === 10 ? `${formData.date}T12:00:00` : formData.date), 'MMM d, yyyy');
      return formData.time ? `${d} · ${formData.time.slice(0, 5)}` : d;
    } catch {
      return formData.date;
    }
  })();

  const organizerName =
    formData.organizer_id
      ? usersData?.data.find((u) => u.id === formData.organizer_id)?.name || 'Unknown'
      : '';

  const renderStepper = () => (
    <div className={cn(surfaceCard, 'w-full px-[18px] py-3.5')}>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-muted-foreground">Progress</span>
        <span className="font-bold text-primary">{progressPct}%</span>
      </div>
      <Progress value={progressPct} className="mb-3 h-1.5" />
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {([1, 2, 3, 4] as Step[]).map((n, i) => {
          const done = currentStep > n;
          const active = currentStep === n;
          return (
            <React.Fragment key={n}>
              {i > 0 ? (
                <div
                  className={cn(
                    'hidden h-0.5 w-7 shrink-0 sm:block',
                    currentStep > n - 1 ? 'bg-primary' : 'bg-border',
                  )}
                />
              ) : null}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[11px] font-bold',
                    done || active
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-[hsl(var(--admin-surface-2))] text-muted-foreground',
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : n}
                </div>
                <div className="hidden sm:block">
                  <p
                    className={cn(
                      'text-[13px]',
                      active ? 'font-semibold text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {STEP_META[n].title}
                  </p>
                  {currentStep === 1 ? (
                    <p className="text-[11px] text-muted-foreground">{STEP_META[n].blurb}</p>
                  ) : null}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={cn(surfaceCard, 'flex flex-col gap-3.5 p-[18px]')}>
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold">
                  Event title *
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Warehouse Techno Night"
                  className={fieldClass}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Categories *</Label>
                <Popover open={categoriesOpen} onOpenChange={setCategoriesOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        fieldClass,
                        'flex w-full items-center justify-between px-3 text-left font-normal',
                      )}
                    >
                      <span
                        className={cn(
                          'truncate',
                          selectedCategoryNames.length === 0 && 'text-muted-foreground',
                        )}
                      >
                        {selectedCategoryNames.length === 0
                          ? 'Select categories…'
                          : selectedCategoryNames.length <= 2
                            ? selectedCategoryNames.join(', ')
                            : `${selectedCategoryNames.length} categories selected`}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-80 max-h-72 overflow-y-auto p-2 sm:w-96"
                  >
                    {organizedCategories.map((parent) => (
                      <div key={parent.id} className="mb-2 last:mb-0">
                        <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {parent.icon ? `${parent.icon} ` : ''}
                          {parent.name}
                        </p>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-[hsl(var(--admin-surface-2))]">
                          <Checkbox
                            checked={formData.category_ids.includes(parent.id)}
                            onCheckedChange={() => toggleCategory(parent.id)}
                          />
                          <span>All {parent.name}</span>
                        </label>
                        {parent.subcategories.map((sub) => (
                          <label
                            key={sub.id}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 pl-4 text-[13px] hover:bg-[hsl(var(--admin-surface-2))]"
                          >
                            <Checkbox
                              checked={formData.category_ids.includes(sub.id)}
                              onCheckedChange={() => toggleCategory(sub.id)}
                            />
                            <span>{sub.name}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                    {organizedCategories.length === 0 ? (
                      <p className="px-2 py-3 text-xs text-muted-foreground">No categories found</p>
                    ) : null}
                  </PopoverContent>
                </Popover>
                {formData.category_ids.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.category_ids.map((id) => {
                      const name = categoriesData.find((c) => c.id === id)?.name;
                      if (!name) return null;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleCategory(id)}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary"
                        >
                          {name}
                          <X className="h-3 w-3" />
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs font-semibold">
                    From date *
                  </Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className={fieldClass}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end_date" className="text-xs font-semibold">
                    To date
                  </Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    min={formData.date || undefined}
                    value={formData.end_date || ''}
                    onChange={handleInputChange}
                    className={fieldClass}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="time" className="text-xs font-semibold">
                  Start time
                </Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className={cn(surfaceCard, 'flex flex-col gap-2.5 p-4')}>
              <Label className="text-xs font-semibold">Location *</Label>
              <p className="text-xs text-muted-foreground">
                Search, use GPS, or tap the map — then Confirm.
              </p>
              <LocationPicker
                mode="event"
                compact
                height={440}
                title=""
                description=""
                onLocationSelect={(loc) => {
                  setFormData((prev) => ({
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
                    location: '',
                    latitude: null,
                    longitude: null,
                  }));
                }}
                initialLocation={
                  formData.latitude != null && formData.longitude != null && formData.location
                    ? {
                        address: formData.location,
                        latitude: formData.latitude,
                        longitude: formData.longitude,
                      }
                    : undefined
                }
              />
              <p className="text-[11px] text-muted-foreground">
                {formData.location && formData.latitude != null
                  ? `Confirm a pin before continuing · ${formData.location}`
                  : 'Confirm a pin before continuing'}
              </p>
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="location_url" className="text-xs font-semibold">
                  Manual maps link (optional)
                </Label>
                <Input
                  id="location_url"
                  name="location_url"
                  value={formData.location_url}
                  onChange={handleInputChange}
                  placeholder="Paste Google / Apple Maps link"
                  inputMode="url"
                  className={fieldClass}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={cn(surfaceCard, 'flex w-full flex-col gap-3.5 p-5')}>
            <h3 className="text-base font-bold text-foreground">Access & pricing</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs font-semibold">
                  Ticket price (KES)
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.price || ''}
                  onChange={handleInputChange}
                  placeholder="0 for free"
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="capacity" className="text-xs font-semibold">
                  Capacity
                </Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="0"
                  value={formData.capacity || ''}
                  onChange={handleInputChange}
                  placeholder="Unlimited if empty"
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Organizer</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search organizer…"
                    value={
                      formData.organizer_id && organizerName
                        ? organizerName
                        : organizerSearch
                    }
                    onChange={(e) => {
                      if (formData.organizer_id) {
                        setFormData((prev) => ({ ...prev, organizer_id: null }));
                      }
                      setOrganizerSearch(e.target.value);
                    }}
                    className={cn(fieldClass, 'pl-9')}
                  />
                </div>
                {!formData.organizer_id && organizerSearch.trim() ? (
                  <div className="mt-1 max-h-40 overflow-y-auto rounded-[10px] border border-border">
                    {usersData?.data?.length ? (
                      usersData.data.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, organizer_id: user.id }));
                            setOrganizerSearch('');
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[hsl(var(--admin-surface-2))]"
                        >
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={user.profile_picture} />
                            <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <span className="truncate">{user.name}</span>
                        </button>
                      ))
                    ) : (
                      <p className="p-3 text-xs text-muted-foreground">No users found</p>
                    )}
                  </div>
                ) : null}
                {formData.organizer_id ? (
                  <button
                    type="button"
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                    onClick={() => setFormData((prev) => ({ ...prev, organizer_id: null }))}
                  >
                    Clear organizer
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {(
                [
                  {
                    id: 'featured',
                    label: 'Featured on Home',
                    checked: formData.featured,
                    onChange: (v: boolean) => setFormData((prev) => ({ ...prev, featured: v })),
                  },
                  {
                    id: 'require-approval',
                    label: 'Require approval to attend',
                    checked: requireApproval,
                    onChange: setRequireApproval,
                  },
                  {
                    id: 'external-ticket',
                    label: 'External ticket link',
                    checked: useExternalTicket,
                    onChange: (v: boolean) => {
                      setUseExternalTicket(v);
                      if (!v) setFormData((prev) => ({ ...prev, ticket_link: '' }));
                    },
                  },
                ] as const
              ).map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded-[10px] bg-[hsl(var(--admin-surface-2))] p-3"
                >
                  <Label htmlFor={row.id} className="cursor-pointer text-[13px] font-medium">
                    {row.label}
                  </Label>
                  <Switch
                    id={row.id}
                    checked={row.checked}
                    onCheckedChange={row.onChange}
                    className="h-[22px] w-10 data-[state=checked]:bg-primary data-[state=unchecked]:bg-border"
                  />
                </div>
              ))}
            </div>

            {useExternalTicket ? (
              <div className="space-y-1.5">
                <Label htmlFor="ticket_link" className="text-xs font-semibold">
                  Ticket URL
                </Label>
                <Input
                  id="ticket_link"
                  name="ticket_link"
                  type="url"
                  value={formData.ticket_link}
                  onChange={handleInputChange}
                  placeholder="https://…"
                  className={fieldClass}
                />
              </div>
            ) : null}
          </div>
        );

      case 3:
        return (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={cn(surfaceCard, 'flex flex-col gap-3 p-[18px]')}>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="description" className="text-xs font-semibold">
                    Description *
                  </Label>
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
                      setFormData((prev) => ({ ...prev, description: text.slice(0, 2000) }))
                    }
                  />
                </div>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell people what this event is about… or Write with AI"
                  rows={6}
                  maxLength={2000}
                  className="min-h-[160px] rounded-[10px] border-border bg-[hsl(var(--admin-surface-2))] text-[13px]"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  {formData.description.length} / 2000 characters
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="what-to-expect" className="text-xs font-semibold">
                    What to expect
                  </Label>
                  <AdminAiWriteButton
                    label="Suggest with AI"
                    disabled={!formData.title.trim()}
                    needHint="Enter an event title first"
                    run={() =>
                      draftWhatToExpect({
                        title: formData.title.trim(),
                        description: formData.description || undefined,
                      })
                    }
                    onResult={syncWhatToExpect}
                  />
                </div>
                <Textarea
                  id="what-to-expect"
                  value={whatToExpect}
                  onChange={(e) => syncWhatToExpect(e.target.value)}
                  placeholder={'• Four rooms · techno, house\n• Cashless bar on site\n• Doors 22:00'}
                  rows={4}
                  className="rounded-[10px] border-border bg-[hsl(var(--admin-surface-2))] text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary"
                    >
                      {tag} <X className="h-3 w-3" />
                    </button>
                  ))}
                  {addingTag ? (
                    <div className="flex gap-1">
                      <Input
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                          if (e.key === 'Escape') setAddingTag(false);
                        }}
                        placeholder="Tag name"
                        className="h-8 w-28 rounded-full border-border bg-[hsl(var(--admin-surface-2))] text-xs"
                        autoFocus
                      />
                      <Button type="button" size="sm" variant="outline" onClick={handleAddTag}>
                        Add
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingTag(true)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
                    >
                      + Add tag
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className={cn(surfaceCard, 'flex flex-col gap-3 p-[18px]')}>
              <Label className="text-xs font-semibold">Cover image *</Label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="cover-upload"
                disabled={isUploading}
                onChange={(e) => handleFileChange(e, false)}
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="gallery-upload"
                disabled={isUploading}
                onChange={(e) => handleFileChange(e, true)}
              />

              {previewUrl || formData.image_url ? (
                <div className="relative h-[220px] overflow-hidden rounded-xl">
                  <img
                    src={previewUrl || formData.image_url}
                    alt="Cover"
                    className="size-full object-cover"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => document.getElementById('cover-upload')?.click()}
                  className="flex h-[220px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-[hsl(var(--admin-surface-2))] text-sm text-muted-foreground"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Upload cover image
                    </>
                  )}
                </button>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-[10px]"
                  disabled={isUploading}
                  onClick={() => document.getElementById('cover-upload')?.click()}
                >
                  Replace image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-[10px]"
                  onClick={() => toast.message('Crop opens after publish in media tools')}
                >
                  Crop
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-[10px]"
                  onClick={() => {
                    setPreviewUrl(null);
                    setFormData((prev) => ({ ...prev, image_url: '' }));
                  }}
                >
                  Remove
                </Button>
              </div>

              <Label className="text-xs font-semibold">Gallery (optional)</Label>
              <div className="flex flex-wrap gap-2.5">
                {galleryUrls.map((url) => (
                  <div key={url} className="relative h-[72px] w-[100px] overflow-hidden rounded-[10px]">
                    <img src={url} alt="" className="size-full object-cover" />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => document.getElementById('gallery-upload')?.click()}
                  className="flex h-[72px] w-[100px] items-center justify-center rounded-[10px] border border-border bg-[hsl(var(--admin-surface-2))] text-xl font-bold text-muted-foreground"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => document.getElementById('gallery-upload')?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) void handleFileUpload(file, true);
                }}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-[hsl(var(--admin-surface-2))] px-4 py-5 text-center"
              >
                <span className="text-[13px] font-semibold text-foreground">Drop more images here</span>
                <span className="text-[11px] text-muted-foreground">
                  PNG, JPG up to 5MB · 16:9 recommended
                </span>
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className={cn(surfaceCard, 'flex w-full flex-col gap-3 p-5')}>
            <h3 className="text-base font-bold text-foreground">Review & publish</h3>
            {(
              [
                ['Title', formData.title || 'Not set'],
                ['When', whenLabel],
                ['Where', formData.location || 'Not set'],
                [
                  'Price',
                  formData.price > 0 ? `KES ${formData.price.toLocaleString()}` : 'Free',
                ],
                [
                  'Categories',
                  selectedCategoryNames.length ? selectedCategoryNames.join(' · ') : 'Not set',
                ],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4 py-2 text-[13px]"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="max-w-[60%] text-right font-semibold text-foreground">{value}</span>
              </div>
            ))}
            <div className="rounded-[10px] bg-[hsl(var(--admin-success)/0.12)] px-3 py-2.5 text-xs font-medium text-[hsl(var(--admin-success))]">
              Ready to publish · pin confirmed · required fields complete
            </div>
            {formData.featured ? (
              <Badge variant="secondary" className="w-fit">
                Featured on Home
              </Badge>
            ) : null}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="-mx-1 flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Create event</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Step {currentStep} of 4 · {STEP_META[currentStep].subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-[10px]"
              onClick={onCancel}
            >
              Cancel
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="rounded-[10px]"
            onClick={() => toast.message('Draft saving isn’t available yet — use Publish when ready')}
          >
            Save draft
          </Button>
        </div>
      </div>

      <form
        className="flex flex-1 flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (currentStep === 4) void handleSubmit();
          else handleNext();
        }}
      >
        {renderStepper()}
        <div className="flex-1">{renderStepContent()}</div>

        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-border bg-background/95 py-3 backdrop-blur-sm">
          <div>
            {currentStep === 1 ? (
              <p className="text-xs text-muted-foreground">Required fields marked *</p>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="rounded-[10px]"
                onClick={handlePrevious}
              >
                ← Back
              </Button>
            )}
          </div>
          <Button
            type="submit"
            className="rounded-[10px] bg-primary px-4 font-bold text-primary-foreground"
            disabled={
              currentStep === 4 &&
              (isSubmitting || isUploading || createEventMutation.isPending)
            }
          >
            {currentStep === 4 && (isSubmitting || createEventMutation.isPending) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              STEP_META[currentStep].nextLabel
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateEvent;
