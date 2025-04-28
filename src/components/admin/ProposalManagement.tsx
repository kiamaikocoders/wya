
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Search, Trash2, Check, X, ThumbsUp, ThumbsDown, Mail } from "lucide-react";
import { toast } from "sonner";

interface EventProposal {
  id: number;
  title: string;
  description: string;
  category: string;
  estimatedDate: string;
  location: string;
  status: "pending" | "approved" | "rejected";
  submittedBy: string;
  submittedOn: string;
  expectedAttendees: number;
  budget: string;
  sponsorNeeds?: string;
}

const MOCK_PROPOSALS: EventProposal[] = [
  {
    id: 1,
    title: "Nairobi Tech Week 2024",
    description: "A week-long festival celebrating technology and innovation in Nairobi.",
    category: "tech",
    estimatedDate: "2024-09-15",
    location: "KICC, Nairobi",
    status: "pending",
    submittedBy: "john.doe@example.com",
    submittedOn: "2024-05-01",
    expectedAttendees: 2500,
    budget: "$25,000 - $35,000",
    sponsorNeeds: "Looking for tech companies to sponsor venues and provide speakers."
  },
  {
    id: 2,
    title: "Kenyan Food Festival",
    description: "A celebration of traditional and modern Kenyan cuisine.",
    category: "food",
    estimatedDate: "2024-07-20",
    location: "Uhuru Gardens, Nairobi",
    status: "pending",
    submittedBy: "chef.alice@example.com",
    submittedOn: "2024-04-28",
    expectedAttendees: 1500,
    budget: "$15,000",
    sponsorNeeds: "Seeking food industry sponsors and local restaurant partnerships."
  },
  {
    id: 3,
    title: "Lake Victoria Music Festival",
    description: "A three-day music festival celebrating East African artists.",
    category: "music",
    estimatedDate: "2024-08-05",
    location: "Kisumu Lakefront",
    status: "approved",
    submittedBy: "music.promoter@example.com",
    submittedOn: "2024-04-15",
    expectedAttendees: 5000,
    budget: "$50,000",
    sponsorNeeds: "Looking for beverage sponsors and media partners."
  },
  {
    id: 4,
    title: "Nairobi Marathon 2024",
    description: "Annual marathon event through the streets of Nairobi.",
    category: "sports",
    estimatedDate: "2024-10-30",
    location: "Nairobi CBD",
    status: "rejected",
    submittedBy: "events@athleticskenya.com",
    submittedOn: "2024-04-10",
    expectedAttendees: 10000,
    budget: "$75,000",
    sponsorNeeds: "Seeking sportswear and nutrition company sponsorships."
  }
];

const ProposalManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedProposals, setSelectedProposals] = useState<number[]>([]);
  const [viewProposal, setViewProposal] = useState<EventProposal | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

  const handleApprove = (proposalId: number) => {
    toast.success(`Proposal #${proposalId} has been approved`);
    // In a real app, this would update the proposal status via API
  };

  const handleReject = (proposalId: number) => {
    toast.success(`Proposal #${proposalId} has been rejected`);
    // In a real app, this would update the proposal status via API
  };

  const handleDelete = (proposalId: number) => {
    toast.success(`Proposal #${proposalId} has been deleted`);
    // In a real app, this would delete the proposal via API
  };

  const filteredProposals = MOCK_PROPOSALS.filter(proposal => {
    const matchesSearch = 
      proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.submittedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
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

  const getStatusBadge = (status: string) => {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold">Event Proposals</h2>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="destructive" 
            size="sm"
            disabled={selectedProposals.length === 0}
            onClick={() => {
              toast.success(`${selectedProposals.length} proposal(s) deleted`);
              setSelectedProposals([]);
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Selected
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="border-green-500 text-green-600 hover:bg-green-50"
            disabled={selectedProposals.length === 0}
            onClick={() => {
              toast.success(`${selectedProposals.length} proposal(s) approved`);
              setSelectedProposals([]);
            }}
          >
            <Check className="h-4 w-4 mr-1" />
            Approve Selected
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="border-red-500 text-red-600 hover:bg-red-50"
            disabled={selectedProposals.length === 0}
            onClick={() => {
              toast.success(`${selectedProposals.length} proposal(s) rejected`);
              setSelectedProposals([]);
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Reject Selected
          </Button>
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
          value={statusFilter || ""} 
          onValueChange={(value) => setStatusFilter(value || null)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
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
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleReject(proposal.id)}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </>
                )}
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
                    <p className="text-sm">{viewProposal.location}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Estimated Date</h4>
                    <p className="text-sm">{viewProposal.estimatedDate}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Expected Attendees</h4>
                    <p className="text-sm">{viewProposal.expectedAttendees.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Budget</h4>
                    <p className="text-sm">{viewProposal.budget}</p>
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
                toast.success(`Email sent to ${viewProposal?.submittedBy}`);
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
                    setViewProposal(null);
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button 
                  variant="outline" 
                  className="border-red-500 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    handleReject(viewProposal.id);
                    setViewProposal(null);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProposalManagement;
