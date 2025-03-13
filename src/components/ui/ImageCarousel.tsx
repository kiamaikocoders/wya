
import React, { useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play } from 'lucide-react';
import { type CarouselApi } from 'embla-carousel-react';

export interface CarouselImage {
  id: string;
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  link?: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  className?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, className }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <div className={cn("relative px-4 py-2", className)}>
      <Carousel
        opts={{
          align: "center",
          loop: true,
        }}
        className="w-full"
        onSelect={(api: CarouselApi) => {
          if (api) {
            setActiveIndex(api.selectedScrollSnap());
          }
        }}
      >
        <CarouselContent className="-ml-4">
          {images.map((image, index) => (
            <CarouselItem 
              key={image.id} 
              className={cn(
                "pl-4 md:basis-1/2 lg:basis-1/3 transition-opacity duration-300 relative",
                activeIndex === index ? "opacity-100" : "opacity-60"
              )}
            >
              <Card className="overflow-hidden border-0 bg-transparent">
                <CardContent className="relative group p-0 h-72 rounded-xl overflow-hidden">
                  <img 
                    src={image.src} 
                    alt={image.alt}
                    className={cn(
                      "w-full h-full object-cover transition-all duration-300 rounded-xl",
                      activeIndex === index ? "scale-105" : "scale-90 blur-[1px]"
                    )}
                  />
                  
                  {(image.title || image.subtitle) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6">
                      {image.title && (
                        <h3 className="text-white text-lg md:text-xl font-bold mb-1">{image.title}</h3>
                      )}
                      {image.subtitle && (
                        <p className="text-white/90 text-sm">{image.subtitle}</p>
                      )}
                      
                      {image.link && (
                        <Button 
                          className="mt-3 bg-kenya-orange text-white rounded-full w-12 h-12 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          asChild
                        >
                          <a href={image.link}>
                            <Play className="h-5 w-5" />
                            <span className="sr-only">View details</span>
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-2 mt-4">
          {images.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full ${
                activeIndex === index ? "bg-kenya-orange" : "bg-kenya-brown-light opacity-50"
              }`}
              onClick={() => {
                const carousel = document.querySelector('[role="region"][aria-roledescription="carousel"]');
                if (carousel) {
                  const items = carousel.querySelectorAll('[role="group"]');
                  if (items[index]) {
                    items[index].scrollIntoView({
                      behavior: 'smooth',
                      block: 'nearest',
                      inline: 'center'
                    });
                  }
                }
              }}
            />
          ))}
        </div>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 border-0" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 border-0" />
      </Carousel>
    </div>
  );
};

export default ImageCarousel;
