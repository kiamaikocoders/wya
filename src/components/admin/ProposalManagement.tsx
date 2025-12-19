import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Search, Trash2, Check, X, ThumbsUp, ThumbsDown, Mail, Edit2, Save, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase'; // Assuming supabase client is exported from here

interface EventProposal {
  id: number;
  title: string;
  description: string;
  category: string;
  estimatedDate: string | null;
  location: string | null;
  status: "pending" | "approved" | "rejected";
  submittedBy: string;
  submittedOn: string;
  expectedAttendees: number | null;
  budget: string | null;
  sponsorNeeds?: string | null;
  imageUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  adminNotes?: string | null;
}

const ProposalManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedProposals, setSelectedProposals] = useState<number[]>([]);
  const [viewProposal, setViewProposal] = useState<EventProposal | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [isEditing, setIsEditing] = useState(false);
  const [editedProposal, setEditedProposal] = useState<Partial<EventProposal>>({});
  const [organizerEmail, setOrganizerEmail] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch proposals from Supabase
  const { data: proposals, isLoading, error } = useQuery<EventProposal[], Error>({
    queryKey: ['proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*');
      if (error) throw error;
      // Ensure data matches the interface, especially nullable fields
      return data.map(p => ({
        ...p,
        estimatedDate: p.estimated_date,
        submittedBy: p.submitted_by,
        submittedOn: p.submitted_on,
        expectedAttendees: p.expected_attendees,
        sponsorNeeds: p.sponsor_needs,
        imageUrl: p.image_url,
        contactEmail: p.contact_email,
        contactPhone: p.contact_phone,
        adminNotes: p.admin_notes,
      })) as EventProposal[];
    },
  });

  // Mutations for updating proposals
  const updateProposalStatusMutation = useMutation<null, Error, { id: number; status: "approved" | "rejected"; proposal?: EventProposal }> ({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('proposals')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      
      // Get proposal details for notifications
      const { data: proposalData } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', id)
        .single();
      
      return { proposal: proposalData } as any;
    },
    onSuccess: async (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      
      // Send notifications based on status
      if (result && (result as any).proposal) {
        const proposal = (result as any).proposal;
        const userId = proposal.submitted_by;
        const proposalTitle = proposal.title;
        const proposalId = proposal.id;

        if (variables.status === 'approved') {
          await proposalNotifications.notifyProposalApproved(userId, proposalTitle, proposalId);
          toast.success('Proposal approved! User has been notified.');
        } else if (variables.status === 'rejected') {
          await proposalNotifications.notifyProposalRejected(userId, proposalTitle, proposalId);
          toast.success('Proposal rejected. User has been notified.');
        }
      } else {
        toast.success('Proposal status updated');
      }
    },
    onError: (err) => {
      toast.error(`Failed to update proposal status: ${err.message}`);
    },
  });

  // Mutation for updating proposals
  const updateProposalMutation = useMutation<null, Error, { id: number; updates: Partial<EventProposal> }>({
    mutationFn: async ({ id, updates }) => {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.estimatedDate !== undefined) updateData.estimated_date = updates.estimatedDate;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.expectedAttendees !== undefined) updateData.expected_attendees = updates.expectedAttendees;
      if (updates.budget !== undefined) updateData.budget = updates.budget;
      if (updates.sponsorNeeds !== undefined) updateData.sponsor_needs = updates.sponsorNeeds;
      if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
      if (updates.adminNotes !== undefined) updateData.admin_notes = updates.adminNotes;

      const { error } = await supabase
        .from('proposals')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal updated successfully');
      setIsEditing(false);
      setEditedProposal({});
    },
    onError: (err) => {
      toast.error(`Failed to update proposal: ${err.message}`);
    },
  });

  // Mutation for deleting proposals
  const deleteProposalsMutation = useMutation<null, Error, number[]>({
    mutationFn: async (ids) => {
      const { error } = await supabase
        .from('proposals')
        .delete()
        .in('id', ids);
      if (error) throw error;
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Selected proposals deleted');
      setSelectedProposals([]); // Clear selection after deletion
    },
    onError: (err) => {
      toast.error(`Failed to delete proposals: ${err.message}`);
    },
  });

  // Fetch organizer email when viewing proposal
  useEffect(() => {
    if (viewProposal) {
      // Use contact_email from proposal first, then try to get from user profile
      if (viewProposal.contactEmail) {
        setOrganizerEmail(viewProposal.contactEmail);
      } else {
        // Try to get email from user's auth metadata via a server function or use contact_email
        // For now, use contact_email which should be populated from proposal submission
        setOrganizerEmail(viewProposal.contactEmail || null);
      }
    } else {
      setOrganizerEmail(null);
    }
  }, [viewProposal]);

  const handleEdit = () => {
    if (viewProposal) {
      setEditedProposal({ ...viewProposal });
      setImagePreview(viewProposal.imageUrl || null);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (viewProposal) {
      updateProposalMutation.mutate({ id: viewProposal.id, updates: editedProposal });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProposal({});
    setImagePreview(null);
  };

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      // Get current user for user-specific folder
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to upload images');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const bucket = 'event-images';
      const folder = `proposals/${user.id}`; // Use user-specific folder
      const filePath = `${folder}/${fileName}`;

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setEditedProposal({ ...editedProposal, imageUrl: data.publicUrl });
      setImagePreview(data.publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    // Upload file
    handleImageUpload(file);
  };

  const removeImage = () => {
    setEditedProposal({ ...editedProposal, imageUrl: null });
    setImagePreview(null);
  };


  const handleApprove = (proposalId: number) => {
    updateProposalStatusMutation.mutate({ id: proposalId, status: "approved" });
  };

  const handleReject = (proposalId: number) => {
    updateProposalStatusMutation.mutate({ id: proposalId, status: "rejected" });
  };

  const handleDelete = (proposalId: number) => {
    if (confirm('Are you sure you want to delete this proposal?')) {
      deleteProposalsMutation.mutate([proposalId]);
      setViewProposal(null); // Close dialog if deleting the viewed proposal
    }
  };

  const handleDeleteSelected = () => {
    if (confirm(`Are you sure you want to delete ${selectedProposals.length} selected proposal(s)?`)) {
      deleteProposalsMutation.mutate(selectedProposals);
    }
  };

  // Filter proposals based on search query, status filter, and active tab
  const filteredProposals = (proposals || []).filter(proposal => {
    const matchesSearch = 
      proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (proposal.submittedBy || '').toLowerCase().includes(searchQuery.toLowerCase()); // Use submittedBy for search
    
    const matchesStatus = statusFilter ? proposal.status === statusFilter : true;
    
    // Filter by selected tab
    const matchesTab = 
      (activeTab === "all") ||
      (activeTab === "pending" && proposal.status === "pending") ||
      (activeTab === "approved" && proposal.status === "approved") ||
      (activeTab === "rejected" && proposal.status === "rejected");
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  const toggleProposalSelection = (proposalId: number) => {
    setSelectedProposals(prev => 
      prev.includes(proposalId) 
        ? prev.filter(id => id !== proposalId)
        : [...prev, proposalId]
    );
  };

  const getStatusBadge = (status: EventProposal['status']) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading proposals...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error loading proposals: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold">Event Proposals</h2>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="destructive" 
            size="sm"
            disabled={selectedProposals.length === 0 || deleteProposalsMutation.isPending}
            onClick={handleDeleteSelected}
          >
            {deleteProposalsMutation.isPending ? 'Deleting...' : <> <Trash2 className="h-4 w-4 mr-1" /> Delete Selected </>}
          </Button>
          
          {/* Individual Approve/Reject/Delete buttons within table rows are handled below */}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search proposals..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select 
          value={statusFilter || "all"}
          onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="border rounded-md">
        <div className="grid grid-cols-12 gap-2 p-3 font-medium border-b bg-muted/50">
          <div className="col-span-1 flex items-center">
            <Checkbox 
              checked={selectedProposals.length === filteredProposals.length && filteredProposals.length > 0}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedProposals(filteredProposals.map(p => p.id));
                } else {
                  setSelectedProposals([]);
                }
              }}
            />
          </div>
          <div className="col-span-3">Title</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Actions</div>
        </div>
        
        {filteredProposals.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No proposals match your search criteria.
          </div>
        ) : (
          filteredProposals.map((proposal) => (
            <div key={proposal.id} className="grid grid-cols-12 gap-2 p-3 border-b hover:bg-muted/30 items-center">
              <div className="col-span-1 flex items-center">
                <Checkbox 
                  checked={selectedProposals.includes(proposal.id)}
                  onCheckedChange={() => toggleProposalSelection(proposal.id)}
                />
              </div>
              <div className="col-span-3 truncate font-medium">
                <button 
                  className="text-left hover:underline"
                  onClick={() => setViewProposal(proposal)}
                >
                  {proposal.title}
                </button>
              </div>
              <div className="col-span-2 capitalize">{proposal.category}</div>
              <div className="col-span-2 flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                {proposal.estimatedDate}
              </div>
              <div className="col-span-2">{getStatusBadge(proposal.status)}</div>
              <div className="col-span-2 flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setViewProposal(proposal)}
                >
                  View
                </Button>
                
                {proposal.status === "pending" && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-green-500 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleApprove(proposal.id)}
                      disabled={updateProposalStatusMutation.isPending}
                    >
                       {updateProposalStatusMutation.isPending ? '' : <ThumbsUp className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleReject(proposal.id)}
                      disabled={updateProposalStatusMutation.isPending}
                    >
                      {updateProposalStatusMutation.isPending ? '' : <ThumbsDown className="h-4 w-4" />}
                    </Button>
                  </>
                )}
                 <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(proposal.id)}
                    disabled={deleteProposalsMutation.isPending}
                  >
                     {deleteProposalsMutation.isPending ? '' : <Trash2 className="h-4 w-4" />}
                  </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Proposal Detail Dialog */}
      <Dialog open={!!viewProposal} onOpenChange={(open) => {
        if (!open) {
          setViewProposal(null);
          setIsEditing(false);
          setEditedProposal({});
          setOrganizerEmail(null);
          setImagePreview(null);
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Event Proposal Details</DialogTitle>
            <DialogDescription>
              Submitted on {viewProposal?.submittedOn} by {viewProposal?.submittedBy}
            </DialogDescription>
          </DialogHeader>
          
          {viewProposal && (
            <div className="space-y-4 mt-4">
              {/* Image Display/Upload */}
              <div className="w-full">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Event Image</h4>
                {(imagePreview || (!isEditing && viewProposal.imageUrl)) ? (
                  <div className="relative">
                    <img 
                      src={imagePreview || viewProposal.imageUrl || ''} 
                      alt={viewProposal.title}
                      className="w-full h-64 object-cover rounded-lg border"
                    />
                    {isEditing && (
                      <div className="absolute top-2 right-2 flex gap-2">
                        <input
                          type="file"
                          id="proposal-image-upload"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                        <label
                          htmlFor="proposal-image-upload"
                          className="cursor-pointer bg-white/90 hover:bg-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1"
                        >
                          {isUploadingImage ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Change
                            </>
                          )}
                        </label>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeImage}
                          disabled={isUploadingImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  isEditing ? (
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="proposal-image-upload"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                        disabled={isUploadingImage}
                      />
                      <label
                        htmlFor="proposal-image-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-primary" />
                            <span className="text-sm text-muted-foreground">
                              Click to upload an image
                            </span>
                            <span className="text-xs text-muted-foreground">
                              PNG, JPG up to 10MB
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No image uploaded</p>
                  )
                )}
              </div>
              
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={editedProposal.title || viewProposal.title}
                      onChange={(e) => setEditedProposal({ ...editedProposal, title: e.target.value })}
                      className="text-lg font-bold mb-2"
                    />
                  ) : (
                    <h3 className="text-lg font-bold">{viewProposal.title}</h3>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {isEditing ? (
                      <Input
                        value={editedProposal.category || viewProposal.category}
                        onChange={(e) => setEditedProposal({ ...editedProposal, category: e.target.value })}
                        className="w-auto"
                      />
                    ) : (
                      <Badge className="capitalize">{viewProposal.category}</Badge>
                    )}
                    {getStatusBadge(viewProposal.status)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Description</h4>
                  {isEditing ? (
                    <Textarea
                      value={editedProposal.description || viewProposal.description}
                      onChange={(e) => setEditedProposal({ ...editedProposal, description: e.target.value })}
                      rows={5}
                    />
                  ) : (
                    <p className="text-sm">{viewProposal.description}</p>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Location</h4>
                    {isEditing ? (
                      <Input
                        value={editedProposal.location || viewProposal.location || ''}
                        onChange={(e) => setEditedProposal({ ...editedProposal, location: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{viewProposal.location || 'N/A'}</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Estimated Date</h4>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editedProposal.estimatedDate || viewProposal.estimatedDate || ''}
                        onChange={(e) => setEditedProposal({ ...editedProposal, estimatedDate: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{viewProposal.estimatedDate || 'N/A'}</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Expected Attendees</h4>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedProposal.expectedAttendees || viewProposal.expectedAttendees || ''}
                        onChange={(e) => setEditedProposal({ ...editedProposal, expectedAttendees: parseInt(e.target.value) || null })}
                      />
                    ) : (
                      <p className="text-sm">{viewProposal.expectedAttendees?.toLocaleString() || 'N/A'}</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Budget</h4>
                    {isEditing ? (
                      <Input
                        value={editedProposal.budget || viewProposal.budget || ''}
                        onChange={(e) => setEditedProposal({ ...editedProposal, budget: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{viewProposal.budget || 'N/A'}</p>
                    )}
                  </div>
                  
                  {viewProposal.contactEmail && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">Contact Email</h4>
                      <p className="text-sm">{viewProposal.contactEmail}</p>
                    </div>
                  )}
                  
                  {viewProposal.contactPhone && (
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">Contact Phone</h4>
                      <p className="text-sm">{viewProposal.contactPhone}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Sponsorship Needs</h4>
                {isEditing ? (
                  <Textarea
                    value={editedProposal.sponsorNeeds || viewProposal.sponsorNeeds || ''}
                    onChange={(e) => setEditedProposal({ ...editedProposal, sponsorNeeds: e.target.value })}
                    rows={3}
                  />
                ) : (
                  <p className="text-sm">{viewProposal.sponsorNeeds || "None specified"}</p>
                )}
              </div>
              
              {/* Admin Notes Section */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Admin Notes</h4>
                {isEditing ? (
                  <Textarea
                    value={editedProposal.adminNotes || viewProposal.adminNotes || ''}
                    onChange={(e) => setEditedProposal({ ...editedProposal, adminNotes: e.target.value })}
                    placeholder="Add internal notes about this proposal..."
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {viewProposal.adminNotes || 'No admin notes'}
                  </p>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline"
              className="mr-auto"
              onClick={() => {
                const email = organizerEmail || viewProposal?.contactEmail;
                if (email) {
                  window.location.href = `mailto:${email}?subject=Regarding your event proposal: ${viewProposal?.title}`;
                } else {
                  toast.error('Organizer email not found');
                }
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Organizer
            </Button>
            
            {viewProposal?.status === "pending" && (
              <Button
                variant="outline"
                onClick={isEditing ? handleCancelEdit : handleEdit}
                disabled={updateProposalMutation.isPending}
              >
                {isEditing ? (
                  <>Cancel</>
                ) : (
                  <> <Edit2 className="h-4 w-4 mr-2" /> Edit Proposal </>
                )}
              </Button>
            )}
            
            {isEditing && (
              <Button
                variant="outline"
                onClick={handleSaveEdit}
                disabled={updateProposalMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateProposalMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
            
            {viewProposal?.status === "pending" && (
              <>
                <Button 
                  variant="outline" 
                  className="border-green-500 text-green-600 hover:bg-green-50"
                  onClick={() => {
                    handleApprove(viewProposal.id);
                    // setViewProposal(null); // Keep dialog open until mutation is successful?
                  }}
                  disabled={updateProposalStatusMutation.isPending}
                >
                   {updateProposalStatusMutation.isPending ? 'Processing...' : <> <Check className="h-4 w-4 mr-1" /> Approve </>}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-red-500 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    handleReject(viewProposal.id);
                    // setViewProposal(null); // Keep dialog open?
                  }}
                  disabled={updateProposalStatusMutation.isPending}
                >
                   {updateProposalStatusMutation.isPending ? 'Processing...' : <> <X className="h-4 w-4 mr-1" /> Reject </>}
                </Button>
              </>
            )}
            {/* Delete button is now in the table row */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProposalManagement;
