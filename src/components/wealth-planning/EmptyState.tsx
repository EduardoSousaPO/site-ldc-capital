import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#98ab44]/10 mb-6">
        <Icon className="h-10 w-10 text-[#98ab44]" />
      </div>

      <h3 className="font-serif text-2xl text-[#262d3d] mb-3 text-center">
        {title}
      </h3>

      <p className="font-sans text-sm text-[#577171] max-w-md text-center mb-8">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white font-sans"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

