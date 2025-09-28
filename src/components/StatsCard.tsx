import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  description?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon,
  description 
}: StatsCardProps) {
  return (
    <div className="card-professional p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-caption font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  changeType === "positive"
                    ? "text-secondary"
                    : changeType === "negative"
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {change}
              </span>
              {description && (
                <span className="text-caption ml-2">{description}</span>
              )}
            </div>
          )}
        </div>
        <div className="ml-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}