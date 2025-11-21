import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, XCircle, Settings, Search, Loader2, ChevronLeft, ChevronRight, Trash2, MoreVertical, Download, FileText, Plus, Edit } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, AdminEvent } from '@/lib/admin-service';
import AdminCreateEvent from './AdminCreateEvent';
import AdminEditEvent from './AdminEditEvent';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const EventManagement = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);

  // Fetch event stats
  const { data: eventStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-event-stats'],
    queryFn: () => adminService.getEventStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch events
  const { data: eventsData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['admin-events', page, pageSize, searchQuery, categoryFilter, statusFilter],
    queryFn: () => adminService.getEvents({
      page,
      pageSize,
      search: searchQuery,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      status: statusFilter,
      sortBy: 'created_at',
      sortOrder: 'desc',
    }),
    keepPreviousData: true,
  });

  // Get unique categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ['event-categories'],
    queryFn: async () => {
      const { data } = await queryClient.fetchQuery({
        queryKey: ['admin-events', 1, 1000, '', 'all'],
        queryFn: () => adminService.getEvents({ page: 1, pageSize: 1000 }),
      });
      const categories = new Set(data?.data.map(e => e.category).filter(Boolean) || []);
      return Array.from(categories);
    },
  });

  // Approve event mutation
  const approveEventMutation = useMutation({
    mutationFn: (eventId: number) => adminService.approveEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
      setSelectedEvent(null);
      toast.success('Event approved');
    },
  });

  // Reject event mutation
  const rejectEventMutation = useMutation({
    mutationFn: (eventId: number) => adminService.rejectEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
      setSelectedEvent(null);
      toast.success('Event rejected');
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: number) => adminService.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
      setSelectedEvent(null);
      toast.success('Event deleted');
    },
  });

  // Bulk operations mutations
  const bulkApproveMutation = useMutation({
    mutationFn: (eventIds: number[]) => adminService.bulkApproveEvents(eventIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
      setSelectedEvents([]);
    },
  });

  const bulkRejectMutation = useMutation({
    mutationFn: (eventIds: number[]) => adminService.bulkRejectEvents(eventIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
      setSelectedEvents([]);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (eventIds: number[]) => adminService.bulkDeleteEvents(eventIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
      setSelectedEvents([]);
    },
  });

  const handleApprove = (eventId: number) => {
    approveEventMutation.mutate(eventId);
  };

  const handleReject = (eventId: number) => {
    if (confirm('Are you sure you want to reject this event?')) {
      rejectEventMutation.mutate(eventId);
    }
  };

  const handleDelete = (eventId: number) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      deleteEventMutation.mutate(eventId);
    }
  };

  // Real-time updates for events
  useEffect(() => {
    const channel = supabase
      .channel('admin-events-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-events'] });
          queryClient.invalidateQueries({ queryKey: ['admin-event-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {isLoadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventStats?.total_events || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{eventStats?.pending_events || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventStats?.events_this_month || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                KES {eventStats?.total_revenue.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Event Button */}
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Create Event Modal */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Create an event as an admin. All admin-created events are automatically approved.
            </DialogDescription>
          </DialogHeader>
          <AdminCreateEvent
            onSuccess={() => {
              setShowCreateForm(false);
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Event Modal */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update event details. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          {editingEvent && (
            <AdminEditEvent
              event={editingEvent}
              onSuccess={() => {
                setEditingEvent(null);
              }}
              onCancel={() => setEditingEvent(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search events by title, description, location..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select value={categoryFilter} onValueChange={(value) => {
          setCategoryFilter(value);
          setPage(1);
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoriesData?.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value: any) => {
          setStatusFilter(value);
          setPage(1);
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!eventsData?.data) return;
              try {
                const csv = await adminService.exportEventsToCSV(eventsData.data);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `events-export-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                toast.success('Events exported to CSV');
              } catch (error) {
                console.error('Error exporting CSV:', error);
                toast.error('Failed to export CSV');
              }
            }}
            disabled={!eventsData?.data || eventsData.data.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!eventsData?.data) return;
              try {
                await adminService.exportEventsToPDF(eventsData.data);
                toast.success('Events exported to PDF');
              } catch (error) {
                console.error('Error exporting PDF:', error);
                toast.error('Failed to export PDF');
              }
            }}
            disabled={!eventsData?.data || eventsData.data.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedEvents.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {selectedEvents.length} event(s) selected
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Approve ${selectedEvents.length} selected event(s)?`)) {
                          bulkApproveMutation.mutate(selectedEvents);
                        }
                      }}
                      disabled={bulkApproveMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve Selected
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Reject ${selectedEvents.length} selected event(s)?`)) {
                          bulkRejectMutation.mutate(selectedEvents);
                        }
                      }}
                      disabled={bulkRejectMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Selected
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete ${selectedEvents.length} selected event(s)? This cannot be undone.`)) {
                          bulkDeleteMutation.mutate(selectedEvents);
                        }
                      }}
                      disabled={bulkDeleteMutation.isPending}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEvents([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

      {/* Events Table */}
      {isLoadingEvents ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-kenya-orange" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
        <Card>
            <CardHeader>
              <CardTitle>Event Requests</CardTitle>
              <CardDescription>Manage and review event submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>
                  Showing {eventsData?.data.length || 0} of {eventsData?.total || 0} events
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedEvents.length === eventsData?.data.length && eventsData.data.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEvents(eventsData?.data.map(e => e.id) || []);
                          } else {
                            setSelectedEvents([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Organizer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tickets Sold</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventsData?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No events found
                      </TableCell>
                    </TableRow>
                  ) : (
                    eventsData?.data.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedEvents.includes(event.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedEvents([...selectedEvents, event.id]);
                              } else {
                                setSelectedEvents(selectedEvents.filter(id => id !== event.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            <div>{event.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {event.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.category || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>{event.organizer_name || 'Unknown'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {new Date(event.date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={event.status === 'approved' ? 'default' : 
                                    event.status === 'pending' ? 'outline' : 'destructive'}
                          >
                            {event.status || 'approved'}
                          </Badge>
                        </TableCell>
                        <TableCell>{event.tickets_sold || 0}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedEvent(event)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setEditingEvent(event)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {event.status === 'pending' && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => handleApprove(event.id)}
                                    className="text-green-600"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleReject(event.id)}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDelete(event.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        {/* Pagination */}
        {eventsData && eventsData.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {page} of {eventsData.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(eventsData.totalPages, p + 1))}
                  disabled={page === eventsData.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              Event details and management options
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Category</div>
                  <div>{selectedEvent.category || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Date</div>
                  <div>{new Date(selectedEvent.date).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Location</div>
                  <div>{selectedEvent.location}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Organizer</div>
                  <div>{selectedEvent.organizer_name || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Price</div>
                  <div>KES {selectedEvent.price || 0}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Tickets Sold</div>
                  <div>{selectedEvent.tickets_sold || 0} / {selectedEvent.capacity || '∞'}</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Description</div>
                <div className="text-sm">{selectedEvent.description || 'No description'}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedEvent?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => selectedEvent && handleReject(selectedEvent.id)}
                  disabled={rejectEventMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => selectedEvent && handleApprove(selectedEvent.id)}
                  disabled={approveEventMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
            <Button
              variant="destructive"
              onClick={() => selectedEvent && handleDelete(selectedEvent.id)}
              disabled={deleteEventMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventManagement;
