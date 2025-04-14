
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
import { Loader2, CalendarIcon, InfoIcon } from "lucide-react";

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
}

const RequestEvent: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm<EventRequestFormData>();
  
  const categoryOptions = [
    "Music", "Food & Drink", "Arts & Culture", "Sports & Fitness", 
    "Business & Professional", "Community & Causes", "Education", 
    "Fashion & Beauty", "Film & Media", "Health & Wellness", 
    "Hobbies & Special Interest", "Technology", "Travel & Outdoor", "Other"
  ];
  
  const onSubmit = async (data: EventRequestFormData) => {
    setIsSubmitting(true);
    try {
      // In a real app, you would send this data to your backend
      console.log("Event request submitted:", data);
      
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
                  <Select>
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
                      type="date"
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
                  <Input
                    id="eventLocation"
                    {...register("eventLocation", { required: "Event location is required" })}
                  />
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
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="additionalDetails">Additional Details</Label>
                  <Textarea
                    id="additionalDetails"
                    rows={3}
                    placeholder="Any other details about your event that might be helpful..."
                    {...register("additionalDetails")}
                  />
                </div>
              </div>
            </div>
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
