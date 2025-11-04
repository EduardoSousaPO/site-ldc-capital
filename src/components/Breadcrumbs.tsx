/**
 * Componente de Breadcrumbs com Structured Data (BreadcrumbList Schema)
 */

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { BreadcrumbSchema } from "./StructuredData";
import { getFullUrl } from "@/lib/seo-config";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  // Adicionar Home no início
  const allItems = [
    { name: "Home", url: "/" },
    ...items,
  ];

  return (
    <>
      <BreadcrumbSchema items={allItems} />
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center space-x-2 text-sm ${className}`}
      >
        <ol className="flex items-center space-x-2">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;

            return (
              <li key={item.url} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                )}
                {isLast ? (
                  <span className="text-gray-600 font-medium" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.url}
                    className="text-[#98ab44] hover:text-[#7a8a35] transition-colors flex items-center"
                  >
                    {index === 0 && <Home className="w-4 h-4 mr-1" />}
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

