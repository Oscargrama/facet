import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  description?: string;
  delay?: number;
  glowing?: boolean;
}

const glowColors: Record<string, string> = {
  positive: "rgba(4, 191, 138, 0.2)",
  negative: "rgba(239, 68, 68, 0.2)",
  neutral: "rgba(2, 104, 115, 0.15)",
};

const iconBgColors: Record<string, string> = {
  positive: "rgba(4, 191, 138, 0.15)",
  negative: "rgba(239, 68, 68, 0.15)",
  neutral: "rgba(2, 104, 115, 0.15)",
};

const iconTextColors: Record<string, string> = {
  positive: "#04BF8A",
  negative: "#ef4444",
  neutral: "#3dd6e8",
};

export default function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  description,
  delay = 0,
  glowing = false,
}: StatsCardProps) {
  const delayClass = delay === 0 ? "" : delay === 1 ? "delay-75" : delay === 2 ? "delay-150" : delay === 3 ? "delay-225" : "delay-300";

  return (
    <div
      className={cn("card-professional p-5 animate-fade-up", delayClass, glowing && "animate-pulse-glow")}
      style={{
        boxShadow: glowing
          ? `0 0 24px ${glowColors[changeType]}, 0 4px 12px rgba(0,0,0,0.3)`
          : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="label-uppercase truncate">{title}</p>
          <p
            className="font-display text-2xl font-semibold mt-2 text-foreground leading-none"
            style={glowing ? { color: iconTextColors[changeType] } : undefined}
          >
            {value}
          </p>

          {change && (
            <div className="flex items-center mt-2 gap-1.5">
              <span
                className={cn(
                  "text-xs font-semibold",
                  changeType === "positive" && "text-accent",
                  changeType === "negative" && "text-destructive",
                  changeType === "neutral" && "text-muted-foreground"
                )}
              >
                {change}
              </span>
              {description && (
                <span className="text-caption">{description}</span>
              )}
            </div>
          )}

          {!change && description && (
            <p className="text-caption text-muted-foreground mt-2 truncate">{description}</p>
          )}
        </div>

        {/* Icon container */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
          style={{
            background: iconBgColors[changeType],
            border: `1px solid ${glowColors[changeType]}`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: iconTextColors[changeType] }} />
        </div>
      </div>
    </div>
  );
}
