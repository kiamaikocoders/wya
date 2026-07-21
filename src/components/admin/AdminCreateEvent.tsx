import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, X, Check, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminService } from '@/lib/admin-service';
import { notificationService } from '@/lib/notification/notification-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { googleMapsDirectionsUrl } from '@/lib/location-service';
import LocationPicker from '@/components/maps/LocationPicker';
import { AddSubcategoryField } from '@/components/admin/AddSubcategoryField';
import { organizeEventCategoryParents } from '@/lib/category-hierarchy';
import { ParagraphizedDescription } from '@/components/common/ParagraphizedDescription';
import {
  prepareMediaForUpload,
  STORAGE_CACHE_CONTROL_IMMUTABLE,
} from '@/lib/media-upload-prepare';

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

const AdminCreateEvent: React.FC<AdminCreateEventProps> = ({ onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [organizerSearch, setOrganizerSearch] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    category_id: null as number | null,
    category_ids: [] as number[], // Multiple categories
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
  const [artistsInput, setArtistsInput] = useState('');
  
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

  // Get selected category name for display (singular, for backward compatibility)
  const selectedCategoryName = useMemo(() => {
    if (!formData.category_id) return null;
    const category = categoriesData.find(c => c.id === formData.category_id);
    return category?.name || null;
  }, [formData.category_id, categoriesData]);

  // Get selected category names for display (plural, for multiple categories)
  const selectedCategoryNames = useMemo(() => {
    if (!formData.category_ids || formData.category_ids.length === 0) return [];
    return formData.category_ids
      .map(id => {
        const category = categoriesData.find(c => c.id === id);
        return category?.name || null;
      })
      .filter((name): name is string => name !== null);
  }, [formData.category_ids, categoriesData]);

  // Toggle category selection
  const toggleCategory = (categoryId: number) => {
    setFormData(prev => {
      const categoryIds = prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId];
      
      // Also update category_id to first selected (for backward compatibility)
      // Keep the primary category as the first one in the array
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
  
  // Set primary category (move to first position)
  const setPrimaryCategory = (categoryId: number) => {
    setFormData(prev => {
      if (!prev.category_ids.includes(categoryId)) return prev;
      
      // Move selected category to first position
      const otherIds = prev.category_ids.filter(id => id !== categoryId);
      const categoryIds = [categoryId, ...otherIds];
      
      const selectedCategory = categoriesData.find(c => c.id === categoryId);
      
      return {
        ...prev,
        category_ids: categoryIds,
        category_id: categoryId,
        category: selectedCategory?.name || prev.category,
      };
    });
  };

  // Fetch users for organizer selection
  const { data: usersData } = useQuery({
    queryKey: ['admin-users-for-organizer', organizerSearch],
    queryFn: () => adminService.getUsers({
      page: 1,
      pageSize: 50,
      search: organizerSearch,
      role: 'all',
      status: 'all',
    }),
  });

  const steps = [
    { number: 1, title: 'Event', description: 'Basic information and scheduling' },
    { number: 2, title: 'Access', description: 'Pricing, capacity, and organizer' },
    { number: 3, title: 'Content', description: 'Description, media, and details' },
    { number: 4, title: 'Publish', description: 'Review and publish' },
  ];

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

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
      const bucket = 'event-images';
      const folder = 'event-images';
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, prepared, {
          cacheControl: STORAGE_CACHE_CONTROL_IMMUTABLE,
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('new row violates')) {
          const fallbackBucket = 'event-media';
          const fallbackPath = `events/${fileName}`;
          const { error: fallbackError } = await supabase.storage
            .from(fallbackBucket)
            .upload(fallbackPath, prepared, {
              cacheControl: STORAGE_CACHE_CONTROL_IMMUTABLE,
              upsert: false
            });
          
          if (fallbackError) throw fallbackError;
          
          const { data } = supabase.storage
            .from(fallbackBucket)
            .getPublicUrl(fallbackPath);
          
          setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
          setPreviewUrl(data.publicUrl);
          toast.success('Image uploaded successfully');
          return;
        }
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
      setPreviewUrl(data.publicUrl);
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
        // Access step is optional, no validation needed
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
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((prev) => (prev + 1) as Step);
      }
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
        .insert([{
          ...eventData,
          organizer_id: eventData.organizer_id || null,
          status: 'approved',
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data, vars) => {
      const categoryIds = vars?.categoryIds || [];
      // Persist multi-category selections to the junction table (in addition to category/category_id on events)
      try {
        // Replace any existing mappings (should be none for a new event)
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
      
      // Notify all users about new admin-created event
      try {
        const { data: allUsers } = await supabase
          .from('profiles')
          .select('id')
          .limit(100); // Limit to avoid overwhelming
        
        if (allUsers && allUsers.length > 0) {
          await Promise.all(
            allUsers.map(userProfile =>
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
                }
              })
            )
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

    // Use default image if none provided
    if (!formData.image_url && formData.category) {
      const defaultImages = {
        Business: "https://images.unsplash.com/photo-1676372971824-ed498ef0db5f?q=80&w=2070",
        Culture: "https://images.unsplash.com/photo-1529154045759-34c09aed3b73?q=80&w=2070",
        Sports: "https://images.unsplash.com/photo-1474224017046-182ece80b263?q=80&w=2070",
        Music: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070",
        Technology: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072",
        default: "https://images.unsplash.com/photo-1433622070098-754fdf81c929?q=80&w=2070"
      };
      
      const imageUrl = defaultImages[formData.category as keyof typeof defaultImages] || defaultImages.default;
      formData.image_url = imageUrl;
    }

    setIsSubmitting(true);
    
    // Get category name and ID from first selected category_id
    let categoryName = formData.category;
    let categoryId = formData.category_id;
    if (formData.category_ids.length > 0) {
      const firstCategoryId = formData.category_ids[0];
      const selectedCategory = categoriesData.find(c => c.id === firstCategoryId);
      categoryName = selectedCategory?.name || categoryName;
      categoryId = firstCategoryId;
    }
    
    // Remove category_ids and other fields that don't exist in the events table
    const { category_ids, category_id, ...eventDataWithoutCategoryIds } = formData;
    
    const eventData = {
      ...eventDataWithoutCategoryIds,
      category: categoryName, // Ensure category name is set (first category for backward compatibility)
      category_id: categoryId, // Set category_id to first selected category
      date: new Date(formData.date).toISOString(),
      end_date: formData.end_date && formData.end_date >= formData.date ? formData.end_date : null,
      time: formData.time && formData.time.trim() ? formData.time.trim() : '18:00:00', // Default to 6pm if not set
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categories *</Label>
                {selectedCategoryNames.length > 0 ? (
                  <div className="space-y-2 mb-2">
                    <div className="flex flex-wrap gap-2">
                    {selectedCategoryNames.map((name, idx) => {
                      const categoryId = formData.category_ids[idx];
                        const isPrimary = idx === 0;
                      return (
                          <Badge 
                            key={categoryId} 
                            variant={isPrimary ? "default" : "secondary"} 
                            className="flex items-center gap-1"
                          >
                            {isPrimary && <span className="text-xs">⭐</span>}
                          {name}
                            {isPrimary && <span className="text-xs opacity-70">(Primary)</span>}
                          <button
                            type="button"
                            onClick={() => toggleCategory(categoryId)}
                            className="ml-1 hover:text-destructive"
                              title="Remove category"
                          >
                            <X className="h-3 w-3" />
                          </button>
                            {!isPrimary && (
                              <button
                                type="button"
                                onClick={() => setPrimaryCategory(categoryId)}
                                className="ml-1 hover:text-primary"
                                title="Set as primary category"
                              >
                                <span className="text-xs">⭐</span>
                              </button>
                            )}
                        </Badge>
                      );
                    })}
                    </div>
                    {selectedCategoryNames.length > 1 && (
                      <p className="text-xs text-muted-foreground">
                        First category is primary. Click ⭐ on another category to make it primary.
                      </p>
                    )}
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
                              className="text-sm font-medium text-kenya-orange cursor-pointer flex-1"
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
                <Label>Location *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Search, use GPS, or tap the map — then Confirm. Required to pin the event.
                </p>
                <LocationPicker
                  mode="event"
                  compact
                  height={280}
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
                {formData.location && formData.latitude != null && formData.longitude != null ? (
                  <p className="text-xs text-primary">
                    Confirmed: {formData.location} ({formData.latitude.toFixed(5)},{' '}
                    {formData.longitude.toFixed(5)})
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Confirm a pin before continuing.</p>
                )}

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
                    Auto-filled from the pin if left blank. Override with a custom maps link if needed.
                  </p>
                </div>
              </div>
            </div>
            
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (KES)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.price || ''}
                  onChange={handleInputChange}
                  placeholder="0 for free events"
                />
              </div>
              
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
              <Label>Event Organizer</Label>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for organizer..."
                    value={organizerSearch}
                    onChange={(e) => setOrganizerSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                {formData.organizer_id && (
                  <div className="flex items-center gap-2 p-2 bg-accent rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={usersData?.data.find(u => u.id === formData.organizer_id)?.profile_picture} />
                      <AvatarFallback>
                        {usersData?.data.find(u => u.id === formData.organizer_id)?.name?.charAt(0).toUpperCase() || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {usersData?.data.find(u => u.id === formData.organizer_id)?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {usersData?.data.find(u => u.id === formData.organizer_id)?.email}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, organizer_id: null }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {!formData.organizer_id && (
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {usersData?.data && usersData.data.length > 0 ? (
                      <div className="divide-y">
                        {usersData.data.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, organizer_id: user.id }))}
                            className="w-full p-3 hover:bg-accent flex items-center gap-3 text-left transition-colors"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profile_picture} />
                              <AvatarFallback>
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <Badge variant="outline">{user.role}</Badge>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No users found
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to create event without an organizer
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Full Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Detailed event description"
                rows={6}
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Event Image</Label>
              <div className="space-y-2">
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
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Event Details</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Event Title</Label>
                  <p className="font-medium">{formData.title || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Categories</Label>
                  {selectedCategoryNames.length > 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="flex items-center gap-1">
                          <span className="text-xs">⭐</span>
                          {selectedCategoryNames[0]}
                          <span className="text-xs opacity-70">(Primary)</span>
                        </Badge>
                      </div>
                      {selectedCategoryNames.length > 1 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-xs text-muted-foreground mr-1">Also:</span>
                          {selectedCategoryNames.slice(1).map((name, idx) => {
                            const categoryId = formData.category_ids[idx + 1];
                            return (
                              <Badge key={categoryId} variant="secondary" className="text-xs">
                                {name}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium">Not set</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="font-medium">{formData.location || 'Not set'}</p>
                  {formData.latitude !== null && formData.longitude !== null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">
                    {formData.date ? new Date(formData.date).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Time</Label>
                  <p className="font-medium">{formData.time || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Price</Label>
                  <p className="font-medium">
                    {formData.price > 0 ? `KES ${formData.price}` : 'Free'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Capacity</Label>
                  <p className="font-medium">
                    {formData.capacity > 0 ? formData.capacity : 'Unlimited'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Organizer</Label>
                  <p className="font-medium">
                    {formData.organizer_id 
                      ? usersData?.data.find(u => u.id === formData.organizer_id)?.name || 'Unknown'
                      : 'No organizer'}
                  </p>
                </div>
              </div>

              {formData.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <ParagraphizedDescription
                    text={formData.description}
                    className="mt-1"
                    paragraphClassName="text-sm"
                  />
                </div>
              )}

              {previewUrl && (
                <div>
                  <Label className="text-muted-foreground">Event Image</Label>
                  <img src={previewUrl} alt="Preview" className="mt-2 w-full h-48 object-cover rounded-lg" />
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="featured" className="cursor-pointer font-normal">
                  Feature this event on the homepage
                </Label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">

        {/* Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress {Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mt-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex items-center gap-2 ${
                currentStep >= step.number ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep > step.number
                    ? 'bg-primary border-primary text-primary-foreground'
                    : currentStep === step.number
                    ? 'border-primary text-primary'
                    : 'border-muted-foreground'
                }`}
              >
                {currentStep > step.number ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{step.number}</span>
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {step.number < steps.length && (
                <ChevronRight className="h-4 w-4 mx-2 hidden sm:block" />
              )}
            </div>
          ))}
        </div>

      <form onSubmit={(e) => { e.preventDefault(); currentStep === 4 ? handleSubmit() : handleNext(); }}>
        <div className="min-h-[400px] py-4">
          {renderStepContent()}
        </div>
        
        <div className="flex justify-between gap-3 pt-6 border-t mt-6">
          <div>
            {currentStep > 1 && (
              <Button 
                type="button" 
                variant="outline"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            {onCancel && currentStep === 1 && (
              <Button 
                type="button" 
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            {currentStep < 4 ? (
              <Button type="submit">
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                type="submit"
                disabled={isSubmitting || isUploading || createEventMutation.isPending}
              >
                {isSubmitting || createEventMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Event'
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateEvent;