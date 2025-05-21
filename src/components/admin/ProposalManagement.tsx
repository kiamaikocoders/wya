import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Search, Trash2, Check, X, ThumbsUp, ThumbsDown, Mail } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase'; // Assuming supabase client is exported from here

interface EventProposal {
  id: number;
  title: string;
  description: string;
  category: string;
  estimatedDate: string | null; // Match Supabase DATE type
  location: string | null; // Match Supabase TEXT type (nullable)
  status: "pending" | "approved" | "rejected";
  submittedBy: string; // Change from submitted_by to camelCase
  submittedOn: string; // Change from submitted_on to camelCase
  expectedAttendees: number | null; // Change from expected_attendees to camelCase
  budget: string | null; // Match Supabase TEXT type (nullable)
  sponsorNeeds?: string | null; // Change from sponsor_needs to camelCase
}

const ProposalManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedProposals, setSelectedProposals] = useState<number[]>([]);
  const [viewProposal, setViewProposal] = useState<EventProposal | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

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
        estimatedDate: p.estimated_date, // Map column names
        submittedBy: p.submitted_by, // Map column names
        submittedOn: p.submitted_on, // Map column names
        expectedAttendees: p.expected_attendees, // Map column names
        sponsorNeeds: p.sponsor_needs, // Map column names
      })) as EventProposal[];
    },
  });

  // Mutations for updating proposals
  const updateProposalStatusMutation = useMutation<null, Error, { id: number; status: "approved" | "rejected" }> ({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('proposals')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal status updated');
    },
    onError: (err) => {
      toast.error(`Failed to update proposal status: ${err.message}`);
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
      <Dialog open={!!viewProposal} onOpenChange={(open) => !open && setViewProposal(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Event Proposal Details</DialogTitle>
            <DialogDescription>
              Submitted on {viewProposal?.submittedOn} by {viewProposal?.submittedBy}
            </DialogDescription>
          </DialogHeader>
          
          {viewProposal && (
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">{viewProposal.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="capitalize">{viewProposal.category}</Badge>
                    {getStatusBadge(viewProposal.status)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{viewProposal.description}</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Location</h4>
                    <p className="text-sm">{viewProposal.location || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Estimated Date</h4>
                    <p className="text-sm">{viewProposal.estimatedDate || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Expected Attendees</h4>
                    <p className="text-sm">{viewProposal.expectedAttendees?.toLocaleString() || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Budget</h4>
                    <p className="text-sm">{viewProposal.budget || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Sponsorship Needs</h4>
                <p className="text-sm">{viewProposal.sponsorNeeds || "None specified"}</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline"
              className="mr-auto"
              onClick={() => {
                // This should ideally open a mail client or a compose email dialog
                // For now, just show a toast or console log
                toast.info(`Simulating sending email to ${viewProposal?.submittedBy}`);
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Organizer
            </Button>
            
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
