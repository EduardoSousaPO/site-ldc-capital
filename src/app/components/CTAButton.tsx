"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CTAButtonProps {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  href?: string;
}

export default function CTAButton({ children, className, size, href = "/#contact-form" }: CTAButtonProps) {
  return (
    <Button
      size={size}
      className={className}
      asChild
    >
      <Link href={href}>
        {children}
      </Link>
    </Button>
  );
}
