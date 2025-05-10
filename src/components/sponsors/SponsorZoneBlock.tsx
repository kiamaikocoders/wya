import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  SponsorContentBlock, 
  SponsorContentBlockType, 
  sponsorService,
  Sponsor
} from '@/lib/sponsor';
import { getSponsorColorVars, getSponsorClasses } from '@/lib/sponsor/brand-utils';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Calendar, Clock, Gift, PieChart, Play, ShoppingBag, Timer, Video } from 'lucide-react';

interface SponsorZoneBlockProps {
  block: SponsorContentBlock;
  sponsorId: number;
  sponsor?: Sponsor | null;
}

const SponsorZoneBlock: React.FC<SponsorZoneBlockProps> = ({ block, sponsorId, sponsor }) => {
  const { user, isAuthenticated } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const isExpired = block.expires_at ? new Date(block.expires_at) < new Date() : false;
  const colorVars = getSponsorColorVars(sponsor);
  
  // Function to get sponsor-branded button style
  const getBrandedButtonStyle = (variant: 'default' | 'outline' = 'default') => {
    if (!sponsor?.brand_color) return {};
    
    return variant === 'default' 
      ? { background: sponsor.brand_color, borderColor: sponsor.brand_color }
      : { borderColor: sponsor.brand_color, color: sponsor.brand_color };
  };
  
  const formatExpiration = () => {
    if (!block.expires_at) return null;
    
    const expiryDate = new Date(block.expires_at);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return "Expired";
    if (diffDays === 1) return "Expires today!";
    if (diffDays < 7) return `${diffDays} days left`;
    
    return `Expires on ${expiryDate.toLocaleDateString()}`;
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Please log in to participate");
      return;
    }
    
    if (isExpired) {
      toast.error("This offer has expired");
      return;
    }
    
    setLoading(true);
    
    try {
      let type: 'poll' | 'quiz' | 'giveaway' | 'click';
      let data: Record<string, any> = {};
      
      switch (block.type) {
        case 'poll':
          type = 'poll';
          data = { selection: selected };
          break;
        case 'quiz':
          type = 'quiz';
          data = { answers: [selected] };
          break;
        case 'giveaway':
          type = 'giveaway';
          data = { entered: true };
          break;
        default:
          type = 'click';
          data = { clicked: true };
      }
      
      await sponsorService.submitSponsorInteraction(user.id, block.id, type, data);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting interaction:', error);
      toast.error('Failed to submit your response');
    } finally {
      setLoading(false);
    }
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case 'video':
        return (
          <div className="relative aspect-video bg-black/30 rounded-lg overflow-hidden">
            {block.media_url ? (
              <iframe 
                src={block.media_url}
                className="absolute w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Video size={48} className={getSponsorClasses(sponsor) || "text-kenya-brown-light"} />
                <p className="text-kenya-brown-light text-sm">Video preview</p>
              </div>
            )}
          </div>
        );
        
      case 'product':
        return (
          <div className="space-y-4">
            {block.media_url && (
              <img 
                src={block.media_url} 
                alt={block.title || "Product"} 
                className="w-full rounded-lg h-48 object-cover"
              />
            )}
            <div className="flex justify-end">
              {block.action_url && (
                <Button 
                  variant="outline" 
                  style={getBrandedButtonStyle('outline')}
                  onClick={() => window.open(block.action_url, '_blank')}
                >
                  <ShoppingBag className={`mr-2 h-4 w-4 ${getSponsorClasses(sponsor)}`} />
                  View Product
                </Button>
              )}
            </div>
          </div>
        );
      
      case 'offer':
        return (
          <div className="space-y-4">
            {block.media_url && (
              <img 
                src={block.media_url} 
                alt={block.title || "Offer"} 
                className="w-full rounded-lg h-48 object-cover"
              />
            )}
            {block.expires_at && (
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className={getSponsorClasses(sponsor) || "text-kenya-orange"} />
                <span>{formatExpiration()}</span>
              </div>
            )}
            {block.action_url && (
              <Button 
                className="w-full" 
                style={getBrandedButtonStyle('default')}
                onClick={() => window.open(block.action_url, '_blank')}
                disabled={isExpired}
              >
                Claim Offer
              </Button>
            )}
          </div>
        );
      
      case 'giveaway':
        return (
          <div className="space-y-4">
            {block.media_url && (
              <img 
                src={block.media_url} 
                alt={block.title || "Giveaway"} 
                className="w-full rounded-lg h-48 object-cover"
              />
            )}
            {block.expires_at && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className={getSponsorClasses(sponsor) || "text-kenya-orange"} />
                <span>{formatExpiration()}</span>
              </div>
            )}
            {submitted ? (
              <div className="text-center p-4 bg-green-500/20 rounded-lg">
                <Gift size={24} className="mx-auto mb-2" />
                <p className="font-medium">You're entered!</p>
                <p className="text-sm opacity-80">Winner will be announced soon</p>
              </div>
            ) : (
              <Button 
                className="w-full" 
                style={getBrandedButtonStyle('default')}
                onClick={handleSubmit}
                disabled={isExpired || loading || !isAuthenticated}
              >
                {loading ? "Entering..." : "Enter Giveaway"}
              </Button>
            )}
          </div>
        );
      
      case 'poll':
        if (!block.data?.options || !Array.isArray(block.data.options)) {
          return <p>No poll options available</p>;
        }
        
        return (
          <div className="space-y-4">
            {submitted ? (
              <div className="space-y-3">
                {block.data.options.map((option, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{option}</span>
                      <span>{Math.floor(Math.random() * 60 + 10)}%</span>
                    </div>
                    <Progress 
                      value={Math.floor(Math.random() * 60 + 10)} 
                      className="h-2"
                      style={{ 
                        '--progress-background': sponsor?.brand_color || 'hsl(var(--primary))' 
                      } as React.CSSProperties} 
                    />
                  </div>
                ))}
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Thank you for participating!
                </p>
              </div>
            ) : (
              <RadioGroup value={selected || ""} onValueChange={setSelected}>
                {block.data.options.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${idx}`} style={getBrandedButtonStyle('default')} />
                    <Label htmlFor={`option-${idx}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            
            {!submitted && (
              <Button 
                className="w-full mt-4" 
                style={getBrandedButtonStyle('default')}
                onClick={handleSubmit}
                disabled={!selected || loading || !isAuthenticated}
              >
                {loading ? "Submitting..." : "Submit Vote"}
              </Button>
            )}
          </div>
        );

      case 'quiz':
        if (!block.data?.questions || !Array.isArray(block.data.questions) || block.data.questions.length === 0) {
          return <p>No quiz questions available</p>;
        }
        
        const question = block.data.questions[0]; // Just show first question for simplicity
        
        return (
          <div className="space-y-4">
            <p className="font-medium">{question.question}</p>
            
            {submitted ? (
              <div className="space-y-2">
                {question.options.map((option, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg ${
                      idx === question.correct 
                        ? "bg-green-500/20 border border-green-500/30" 
                        : idx === parseInt(selected || "0") 
                          ? "bg-red-500/20 border border-red-500/30" 
                          : "bg-muted"
                    }`}
                  >
                    {option}
                    {idx === question.correct && (
                      <span className="text-green-500 text-xs ml-2">Correct</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <RadioGroup value={selected || ""} onValueChange={setSelected}>
                {question.options.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(idx)} id={`quiz-option-${idx}`} style={getBrandedButtonStyle('default')} />
                    <Label htmlFor={`quiz-option-${idx}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            
            {!submitted && (
              <Button 
                className="w-full mt-4" 
                style={getBrandedButtonStyle('default')}
                onClick={handleSubmit}
                disabled={!selected || loading || !isAuthenticated}
              >
                {loading ? "Submitting..." : "Submit Answer"}
              </Button>
            )}
          </div>
        );
        
      case 'image':
      case 'text':
      default:
        return (
          <div className="space-y-4">
            {block.media_url && (
              <img 
                src={block.media_url} 
                alt={block.title || "Content"} 
                className="w-full rounded-lg object-cover"
              />
            )}
            {block.description && (
              <p className="text-muted-foreground">{block.description}</p>
            )}
            {block.action_url && (
              <Button 
                variant="outline" 
                className="w-full"
                style={getBrandedButtonStyle('outline')}
                onClick={() => window.open(block.action_url, '_blank')}
              >
                Learn More
              </Button>
            )}
          </div>
        );
    }
  };
  
  const getBlockIcon = (type: SponsorContentBlockType) => {
    switch (type) {
      case 'video': return <Play size={18} />;
      case 'product': return <ShoppingBag size={18} />;
      case 'offer': return <Calendar size={18} />;
      case 'giveaway': return <Gift size={18} />;
      case 'poll': return <PieChart size={18} />;
      case 'quiz': return <Timer size={18} />;
      default: return null;
    }
  };

  return (
    <Card 
      className="w-full bg-black/20 border-kenya-brown/20"
      style={{
        ...colorVars as React.CSSProperties,
        borderColor: sponsor?.brand_color ? `${sponsor.brand_color}20` : undefined
      }}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className={getSponsorClasses(sponsor)}>{getBlockIcon(block.type)}</span>
            <span>{block.title}</span>
          </CardTitle>
          
          {block.expires_at && (
            <div className="text-xs text-muted-foreground">
              {formatExpiration()}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {renderBlockContent()}
      </CardContent>
    </Card>
  );
};

export default SponsorZoneBlock;
