import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { LegalHeroFormShell } from '@/components/legal/LegalPageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { feedbackService, FEEDBACK_CATEGORIES, type FeedbackCategory } from '@/lib/feedback-service';
import { SUPPORT_EMAIL } from '@/legal/legal-page-content';
import { toast } from 'sonner';

const categoryLabels: Record<FeedbackCategory, string> = {
  bug: 'Something is broken',
  idea: 'Feature suggestion',
  general: 'General feedback',
  other: 'Other',
};

const fieldClass =
  'h-12 rounded-[14px] border-[#dbe0e5] bg-[#f9f9fa] text-[#1a1f24] placeholder:text-[#8c949e] focus-visible:ring-[#ff6b35]';

const FeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length === 0) {
      toast.error('Please write a message.');
      return;
    }
    setSubmitting(true);
    try {
      if (user?.id) {
        const prefixed =
          name.trim() || email.trim()
            ? `[From: ${name.trim() || '—'} · ${email.trim() || user.email || '—'}]\n\n${message.trim()}`
            : message.trim();
        await feedbackService.submit(user.id, {
          category,
          message: prefixed,
          pagePath: `${location.pathname}${location.search}`,
        });
        toast.success('Thanks — we received your feedback.');
      } else {
        const body = [
          `Name: ${name.trim() || '—'}`,
          `Email: ${email.trim() || '—'}`,
          `Category: ${categoryLabels[category]}`,
          '',
          message.trim(),
        ].join('\n');
        window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
          `WYA feedback: ${categoryLabels[category]}`
        )}&body=${encodeURIComponent(body)}`;
        toast.success('Opening your email client…');
      }
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
    <LegalHeroFormShell
      heroSrc="/legal/feedback-hero.jpg"
      heroAlt="Friends celebrating together"
      left={
        <>
          <p className="text-[13px] font-semibold text-[#ff6b35]">( FEEDBACK )</p>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-[40px] sm:leading-[48px]">
            Help Us Make WYA Better
          </h1>
          <p className="mt-4 text-base leading-[26px] text-[#ebf0f5]">
            Share a bug, idea, or general thought. Every note goes to the WYA product team.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-6 inline-block text-sm font-medium text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
          >
            {SUPPORT_EMAIL}
          </a>
          {!user && (
            <p className="mt-4 text-sm text-white/70">
              <Link to="/login" className="text-[#ff6b35] underline">
                Sign in
              </Link>{' '}
              to submit feedback in-app, or send via email.
            </p>
          )}
        </>
      }
    >
      <h2 className="text-[28px] font-bold text-[#1a1f24]">Send feedback</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#404752]">
        Tell us what works, what doesn’t, or what you’d love to see next. We read every note.
      </p>
      <form onSubmit={handleSubmit} className="mt-5 space-y-[18px]">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold text-[#404752]">Your Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold text-[#404752]">Email Address</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              type="email"
              className={fieldClass}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-[13px] font-semibold text-[#404752]">Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>
            <SelectTrigger className={fieldClass}>
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
          <Label className="text-[13px] font-semibold text-[#404752]">Message</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the issue or idea in as much detail as you can."
            rows={6}
            maxLength={8000}
            required
            className="min-h-[140px] rounded-[14px] border-[#dbe0e5] bg-[#f9f9fa] text-[#1a1f24] placeholder:text-[#8c949e] focus-visible:ring-[#ff6b35]"
          />
          <p className="text-xs text-[#8c949e]">
            Be as specific as you like · {message.length} / 8000
          </p>
        </div>
        <Button
          type="submit"
          disabled={submitting || message.trim().length === 0}
          className="h-12 w-full rounded-full bg-[#ff6b35] text-base font-semibold text-white hover:bg-[#ff6b35]/90"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            'Submit feedback'
          )}
        </Button>
      </form>
    </LegalHeroFormShell>
  );
};

export default FeedbackPage;
