import { cn } from "@/lib/utils";

type Step = {
  id: number;
  title: string;
  description?: string;
};

type Props = {
  steps: Step[];
  activeStep: number;
};

export function Stepper({ steps, activeStep }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {steps.map((step) => {
        const isActive = step.id === activeStep;
        const isDone = step.id < activeStep;
        return (
          <div
            key={step.id}
            className={cn(
              "rounded-xl border p-3 shadow-sm",
              isActive
                ? "border-primary bg-primary/5"
                : isDone
                ? "border-emerald-500/40 bg-emerald-50"
                : "bg-card"
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step.id}
              </div>
              <div>
                <p className="text-sm font-semibold">{step.title}</p>
                {step.description && (
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
