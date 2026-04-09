import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { feedbackService, FEEDBACK_CATEGORIES, type FeedbackCategory } from '@/lib/feedback-service';
import { toast } from 'sonner';

const categoryLabels: Record<FeedbackCategory, string> = {
  bug: 'Something is broken',
  idea: 'Feature suggestion',
  general: 'General feedback',
  other: 'Other',
};

const FeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSubmitting(true);
    try {
      await feedbackService.submit(user.id, {
        category,
        message,
        pagePath: `${location.pathname}${location.search}`,
      });
      toast.success('Thanks — we received your feedback.');
      setMessage('');
      setCategory('general');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Could not send feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-promo pb-20">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          <Button variant="ghost" asChild className="text-white hover:bg-white/10">
            <Link to="/home" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button variant="ghost" asChild className="text-white hover:bg-white/10">
            <Link to="/settings">Settings</Link>
          </Button>
        </div>

        <Card className="border-white/20 bg-gradient-promo shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Send feedback</CardTitle>
            <CardDescription className="text-text-white/70">
              Tell us what works, what does not, or what you would like to see next. You can also email{' '}
              <a href="mailto:support@wyakenya.com" className="text-kenya-orange underline">
                support@wyakenya.com
              </a>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white">Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as FeedbackCategory)}
                >
                  <SelectTrigger className="border-kenya-brown/30 bg-black/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEEDBACK_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {categoryLabels[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Message</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the issue or idea in as much detail as you can."
                  rows={8}
                  className="border-kenya-brown/30 bg-black/20 text-white placeholder:text-text-white/40"
                  maxLength={8000}
                  required
                />
                <p className="text-xs text-text-white/60">{message.length} / 8000</p>
              </div>

              <Button
                type="submit"
                disabled={submitting || message.trim().length === 0}
                className="w-full gap-2 bg-kenya-orange hover:bg-kenya-orange/90 sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit feedback
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeedbackPage;
