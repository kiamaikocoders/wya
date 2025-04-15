
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ContentModeration = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Moderation</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Content moderation tools will appear here.</p>
      </CardContent>
    </Card>
  );
};

export default ContentModeration;
