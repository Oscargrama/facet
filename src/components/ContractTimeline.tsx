import { CheckCircle, Clock, Upload, Link2, FileCheck } from "lucide-react";

export interface TimelineStep {
  id: string;
  label: string;
  status: "completed" | "current" | "pending";
  timestamp?: string;
  details?: string;
}

interface ContractTimelineProps {
  steps: TimelineStep[];
}

export default function ContractTimeline({ steps }: ContractTimelineProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-start space-x-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            {step.status === "completed" ? (
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-secondary" />
              </div>
            ) : step.status === "current" ? (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <Clock className="w-5 h-5 text-primary" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-muted-foreground rounded-full" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-medium ${
                step.status === "completed" ? "text-secondary" :
                step.status === "current" ? "text-primary" :
                "text-muted-foreground"
              }`}>
                {step.label}
              </h4>
              {step.timestamp && (
                <span className="text-xs text-muted-foreground">
                  {step.timestamp}
                </span>
              )}
            </div>
            
            {step.details && (
              <p className="text-xs text-muted-foreground mt-1">
                {step.details}
              </p>
            )}
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div className="absolute left-5 top-12 w-0.5 h-8 bg-border" />
          )}
        </div>
      ))}
    </div>
  );
}

// Helper to get icon component by step type
export function getStepIcon(stepType: string) {
  const icons: Record<string, any> = {
    sign: FileCheck,
    ipfs: Upload,
    blockchain: Link2,
    verify: CheckCircle
  };
  
  return icons[stepType] || Clock;
}
