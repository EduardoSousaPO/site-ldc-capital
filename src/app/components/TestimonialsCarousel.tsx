"use client";

import { useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Card, CardContent } from "@/components/ui/card";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { testimonials } from "@/app/lib/testimonials";

export default function TestimonialsCarousel() {
  const autoplayRef = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      loop: true,
      skipSnaps: false,
      breakpoints: {
        "(min-width: 1024px)": { slidesToScroll: 3 },
        "(min-width: 768px)": { slidesToScroll: 2 },
      },
    },
    [autoplayRef.current]
  );

  const scrollPrev = () => {
    if (emblaApi) emblaApi.scrollPrev();
  };

  const scrollNext = () => {
    if (emblaApi) emblaApi.scrollNext();
  };

  useEffect(() => {
    if (emblaApi) {
      // Pause autoplay on hover
      const emblaNode = emblaApi.rootNode();
      
      const pauseAutoplay = () => {
        if (autoplayRef.current) autoplayRef.current.stop();
      };
      
      const resumeAutoplay = () => {
        if (autoplayRef.current) autoplayRef.current.play();
      };

      emblaNode.addEventListener("mouseenter", pauseAutoplay);
      emblaNode.addEventListener("mouseleave", resumeAutoplay);

      return () => {
        emblaNode.removeEventListener("mouseenter", pauseAutoplay);
        emblaNode.removeEventListener("mouseleave", resumeAutoplay);
      };
    }
  }, [emblaApi]);

  return (
    <section className="py-16 lg:py-24 bg-[#344645] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(152, 171, 68, 0.1) 2px, transparent 2px),
                           radial-gradient(circle at 80% 80%, rgba(190, 204, 106, 0.1) 2px, transparent 2px)`,
          backgroundSize: '80px 80px'
        }}></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-white mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Depoimentos reais de quem já confia na LDC Capital para cuidar do seu patrimônio
          </p>
        </div>

        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-[#262d3d] hover:bg-[#98ab44] hover:text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-[#262d3d] hover:bg-[#98ab44] hover:text-white transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Carousel */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-4"
                >
                  <Card className="h-full border-0 bg-white/10 backdrop-blur-md shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start mb-4">
                        <Quote className="h-8 w-8 text-[#becc6a] flex-shrink-0" />
                      </div>
                      
                      <blockquote className="text-white mb-6 leading-relaxed">
                        &ldquo;{testimonial.quote}&rdquo;
                      </blockquote>
                      
                      <div className="flex items-center">
                        <div>
                          <div className="font-semibold text-white">
                            {testimonial.author}
                          </div>
                          <div className="text-sm text-white/70">
                            {testimonial.role}
                            {testimonial.location && (
                              <span> • {testimonial.location}</span>
                            )}
                          </div>
                          <div className="text-xs text-[#becc6a] font-medium mt-1">
                            Cliente LDC Capital
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Elementos Decorativos */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#98ab44]/30 to-transparent"></div>
    </section>
  );
}
