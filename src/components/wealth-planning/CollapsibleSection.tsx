"use client";

import { ReactNode } from "react";
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
      <AccordionItem value="content" className="border border-[#e3e3e3] rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex flex-col items-start text-left">
            <span className="font-semibold text-[#262d3d] font-sans">{title}</span>
            {description && (
              <span className="text-xs text-[#577171] font-sans mt-1">
                {description}
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-0 pb-4">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
