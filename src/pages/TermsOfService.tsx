
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookText } from 'lucide-react';

const TermsOfService = () => {
  // Scroll to top when component mounts
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
      
      <Card className="max-w-4xl mx-auto bg-kenya-brown/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BookText className="h-6 w-6 text-kenya-orange" />
            Terms of Service
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6 pr-4">
              <section>
                <h2 className="text-xl font-medium mb-2">1. Acceptance of Terms</h2>
                <p>
                  Welcome to WYA Kenya ("we," "our," or "us"). By accessing or using our website, mobile 
                  application, and services (collectively, the "Services"), you agree to be bound by these 
                  Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Services.
                </p>
                <p className="mt-2">
                  These Terms constitute a legally binding agreement between you and WYA Kenya regarding your 
                  use of the Services. Please read them carefully.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">2. Eligibility</h2>
                <p>
                  You must be at least 18 years old to use our Services. By using our Services, you represent 
                  and warrant that you are at least 18 years old and have the legal capacity to enter into 
                  these Terms.
                </p>
                <p className="mt-2">
                  If you are using the Services on behalf of a company, organization, or other entity, you 
                  represent and warrant that you have the authority to bind such entity to these Terms.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">3. User Accounts</h2>
                <p>
                  To access certain features of our Services, you may need to create an account. You are 
                  responsible for maintaining the confidentiality of your account credentials and for all 
                  activities that occur under your account.
                </p>
                <p className="mt-2">
                  You agree to:
                </p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Provide accurate, current, and complete information when creating your account</li>
                  <li>Update your information to keep it accurate, current, and complete</li>
                  <li>Notify us immediately of any unauthorized use of your account or any other security breach</li>
                  <li>Use a strong password and keep it confidential</li>
                  <li>Be solely responsible for all activities that occur under your account</li>
                </ul>
                <p className="mt-2">
                  We reserve the right to suspend or terminate your account at any time for any reason, including 
                  if we suspect that you have violated these Terms.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">4. Event Listings and Registrations</h2>
                <h3 className="text-md font-medium mt-4 mb-1">4.1 Event Listings</h3>
                <p>
                  Our platform allows event organizers to list events and users to discover and register for 
                  those events. We do not organize, host, or manage these events ourselves, unless explicitly 
                  stated otherwise.
                </p>
                <p className="mt-2">
                  While we strive to ensure that event information is accurate and up-to-date, we cannot 
                  guarantee the accuracy, completeness, or quality of any event listed on our platform. We 
                  are not responsible for any errors or omissions in event listings.
                </p>
                
                <h3 className="text-md font-medium mt-4 mb-1">4.2 Event Registrations and Payments</h3>
                <p>
                  When you register for an event through our platform, you are entering into an agreement with 
                  the event organizer, not with us. We act as a platform that facilitates the transaction between 
                  you and the event organizer.
                </p>
                <p className="mt-2">
                  By registering for an event, you agree to comply with the terms, conditions, and policies 
                  set by the event organizer, including any event-specific rules, refund policies, and codes 
                  of conduct.
                </p>
                <p className="mt-2">
                  When you make a payment for an event, we may use third-party payment processors to process 
                  your payment. Your use of these payment services is subject to the terms and privacy policies 
                  of those third-party providers.
                </p>
                
                <h3 className="text-md font-medium mt-4 mb-1">4.3 Cancellations and Refunds</h3>
                <p>
                  Cancellation and refund policies are set by event organizers, not by us. Please review the 
                  specific refund policy for each event before registering. We are not responsible for refunds 
                  or disputes between you and event organizers.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">5. User Content</h2>
                <p>
                  Our Services allow you to post, upload, share, and store content, including but not limited 
                  to text, photos, videos, and comments ("User Content").
                </p>
                
                <h3 className="text-md font-medium mt-4 mb-1">5.1 Ownership and License</h3>
                <p>
                  You retain ownership of any intellectual property rights that you hold in your User Content. 
                  By posting User Content on or through our Services, you grant us a worldwide, non-exclusive, 
                  royalty-free license (with the right to sublicense) to use, copy, reproduce, process, adapt, 
                  modify, publish, transmit, display, and distribute such User Content in any and all media or 
                  distribution methods now known or later developed.
                </p>
                
                <h3 className="text-md font-medium mt-4 mb-1">5.2 Responsibility for User Content</h3>
                <p>
                  You are solely responsible for your User Content and the consequences of posting or publishing 
                  it. You represent and warrant that:
                </p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>You own or have the necessary rights to use and authorize us to use your User Content</li>
                  <li>Your User Content does not violate these Terms, applicable law, or the rights of any third party</li>
                  <li>Your User Content is accurate and not misleading</li>
                </ul>
                
                <h3 className="text-md font-medium mt-4 mb-1">5.3 Prohibited Content</h3>
                <p>
                  You agree not to post or share User Content that:
                </p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Is illegal, harmful, threatening, abusive, harassing, defamatory, or invasive of privacy</li>
                  <li>Infringes on the intellectual property rights of others</li>
                  <li>Contains software viruses or any other malicious code</li>
                  <li>Is false, misleading, or fraudulent</li>
                  <li>Promotes discrimination, bigotry, racism, hatred, or harm against any individual or group</li>
                  <li>Is pornographic, obscene, or contains sexually explicit material</li>
                  <li>Promotes illegal activities or harmful substances</li>
                </ul>
                
                <h3 className="text-md font-medium mt-4 mb-1">5.4 Content Moderation</h3>
                <p>
                  We reserve the right, but are not obligated, to monitor, review, and remove User Content at 
                  our sole discretion. We may remove or refuse to display content that we believe violates these 
                  Terms or applicable laws.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">6. Prohibited Activities</h2>
                <p>
                  In addition to the prohibitions related to User Content, you agree not to:
                </p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Use the Services for any illegal purpose or in violation of any local, state, national, or international law</li>
                  <li>Harass, abuse, or harm another person</li>
                  <li>Impersonate another user or person</li>
                  <li>Interfere with or disrupt the Services or servers or networks connected to the Services</li>
                  <li>Attempt to gain unauthorized access to any portion of the Services</li>
                  <li>Collect or harvest any information from the Services, including email addresses</li>
                  <li>Use the Services to send unauthorized advertising or spam</li>
                  <li>Decompile, reverse engineer, or otherwise attempt to obtain the source code of the Services</li>
                  <li>Use automated scripts to collect information from or interact with the Services</li>
                </ul>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">7. Intellectual Property Rights</h2>
                <p>
                  The Services and their original content (excluding User Content), features, and functionality 
                  are and will remain the exclusive property of WYA Kenya and its licensors. The Services are 
                  protected by copyright, trademark, and other laws.
                </p>
                <p className="mt-2">
                  Our trademarks and trade dress may not be used in connection with any product or service without 
                  our prior written consent.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">8. Termination</h2>
                <p>
                  We may terminate or suspend your account and access to the Services immediately, without prior 
                  notice or liability, for any reason, including if you breach these Terms.
                </p>
                <p className="mt-2">
                  Upon termination, your right to use the Services will immediately cease. All provisions of these 
                  Terms which by their nature should survive termination shall survive, including ownership provisions, 
                  warranty disclaimers, indemnity, and limitations of liability.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">9. Disclaimers</h2>
                <p className="uppercase">
                  THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER 
                  EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, 
                  FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
                </p>
                <p className="mt-2 uppercase">
                  WE DO NOT WARRANT THAT (1) THE SERVICES WILL MEET YOUR REQUIREMENTS, (2) THE SERVICES WILL BE 
                  UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE, (3) THE RESULTS THAT MAY BE OBTAINED FROM THE 
                  USE OF THE SERVICES WILL BE ACCURATE OR RELIABLE, OR (4) ANY ERRORS IN THE SERVICES WILL BE 
                  CORRECTED.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">10. Limitation of Liability</h2>
                <p className="uppercase">
                  IN NO EVENT SHALL WYA KENYA, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES, 
                  BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, INCLUDING 
                  WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING 
                  FROM (1) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES; (2) ANY CONDUCT 
                  OR CONTENT OF ANY THIRD PARTY ON THE SERVICES; (3) ANY CONTENT OBTAINED FROM THE SERVICES; AND 
                  (4) UNAUTHORIZED ACCESS, USE OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">11. Indemnification</h2>
                <p>
                  You agree to defend, indemnify, and hold harmless WYA Kenya, its directors, employees, 
                  partners, agents, suppliers, and affiliates, from and against any and all claims, damages, 
                  obligations, losses, liabilities, costs or debt, and expenses (including but not limited to 
                  attorney's fees) arising from: (1) your use of and access to the Services; (2) your violation 
                  of any term of these Terms; (3) your violation of any third-party right, including without 
                  limitation any copyright, property, or privacy right; or (4) any claim that your User Content 
                  caused damage to a third party.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">12. Governing Law</h2>
                <p>
                  These Terms shall be governed and construed in accordance with the laws of Kenya, without 
                  regard to its conflict of law provisions.
                </p>
                <p className="mt-2">
                  Any disputes arising under or in connection with these Terms shall be subject to the exclusive 
                  jurisdiction of the courts located in Nairobi, Kenya.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">13. Changes to Terms</h2>
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If 
                  a revision is material, we will provide at least 30 days' notice prior to any new terms taking 
                  effect. What constitutes a material change will be determined at our sole discretion.
                </p>
                <p className="mt-2">
                  By continuing to access or use our Services after any revisions become effective, you agree to 
                  be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized 
                  to use the Services.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">14. Contact Us</h2>
                <p>
                  If you have any questions about these Terms, please contact us at:
                </p>
                <div className="mt-2">
                  <p><strong>Email:</strong> legal@wyakenya.com</p>
                  <p><strong>Address:</strong> WYA Kenya Inc., P.O. Box 12345, Nairobi, Kenya</p>
                  <p><strong>Phone:</strong> +254 700 123 456</p>
                </div>
              </section>
              
              <div className="pt-4 text-sm text-right text-muted-foreground">
                Last Updated: April 18, 2024
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsOfService;
