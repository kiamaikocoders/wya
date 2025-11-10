
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Heart, Twitter, Facebook, Instagram, Linkedin, Github, Mail, ChevronDown, ChevronUp } from 'lucide-react';

const Footer = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [desktopSections, setDesktopSections] = useState<Record<string, boolean>>({
    quickLinks: false,
    support: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <footer className="bg-kenya-brown-dark py-5 md:py-8 px-4 md:px-8 mt-auto">
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Mobile: Collapsible sections */}
        <div className="block md:hidden space-y-3">
          {/* WYA Kenya Section */}
          <div className="space-y-3">
            <h3 className="text-white text-base font-semibold">WYA Kenya</h3>
            <p className="text-kenya-brown-light text-sm leading-relaxed">
              Discover the best events happening in Kenya. 
              Connect with organizers and other attendees.
            </p>
            <div className="flex space-x-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-kenya-brown-light hover:text-kenya-orange transition-colors">
                <Twitter size={20} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-kenya-brown-light hover:text-kenya-orange transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-kenya-brown-light hover:text-kenya-orange transition-colors">
                <Instagram size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-kenya-brown-light hover:text-kenya-orange transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links - Collapsible */}
          <div>
            <button
              onClick={() => toggleSection('quickLinks')}
              className="flex items-center justify-between w-full text-white text-base font-semibold mb-3"
            >
              Quick Links
              {expandedSections.quickLinks ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.quickLinks && (
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Link to="/" className="text-kenya-brown-light hover:text-white transition-colors">Home</Link>
                </li>
                <li>
                  <Link to="/events" className="text-kenya-brown-light hover:text-white transition-colors">Events</Link>
                </li>
                <li>
                  <Link to="/request-event" className="text-kenya-brown-light hover:text-white transition-colors">Submit Event</Link>
                </li>
                <li>
                  <Link to="/stories" className="text-kenya-brown-light hover:text-white transition-colors">Stories</Link>
                </li>
                <li>
                  <Link to="/forum" className="text-kenya-brown-light hover:text-white transition-colors">Forum</Link>
                </li>
              </ul>
            )}
          </div>

          {/* Support - Collapsible */}
          <div>
            <button
              onClick={() => toggleSection('support')}
              className="flex items-center justify-between w-full text-white text-base font-semibold mb-3"
            >
              Support
              {expandedSections.support ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.support && (
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Link to="/ai-assistance" className="text-kenya-brown-light hover:text-white transition-colors">AI Assistance</Link>
                </li>
                <li>
                  <a href="mailto:support@wyakenya.com" className="text-kenya-brown-light hover:text-white transition-colors">Contact Support</a>
                </li>
                <li>
                  <Link to="/privacy-policy" className="text-kenya-brown-light hover:text-white transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/terms-of-service" className="text-kenya-brown-light hover:text-white transition-colors">Terms of Service</Link>
                </li>
                <li>
                  <a href="#" className="text-kenya-brown-light hover:text-white transition-colors">FAQ</a>
                </li>
              </ul>
            )}
          </div>

          {/* Newsletter - Collapsible */}
          <div>
            <button
              onClick={() => toggleSection('newsletter')}
              className="flex items-center justify-between w-full text-white text-base font-semibold mb-3"
            >
              Newsletter
              {expandedSections.newsletter ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.newsletter && (
              <div className="space-y-3">
                <p className="text-kenya-brown-light text-sm leading-relaxed">
                  Subscribe to our newsletter for the latest events and updates.
                </p>
                <div className="flex">
                  <input 
                    type="email" 
                    placeholder="Your email address" 
                    className="bg-kenya-dark/50 border border-kenya-brown text-white placeholder:text-kenya-brown-light rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-kenya-orange w-full"
                  />
                  <button 
                    className="bg-kenya-orange hover:bg-kenya-orange/90 text-white rounded-r-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-kenya-orange"
                  >
                    <Mail size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8">
          <div className="space-y-3">
            <h3 className="text-white text-lg font-semibold">WYA Kenya</h3>
            <p className="text-kenya-brown-light text-sm leading-relaxed">
              Discover the best events happening in Kenya. 
              Connect with organizers and other attendees.
            </p>
            <div className="flex space-x-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-kenya-brown-light hover:text-kenya-orange transition-colors">
                <Twitter size={20} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-kenya-brown-light hover:text-kenya-orange transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-kenya-brown-light hover:text-kenya-orange transition-colors">
                <Instagram size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-kenya-brown-light hover:text-kenya-orange transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <button
              onClick={() =>
                setDesktopSections(prev => ({ ...prev, quickLinks: !prev.quickLinks }))
              }
              className="group flex w-full items-center justify-between text-left text-white text-base font-semibold uppercase tracking-wide"
            >
              Quick Links
              {desktopSections.quickLinks ? (
                <ChevronUp className="h-4 w-4 text-kenya-orange transition-transform group-hover:translate-y-[-2px]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-kenya-orange transition-transform group-hover:translate-y-[2px]" />
              )}
            </button>
            {desktopSections.quickLinks && (
              <ul className="mt-3 space-y-1.5 text-sm">
              <li>
                <Link to="/" className="text-kenya-brown-light hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/events" className="text-kenya-brown-light hover:text-white transition-colors">Events</Link>
              </li>
              <li>
                <Link to="/request-event" className="text-kenya-brown-light hover:text-white transition-colors">Submit Event</Link>
              </li>
              <li>
                <Link to="/stories" className="text-kenya-brown-light hover:text-white transition-colors">Stories</Link>
              </li>
              <li>
                <Link to="/forum" className="text-kenya-brown-light hover:text-white transition-colors">Forum</Link>
              </li>
            </ul>
            )}
          </div>
          
          <div>
            <button
              onClick={() =>
                setDesktopSections(prev => ({ ...prev, support: !prev.support }))
              }
              className="group flex w-full items-center justify-between text-left text-white text-base font-semibold uppercase tracking-wide"
            >
              Support
              {desktopSections.support ? (
                <ChevronUp className="h-4 w-4 text-kenya-orange transition-transform group-hover:translate-y-[-2px]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-kenya-orange transition-transform group-hover:translate-y-[2px]" />
              )}
            </button>
            {desktopSections.support && (
              <ul className="mt-3 space-y-1.5 text-sm">
              <li>
                <Link to="/ai-assistance" className="text-kenya-brown-light hover:text-white transition-colors">AI Assistance</Link>
              </li>
              <li>
                <a href="mailto:support@wyakenya.com" className="text-kenya-brown-light hover:text-white transition-colors">Contact Support</a>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-kenya-brown-light hover:text-white transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-kenya-brown-light hover:text-white transition-colors">Terms of Service</Link>
              </li>
              <li>
                <a href="#" className="text-kenya-brown-light hover:text-white transition-colors">FAQ</a>
              </li>
            </ul>
            )}
          </div>
          
          <div className="space-y-3">
            <h3 className="text-white text-base font-semibold uppercase tracking-wide">Newsletter</h3>
            <p className="text-kenya-brown-light text-sm leading-relaxed">
              Subscribe to our newsletter for the latest events and updates.
            </p>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="bg-kenya-dark/50 border border-kenya-brown text-white placeholder:text-kenya-brown-light rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-kenya-orange w-full"
              />
              <button 
                className="bg-kenya-orange hover:bg-kenya-orange/90 text-white rounded-r-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-kenya-orange"
              >
                <Mail size={20} />
              </button>
            </div>
          </div>
        </div>
        
        <Separator className="my-6 bg-kenya-brown-light/20" />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-kenya-brown-light text-xs md:text-sm">
            © {new Date().getFullYear()} WYA Kenya. All rights reserved.
          </p>
          <div className="flex items-center">
            <p className="text-kenya-brown-light text-xs md:text-sm flex items-center">
              Made with <Heart className="h-4 w-4 text-kenya-orange mx-1" /> in Kenya
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
