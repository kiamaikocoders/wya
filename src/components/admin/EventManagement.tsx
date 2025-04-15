
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, XCircle, Settings } from 'lucide-react';

const EventManagement = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-kenya-orange" />
            Pending Event Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div>
                <h3 className="font-medium">Tech Conference 2024</h3>
                <p className="text-sm text-muted-foreground">From: John Doe</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </Button>
                <Button size="sm" variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-kenya-orange" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button className="w-full justify-start" variant="outline">
              Review Featured Events
            </Button>
            <Button className="w-full justify-start" variant="outline">
              Manage Categories
            </Button>
            <Button className="w-full justify-start" variant="outline">
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventManagement;
