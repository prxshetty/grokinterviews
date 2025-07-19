'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Monitor, Phone } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface VoiceSectionProps {
  className?: string;
}

export default function VoiceSection({ className }: VoiceSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const router = useRouter();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const revealElements = entry.target.querySelectorAll('.reveal');
            revealElements.forEach((el, index) => {
              setTimeout(() => {
                (el as HTMLElement).style.opacity = '1';
                (el as HTMLElement).style.transform = 'translateY(0)';
              }, 200 + index * 120);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className={`w-full py-20 lg:pt-40 lg:pb-20 transition-all duration-1000 ${className}`}
    >
      <div className="container mx-auto">
        <div className="flex gap-4 flex-col items-center">
          {/* Header */}
          <div 
            className="flex gap-2 flex-col text-center reveal opacity-0 translate-y-6 transition-all duration-700 ease-out"
          >
            <h2 className="text-xl sm:text-3xl md:text-5xl tracking-tighter lg:max-w-xl font-light">
            Interview Preparation
            </h2>
            <p className="text-base sm:text-lg max-w-xl lg:max-w-xl leading-relaxed tracking-tight text-muted-foreground">
              Practice realistic voice-based interviews and get actionable insights. 
              Choose between a web or phone experience—whichever feels right for you.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="flex gap-10 pt-12 flex-col w-full">
            <div className="grid gap-10 md:grid-cols-2 w-full max-w-5xl mx-auto">
        {/* Web Interview Card */}
        <Card className="reveal opacity-0 translate-y-6 transition-all duration-700 ease-out overflow-hidden border-border bg-card hover:border-border/80 hover:shadow-lg group">
          <div className="relative h-56 w-full overflow-hidden">
            <Image
              src="/images/webcall.jpg"
              alt="Web Interview"
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          
          <CardContent className="p-8 flex flex-col gap-6">
            <span className="inline-flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-xs uppercase tracking-wider text-muted-foreground w-fit">
              <Monitor className="w-3.5 h-3.5" />
              Web Interview
            </span>

            <h3 className="text-xl md:text-2xl font-light tracking-tight text-foreground">
              In-browser mock interviews
            </h3>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              Simulate interview scenarios directly in your browser, complete with 
              real-time transcription, feedback, and replay.
            </p>

            <button 
              onClick={() => router.push('/voice')}
              className="mt-auto self-start px-6 py-2 bg-primary text-primary-foreground text-sm rounded-full hover:bg-primary/90 transition-all duration-300 shadow-md border border-border inline-flex items-center gap-2"
            >
              Practice on Web
            </button>
          </CardContent>
        </Card>

        {/* Phone Interview Card */}
        <Card className="reveal opacity-0 translate-y-6 transition-all duration-700 ease-out overflow-hidden border-border bg-card hover:border-border/80 hover:shadow-lg group">
          <div className="relative h-56 w-full overflow-hidden">
            <Image
              src="/images/phonecall.jpg"
              alt="Phone Interview"
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          
          <CardContent className="p-8 flex flex-col gap-6">
            <span className="inline-flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-xs uppercase tracking-wider text-muted-foreground w-fit">
              <Phone className="w-3.5 h-3.5" />
              Phone Interview
            </span>

            <h3 className="text-xl md:text-2xl font-light tracking-tight text-foreground">
              Train on the go
            </h3>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              Receive a call, answer behavioral questions, and review transcripts later. 
              Perfect for practicing anywhere.
            </p>

            <button 
              onClick={() => router.push('/voice')}
              className="mt-auto self-start px-6 py-2 bg-primary text-primary-foreground text-sm rounded-full hover:bg-primary/90 transition-all duration-300 shadow-md border border-border inline-flex items-center gap-2"
            >
              Practice via Phone
            </button>
          </CardContent>
        </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}