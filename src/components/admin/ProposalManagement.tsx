
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, Eye, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Mock proposal data - in a real app, this would come from your API
const mockProposals = [
  {
    id: 1,
    title: "Music Festival in Downtown",
    organizer: "John Smith",
    email: "john@example.com",
    status: "pending",
    date: "2025-06-15",
    description: "A three-day music festival featuring local bands and international artists.",
    budget: "$15,000",
    expectedAttendees: 500,
    location: "Central Park"
  },
  {
    id: 2,
    title: "Tech Conference 2025",
    organizer: "Sarah Johnson",
    email: "sarah@techconf.com",
    status: "approved",
    date: "2025-09-22",
    description: "Annual technology conference with keynote speakers, workshops, and networking events.",
    budget: "$25,000",
    expectedAttendees: 800,
    location: "Convention Center"
  },
  {
    id: 3,
    title: "Food & Wine Expo",
    organizer: "Michael Brown",
    email: "m.brown@foodexpo.com",
    status: "rejected",
    date: "2025-07-10",
    description: "Showcase of local cuisine and wines with chef demonstrations.",
    budget: "$12,000",
    expectedAttendees: 350,
    location: "City Hall"
  },
  {
    id: 4,
    title: "Charity Gala Dinner",
    organizer: "Lisa Chen",
    email: "lisa@charity.org",
    status: "pending",
    date: "2025-08-05",
    description: "Annual fundraiser for children's education with silent auction and entertainment.",
    budget: "$30,000",
    expectedAttendees: 200,
    location: "Grand Hotel"
  },
];

const ProposalManagement = () => {
  const [proposals, setProposals] = useState(mockProposals);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  
  const handleStatusChange = (id: number, newStatus: string) => {
    setProposals(proposals.map(proposal => 
      proposal.id === id ? { ...proposal, status: newStatus } : proposal
    ));
    
    const action = newStatus === 'approved' ? 'approved' : 'rejected';
    toast.success(`Proposal ${action} successfully`);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Event Proposals</h2>
          <p className="text-muted-foreground">Manage event proposals from organizers</p>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Pending Review</CardTitle>
          <CardDescription>
            Event proposals awaiting your approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of event proposals</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell className="font-medium">{proposal.title}</TableCell>
                  <TableCell>{proposal.organizer}</TableCell>
                  <TableCell>{proposal.date}</TableCell>
                  <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedProposal(proposal)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{selectedProposal?.title}</DialogTitle>
                            <DialogDescription>
                              Proposal details
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedProposal && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                              <div>
                                <h4 className="font-medium text-sm">Organizer</h4>
                                <p>{selectedProposal.organizer}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">Contact</h4>
                                <p>{selectedProposal.email}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">Date</h4>
                                <p>{selectedProposal.date}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">Location</h4>
                                <p>{selectedProposal.location}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">Budget</h4>
                                <p>{selectedProposal.budget}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">Expected Attendees</h4>
                                <p>{selectedProposal.expectedAttendees}</p>
                              </div>
                              <div className="col-span-2">
                                <h4 className="font-medium text-sm">Description</h4>
                                <p className="text-sm mt-1">{selectedProposal.description}</p>
                              </div>
                              
                              <div className="col-span-2 flex justify-end gap-2 pt-4">
                                <Button
                                  variant="outline"
                                  className="border-green-500 text-green-500 hover:bg-green-50"
                                  onClick={() => handleStatusChange(selectedProposal.id, 'approved')}
                                  disabled={selectedProposal.status === 'approved'}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  className="border-red-500 text-red-500 hover:bg-red-50"
                                  onClick={() => handleStatusChange(selectedProposal.id, 'rejected')}
                                  disabled={selectedProposal.status === 'rejected'}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {proposal.status === 'pending' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-green-500"
                            onClick={() => handleStatusChange(proposal.id, 'approved')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500"
                            onClick={() => handleStatusChange(proposal.id, 'rejected')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      {proposal.status === 'approved' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.location.href = `/events/${proposal.id}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            View All Proposals
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProposalManagement;
