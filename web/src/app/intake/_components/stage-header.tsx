import { Card, CardContent } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";

interface StageHeaderProps {
  title: string;
  subtitle: string;
  tipText?: string;
}

export function StageHeader({ title, subtitle, tipText }: StageHeaderProps) {
  return (
    <div className="mb-8 space-y-3">
      <h1 className="text-2xl font-semibold text-ct-text-primary">{title}</h1>
      <p className="text-base text-ct-text-secondary">{subtitle}</p>

      {tipText && (
        <Card className="border-ct-surface-raised bg-ct-surface mt-4">
          <CardContent className="flex items-start gap-3 px-4 py-3">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-ct-accent" />
            <p className="text-sm text-ct-text-secondary">{tipText}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
