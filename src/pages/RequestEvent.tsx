
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CalendarIcon, InfoIcon, PlusCircle, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import AIEventCategorizer from "@/components/events/AIEventCategorizer";

interface EventRequestFormData {
  organizerName: string;
  organizerEmail: string;
  organizerPhone: string;
  eventTitle: string;
  eventCategory: string;
  eventDescription: string;
  eventDate: string;
  eventLocation: string;
  eventCapacity: string;
  additionalDetails: string;
  isPremium: boolean;
  ticketOptions: TicketOption[];
  featuredImageUrl: string;
  galleryImages: string[];
  eventTags: string[];
}

interface TicketOption {
  name: string;
  price: number;
  quantity: number;
  description: string;
}

const RequestEvent: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [ticketOptions, setTicketOptions] = useState<TicketOption[]>([
    { name: "General Admission", price: 500, quantity: 100, description: "Standard entry ticket" }
  ]);
  const [currentTag, setCurrentTag] = useState("");
  const [eventTags, setEventTags] = useState<string[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const navigate = useNavigate();
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EventRequestFormData>();
  
  const eventTitle = watch("eventTitle", "");
  const eventDescription = watch("eventDescription", "");
  
  const categoryOptions = [
    "Music", "Food & Drink", "Arts & Culture", "Sports & Fitness", 
    "Business & Professional", "Community & Causes", "Education", 
    "Fashion & Beauty", "Film & Media", "Health & Wellness", 
    "Hobbies & Special Interest", "Technology", "Travel & Outdoor", "Other"
  ];
  
  const locationOptions = [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", 
    "Thika", "Kitale", "Malindi", "Lamu", "Other"
  ];
  
  const handleAddTicketOption = () => {
    setTicketOptions([
      ...ticketOptions, 
      { name: `Ticket Option ${ticketOptions.length + 1}`, price: 0, quantity: 50, description: "" }
    ]);
  };
  
  const handleRemoveTicketOption = (index: number) => {
    const newOptions = [...ticketOptions];
    newOptions.splice(index, 1);
    setTicketOptions(newOptions);
  };
  
  const handleTicketOptionChange = (index: number, field: keyof TicketOption, value: string | number) => {
    const newOptions = [...ticketOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setTicketOptions(newOptions);
  };
  
  const handleAddTag = () => {
    if (currentTag && !eventTags.includes(currentTag)) {
      setEventTags([...eventTags, currentTag]);
      setCurrentTag("");
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setEventTags(eventTags.filter(t => t !== tag));
  };
  
  const handleAddGalleryImage = () => {
    const url = prompt("Enter image URL");
    if (url && url.trim() !== "") {
      setGalleryImages([...galleryImages, url.trim()]);
    }
  };
  
  const handleRemoveGalleryImage = (index: number) => {
    const newImages = [...galleryImages];
    newImages.splice(index, 1);
    setGalleryImages(newImages);
  };
  
  const handleCategorySelect = (category: string) => {
    setValue("eventCategory", category);
  };
  
  const onSubmit = async (data: EventRequestFormData) => {
    setIsSubmitting(true);
    try {
      // Prepare complete data with all collected information
      const completeData = {
        ...data,
        isPremium,
        ticketOptions,
        eventTags,
        galleryImages,
        featuredImageUrl
      };
      
      console.log("Event request submitted:", completeData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Event request submitted successfully! Our team will contact you shortly.");
      navigate("/");
    } catch (error) {
      console.error("Error submitting event request:", error);
      toast.error("Failed to submit event request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Request to Add Your Event</CardTitle>
          <CardDescription>
            Fill out this form to request your event to be added to our platform. Our team will review your submission and get back to you shortly.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="flex items-center p-4 bg-muted/50 rounded-lg mb-6">
              <InfoIcon className="h-6 w-6 mr-3 text-kenya-orange" />
              <p className="text-sm">
                After submitting your request, our team will review the details and reach out to you for verification and any additional information needed.
              </p>
            </div>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="tickets">Ticket Options</TabsTrigger>
                <TabsTrigger value="media">Media & Tags</TabsTrigger>
                <TabsTrigger value="promotion">Promotion</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-6">
                <div className="grid gap-6">
                  <h3 className="text-lg font-medium border-b pb-2">Organizer Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="organizerName">Organizer Name</Label>
                      <Input
                        id="organizerName"
                        {...register("organizerName", { required: "Organizer name is required" })}
                      />
                      {errors.organizerName && (
                        <p className="text-destructive text-sm">{errors.organizerName.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="organizerEmail">Email Address</Label>
                      <Input
                        id="organizerEmail"
                        type="email"
                        {...register("organizerEmail", { 
                          required: "Email is required",
                          pattern: {
                            value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                            message: "Please enter a valid email address"
                          }
                        })}
                      />
                      {errors.organizerEmail && (
                        <p className="text-destructive text-sm">{errors.organizerEmail.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="organizerPhone">Phone Number</Label>
                      <Input
                        id="organizerPhone"
                        {...register("organizerPhone", { required: "Phone number is required" })}
                      />
                      {errors.organizerPhone && (
                        <p className="text-destructive text-sm">{errors.organizerPhone.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium border-b pb-2 mt-6">Event Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventTitle">Event Title</Label>
                      <Input
                        id="eventTitle"
                        {...register("eventTitle", { required: "Event title is required" })}
                      />
                      {errors.eventTitle && (
                        <p className="text-destructive text-sm">{errors.eventTitle.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="eventCategory">Category</Label>
                      <Select onValueChange={(value) => setValue("eventCategory", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.eventCategory && (
                        <p className="text-destructive text-sm">{errors.eventCategory.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="eventDate">Proposed Date</Label>
                      <div className="relative">
                        <Input
                          id="eventDate"
                          type="datetime-local"
                          {...register("eventDate", { required: "Event date is required" })}
                        />
                        <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                      {errors.eventDate && (
                        <p className="text-destructive text-sm">{errors.eventDate.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="eventLocation">Location</Label>
                      <Select onValueChange={(value) => setValue("eventLocation", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locationOptions.map(location => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.eventLocation && (
                        <p className="text-destructive text-sm">{errors.eventLocation.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="eventCapacity">Expected Capacity</Label>
                      <Input
                        id="eventCapacity"
                        type="number"
                        {...register("eventCapacity")}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="eventDescription">Event Description</Label>
                      <Textarea
                        id="eventDescription"
                        rows={4}
                        {...register("eventDescription", { required: "Event description is required" })}
                      />
                      {errors.eventDescription && (
                        <p className="text-destructive text-sm">{errors.eventDescription.message}</p>
                      )}
                    </div>
                    
                    {eventTitle && eventDescription && (
                      <div className="md:col-span-2">
                        <AIEventCategorizer 
                          title={eventTitle} 
                          description={eventDescription}
                          onSelectCategory={handleCategorySelect}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tickets" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Ticket Options</h3>
                  
                  {ticketOptions.map((option, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Ticket Option {index + 1}</h4>
                        {ticketOptions.length > 1 && (
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleRemoveTicketOption(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor={`ticket-name-${index}`}>Name</Label>
                          <Input
                            id={`ticket-name-${index}`}
                            value={option.name}
                            onChange={(e) => handleTicketOptionChange(index, "name", e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor={`ticket-price-${index}`}>Price (KES)</Label>
                          <Input
                            id={`ticket-price-${index}`}
                            type="number"
                            value={option.price}
                            onChange={(e) => handleTicketOptionChange(index, "price", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor={`ticket-quantity-${index}`}>Quantity Available</Label>
                          <Input
                            id={`ticket-quantity-${index}`}
                            type="number"
                            value={option.quantity}
                            onChange={(e) => handleTicketOptionChange(index, "quantity", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor={`ticket-description-${index}`}>Description</Label>
                          <Input
                            id={`ticket-description-${index}`}
                            value={option.description}
                            onChange={(e) => handleTicketOptionChange(index, "description", e.target.value)}
                            placeholder="e.g., Includes free drink"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAddTicketOption}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add Another Ticket Option
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="media" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Media</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="featuredImage">Featured Image URL</Label>
                    <Input
                      id="featuredImage"
                      value={featuredImageUrl}
                      onChange={(e) => setFeaturedImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                    
                    {featuredImageUrl && (
                      <div className="mt-2 border rounded-md p-2 max-w-xs">
                        <img 
                          src={featuredImageUrl} 
                          alt="Featured preview" 
                          className="w-full h-40 object-cover rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/600x400?text=Invalid+Image+URL";
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Gallery Images</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {galleryImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={url} 
                            alt={`Gallery ${index}`} 
                            className="w-full h-24 object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://placehold.co/600x400?text=Invalid+URL";
                            }}
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveGalleryImage(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="h-24 flex flex-col items-center justify-center gap-1"
                        onClick={handleAddGalleryImage}
                      >
                        <PlusCircle className="h-6 w-6" />
                        <span className="text-xs">Add Image</span>
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium border-b pb-2 mt-6">Tags</h3>
                  
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        placeholder="Add a tag"
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddTag}>
                        Add
                      </Button>
                    </div>
                    
                    {eventTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {eventTags.map((tag, index) => (
                          <div 
                            key={index} 
                            className="bg-kenya-brown-dark text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"
                          >
                            <span>{tag}</span>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveTag(tag)}
                              className="text-white hover:text-kenya-orange focus:outline-none"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="promotion" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Promotion Options</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="premium-listing"
                      checked={isPremium}
                      onCheckedChange={setIsPremium}
                    />
                    <Label htmlFor="premium-listing" className="flex-1">
                      Premium Listing (Featured on homepage + highlighted in search results)
                    </Label>
                  </div>
                  
                  {isPremium && (
                    <div className="rounded-md border p-4 bg-muted/50">
                      <h4 className="font-medium mb-2">Premium Benefits:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Featured placement on the homepage</li>
                        <li>Highlighted in search results</li>
                        <li>Social media promotion</li>
                        <li>Priority support</li>
                        <li>Advanced analytics</li>
                      </ul>
                      <p className="text-sm mt-3 font-medium">Additional fee: 5,000 KES</p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="additionalDetails">Additional Promotion Details</Label>
                    <Textarea
                      id="additionalDetails"
                      rows={3}
                      placeholder="Any other promotional details or special requests..."
                      {...register("additionalDetails")}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate("/")} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : "Submit Request"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RequestEvent;
