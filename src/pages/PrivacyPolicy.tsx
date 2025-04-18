
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPolicy = () => {
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
            <Shield className="h-6 w-6 text-kenya-orange" />
            Privacy Policy
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6 pr-4">
              <section>
                <h2 className="text-xl font-medium mb-2">Introduction</h2>
                <p>
                  Welcome to WYA Kenya ("we," "our," or "us"). We are committed to protecting your privacy 
                  and handling your personal information with transparency and care. This Privacy Policy 
                  outlines how we collect, use, store, and share information when you use our 
                  website and services.
                </p>
                <p className="mt-2">
                  By using our service, you consent to the practices described in this policy. Please read it 
                  carefully and contact us if you have any questions.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">Information We Collect</h2>
                <p>We collect the following types of information:</p>
                
                <h3 className="text-md font-medium mt-4 mb-1">1. Personal Information</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Name and contact information (email address, phone number)</li>
                  <li>Account credentials</li>
                  <li>Profile information (profile picture, bio)</li>
                  <li>Payment information (processed securely through our payment providers)</li>
                </ul>
                
                <h3 className="text-md font-medium mt-4 mb-1">2. Usage Information</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Events you browse, save, or register for</li>
                  <li>Content you post, including reviews, comments, and media</li>
                  <li>Communications with other users and event organizers</li>
                </ul>
                
                <h3 className="text-md font-medium mt-4 mb-1">3. Device and Log Information</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>IP address and device identifiers</li>
                  <li>Browser type and settings</li>
                  <li>Operating system</li>
                  <li>Referring/exit pages and URLs</li>
                  <li>Date and time of access</li>
                </ul>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">How We Use Your Information</h2>
                <p>We use your information for the following purposes:</p>
                
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Providing and improving our services</li>
                  <li>Processing event registrations and payments</li>
                  <li>Personalizing your experience and content</li>
                  <li>Facilitating communication between users and organizers</li>
                  <li>Sending important notifications about events and our service</li>
                  <li>Marketing and promoting events and our platform</li>
                  <li>Analyzing usage patterns to improve our platform</li>
                  <li>Ensuring platform security and preventing fraud</li>
                  <li>Complying with legal obligations</li>
                </ul>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">Information Sharing and Disclosure</h2>
                <p>We may share your information with:</p>
                
                <h3 className="text-md font-medium mt-4 mb-1">1. Event Organizers</h3>
                <p>
                  When you register for an event, we share your registration information with the event 
                  organizer to facilitate your participation.
                </p>
                
                <h3 className="text-md font-medium mt-4 mb-1">2. Service Providers</h3>
                <p>
                  We use third-party service providers to help us operate our business and the platform, 
                  such as payment processors, email service providers, and analytics services.
                </p>
                
                <h3 className="text-md font-medium mt-4 mb-1">3. Legal Requirements</h3>
                <p>
                  We may disclose your information if required to do so by law or in response to valid 
                  legal requests, such as subpoenas, court orders, or government regulations.
                </p>
                
                <h3 className="text-md font-medium mt-4 mb-1">4. Business Transfers</h3>
                <p>
                  If we are involved in a merger, acquisition, or sale of all or a portion of our assets, 
                  your information may be transferred as part of that transaction.
                </p>
                
                <h3 className="text-md font-medium mt-4 mb-1">5. With Your Consent</h3>
                <p>
                  We may share your information with third parties when you explicitly consent to such sharing.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">Data Security</h2>
                <p>
                  We implement appropriate security measures to protect against unauthorized access, alteration, 
                  disclosure, or destruction of your personal information. These measures include internal 
                  reviews of our data collection, storage, and processing practices and security measures, 
                  as well as physical security measures to guard against unauthorized access to systems 
                  where we store personal data.
                </p>
                <p className="mt-2">
                  However, no method of transmission over the Internet or electronic storage is 100% secure. 
                  Therefore, while we strive to protect your personal information, we cannot guarantee its 
                  absolute security.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">Your Rights and Choices</h2>
                <p>Depending on your location, you may have the following rights:</p>
                
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate or incomplete information</li>
                  <li>Delete your personal information</li>
                  <li>Restrict or object to certain processing activities</li>
                  <li>Receive a copy of your information in a structured, machine-readable format</li>
                  <li>Withdraw consent where processing is based on consent</li>
                </ul>
                
                <p className="mt-2">
                  To exercise these rights, please contact us using the information provided in the 
                  "Contact Us" section below.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">Cookies and Similar Technologies</h2>
                <p>
                  We use cookies and similar technologies to enhance your experience, analyze trends, 
                  administer the website, track users' movements around the website, and gather demographic 
                  information about our user base as a whole.
                </p>
                <p className="mt-2">
                  You can control cookies through your browser settings and other tools. However, disabling 
                  cookies may limit your ability to use certain features of our platform.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">Children's Privacy</h2>
                <p>
                  Our services are not directed to individuals under the age of 18. We do not knowingly 
                  collect personal information from children. If you are a parent or guardian and believe 
                  that your child has provided us with personal information, please contact us so that 
                  we can delete such information.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">Changes to This Privacy Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by 
                  posting the new Privacy Policy on this page and updating the "Last Updated" date at the top 
                  of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes.
                </p>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-medium mb-2">Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <div className="mt-2">
                  <p><strong>Email:</strong> privacy@wyakenya.com</p>
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

export default PrivacyPolicy;
