export function SupportFormSteps({
  showIdentity,
}: {
  /** When true, shows Identity → Issue → Submit; otherwise Issue → Submit. */
  showIdentity: boolean;
}) {
  const steps = showIdentity
    ? [
        { n: 1, label: "Identity", hint: "Your work email and desk" },
        { n: 2, label: "Issue", hint: "Describe the problem" },
        { n: 3, label: "Submit", hint: "Send to IT" },
      ]
    : [
        { n: 1, label: "Issue", hint: "Describe the problem" },
        { n: 2, label: "Submit", hint: "Send to IT" },
      ];

  return (
    <ol className="flex flex-wrap items-start gap-2 sm:gap-0 sm:justify-between mb-6 list-none p-0">
      {steps.map((step, index) => (
        <li
          key={step.label}
          className="flex items-start gap-2 sm:flex-1 sm:flex-col sm:items-center sm:text-center min-w-[7rem] sm:min-w-0"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {step.n}
          </span>
          <div className="min-w-0 sm:px-1">
            <span className="text-xs font-semibold text-foreground block">{step.label}</span>
            <span className="text-[10px] text-muted-foreground leading-snug">{step.hint}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
