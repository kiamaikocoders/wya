
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { PlainLegalBody } from '@/components/legal/PlainLegalBody';
import { PRIVACY_POLICY_PLAIN } from '@/legal/legal-plain-text';
import { TERMS_EFFECTIVE_LABEL, CONTACT_PRIVACY_EMAIL, PRIVACY_POLICY_VERSION } from '@/legal/policy-versions';

const PrivacyPolicy = () => {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link to="/">
          <Button variant="ghost" className="pl-0 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <Card className="max-w-4xl mx-auto bg-gradient-to-br from-gradient-purple-medium/50 to-gradient-purple-bright/30/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Shield className="h-6 w-6 text-gradient-orange-accent" />
            Privacy Policy
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Effective {TERMS_EFFECTIVE_LABEL} · Version {PRIVACY_POLICY_VERSION} · Contact:{' '}
            <a className="underline" href={`mailto:${CONTACT_PRIVACY_EMAIL}`}>
              {CONTACT_PRIVACY_EMAIL}
            </a>
          </p>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[70vh]">
            <div className="pr-4">
              <PlainLegalBody text={PRIVACY_POLICY_PLAIN} />
              <div className="pt-6 text-sm text-right text-muted-foreground">
                Last updated: {TERMS_EFFECTIVE_LABEL}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
