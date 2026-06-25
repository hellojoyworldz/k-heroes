type ChoicePathStepsProps = {
  choices: string[];
  choicesHistory?: boolean[];
  status: string;
};

export function ChoicePathSteps({ choices, choicesHistory, status }: ChoicePathStepsProps) {
  const steps = choices.slice(0, 3).map((choice) => choice.toUpperCase());
  const stepIcons =
    status === "completed" && choicesHistory && choicesHistory.length > 0 ? choicesHistory : null;

  if (steps.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {steps.map((choice, index) => (
        <StepBadge
          key={`${index}-${choice}`}
          choice={choice}
          isReal={stepIcons?.[index] ?? null}
          step={index + 1}
        />
      ))}
    </div>
  );
}

function StepBadge({
  choice,
  isReal,
  step,
}: {
  choice: string;
  isReal: boolean | null;
  step: number;
}) {
  const showResultStyle = isReal !== null;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="flex size-9 items-center justify-center rounded-full backdrop-blur-sm"
        style={{
          background: showResultStyle
            ? isReal
              ? "rgba(42,150,80,0.18)"
              : "rgba(180,100,20,0.18)"
            : "rgba(42,66,50,0.08)",
          border: showResultStyle
            ? isReal
              ? "2px solid rgba(42,150,80,0.5)"
              : "2px solid rgba(180,100,20,0.4)"
            : "2px solid rgba(42,66,50,0.18)",
        }}
      >
        <span className="text-base leading-none">
          {showResultStyle ? (isReal ? "🅾️" : "❎") : choice}
        </span>
      </div>
      <span
        className="text-[0.58rem] tracking-wide text-[#8A847C]"
        style={{ fontFamily: "'Noto Sans KR', sans-serif", letterSpacing: "0.04em" }}
      >
        STEP {step}
      </span>
    </div>
  );
}
