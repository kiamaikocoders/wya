import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { LegalHeroFormShell } from '@/components/legal/LegalPageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SUPPORT_EMAIL } from '@/legal/legal-page-content';
import { toast } from 'sonner';

const fieldClass =
  'h-12 rounded-[14px] border-[#dbe0e5] bg-[#f9f9fa] text-[#1a1f24] placeholder:text-[#8c949e] focus-visible:ring-[#ff6b35]';

const ContactSupport = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !email.trim() || !subject.trim()) {
      toast.error('Please fill in email, subject, and message.');
      return;
    }
    setSubmitting(true);
    const body = [
      `Name: ${firstName} ${lastName}`.trim(),
      `Phone: ${phone || '—'}`,
      `Email: ${email}`,
      '',
      message.trim(),
    ].join('\n');
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    toast.success('Opening your email client…');
    setSubmitting(false);
  };

  return (
    <LegalHeroFormShell
      heroSrc="/legal/contact-hero.jpg"
      heroAlt="People at a nightlife venue"
      left={
        <>
          <p className="text-[13px] font-semibold text-[#ff6b35]">( CONTACT )</p>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-[40px] sm:leading-[48px]">
            Get in Touch With Us
          </h1>
          <p className="mt-4 text-base leading-[26px] text-[#ebf0f5]">
            Need help with tickets, your account, nights out, or partnering with WYA? Send a message
            — we usually reply within 24 hours.
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-semibold text-[#ff6b35]">Email</span>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-white hover:underline">
                {SUPPORT_EMAIL}
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-semibold text-[#ff6b35]">Hours</span>
              <span className="font-medium text-white">Mon–Sat · 9am–7pm EAT</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-semibold text-[#ff6b35]">Based in</span>
              <span className="font-medium text-white">Nairobi, Kenya</span>
            </div>
          </div>
        </>
      }
    >
      <h2 className="text-[28px] font-bold text-[#1a1f24]">Send a message</h2>
      <form onSubmit={handleSubmit} className="mt-[18px] space-y-[18px]">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold text-[#404752]">First Name</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Amina"
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold text-[#404752]">Last Name</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Wanjiru"
              className={fieldClass}
            />
          </div>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold text-[#404752]">Phone Number</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 700 000 000"
              type="tel"
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
              required
              className={fieldClass}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-[13px] font-semibold text-[#404752]">Subject</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Tickets, account, or event help"
            required
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[13px] font-semibold text-[#404752]">Message</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us how we can help…"
            required
            rows={5}
            className="min-h-[120px] rounded-[14px] border-[#dbe0e5] bg-[#f9f9fa] text-[#1a1f24] placeholder:text-[#8c949e] focus-visible:ring-[#ff6b35]"
          />
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="h-12 w-full rounded-full bg-[#ff6b35] text-base font-semibold text-white hover:bg-[#ff6b35]/90"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening…
            </>
          ) : (
            'Submit'
          )}
        </Button>
      </form>
    </LegalHeroFormShell>
  );
};

export default ContactSupport;
