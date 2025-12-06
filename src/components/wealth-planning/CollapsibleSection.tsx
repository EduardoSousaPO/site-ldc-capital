"use client";

import { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function CollapsibleSection({
  title,
  description,
  children,
  defaultOpen = false,
  className,
}: CollapsibleSectionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? "content" : undefined}
      className={cn("w-full", className)}
    >
      <AccordionItem value="content" className="border border-[#e3e3e3] rounded-lg px-4 transition-all duration-300 hover:border-[#98ab44]/50 hover:shadow-sm">
        <AccordionTrigger className="hover:no-underline py-4 group">
          <div className="flex flex-col items-start text-left flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#262d3d] font-sans group-hover:text-[#98ab44] transition-colors duration-200">
                {title}
              </span>
              {!defaultOpen && (
                <span className="text-xs text-[#577171] font-sans bg-[#e3e3e3]/50 px-2 py-0.5 rounded-full">
                  Clique para expandir
                </span>
              )}
            </div>
            {description && (
              <span className="text-xs text-[#577171] font-sans mt-1">
                {description}
              </span>
            )}
          </div>
          <ChevronDown className="h-5 w-5 text-[#577171] transition-transform duration-300 group-data-[state=open]:rotate-180 flex-shrink-0 ml-2" />
        </AccordionTrigger>
        <AccordionContent className="pt-0 pb-4 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
