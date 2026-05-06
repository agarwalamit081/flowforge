import { useState, useEffect } from "react";
import { X, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to FlowForge",
    description: "Your momentum companion for focused work",
    icon: ({ className }) => (
      <div className={`flex size-16 items-center justify-center rounded-full bg-leaf/20 ${className}`}>
        <span className="text-4xl">🌱</span>
      </div>
    ),
    content: (
      <div className="space-y-4 text-ink/80">
        <p>
          FlowForge combines task management, calendar context, and compassionate coaching to help you build sustainable momentum.
        </p>
        <div className="rounded-2xl bg-leaf/10 px-4 py-3">
          <strong className="text-leaf">Core philosophy:</strong> Don't fight procrastination—understand it, then gently redirect it.
        </div>
      </div>
    )
  },
  {
    id: "today",
    title: "Today Dashboard",
    description: "Your daily command center",
    icon: CheckCircle2,
    content: (
      <div className="space-y-4 text-ink/80">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-leaf">✓</span>
            <p><strong>Quick capture:</strong> Add tasks instantly to your inbox</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-leaf">✓</span>
            <p><strong>Daily outcomes:</strong> Define 1-3 meaningful outcomes for each day</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-leaf">✓</span>
            <p><strong>Task cards:</strong> Start, complete, or mark tasks as stuck</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "agenda",
    title: "Agenda & Inbox",
    description: "Triage and organize your tasks",
    icon: ({ className }) => (
      <div className={`flex size-16 items-center justify-center rounded-full bg-moss/20 ${className}`}>
        <span className="text-4xl">📥</span>
      </div>
    ),
    content: (
      <div className="space-y-4 text-ink/80">
        <p>The Agenda page is your workflow for processing captured tasks:</p>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-moss">1.</span>
            <p><strong>Inbox triage:</strong> Review and prioritize new tasks</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-moss">2.</span>
            <p><strong>Rescheduling:</strong> Move tasks to different dates</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-moss">3.</span>
            <p><strong>Back to inbox:</strong> Return tasks to inbox for later</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "briefing",
    title: "Morning Briefing",
    description: "Start your day with intention",
    icon: ({ className }) => (
      <div className={`flex size-16 items-center justify-center rounded-full bg-sky-400/20 ${className}`}>
        <span className="text-4xl">☀️</span>
      </div>
    ),
    content: (
      <div className="space-y-4 text-ink/80">
        <p>Each morning, FlowForge helps you set focus:</p>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-sky-600">✓</span>
            <p><strong>AI-powered briefing:</strong> Personalized focus prompts based on your tasks</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-sky-600">✓</span>
            <p><strong>Outcome definition:</strong> Set 1-3 meaningful daily outcomes</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-sky-600">✓</span>
            <p><strong>Task suggestions:</strong> AI suggests which tasks to prioritize</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "ready",
    title: "You're Ready!",
    description: "Let's build some momentum",
    icon: ({ className }) => (
      <div className={`flex size-16 items-center justify-center rounded-full bg-coral/20 ${className}`}>
        <span className="text-4xl">🚀</span>
      </div>
    ),
    content: (
      <div className="space-y-4 text-ink/80">
        <p>Here are some tips to get started:</p>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="text-coral">1.</span>
            <p><strong>Capture everything:</strong> Use quick capture to get tasks out of your head</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-coral">2.</span>
            <p><strong>Start small:</strong> Break big tasks into micro-tasks</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-coral">3.</span>
            <p><strong>Use Stuck:</strong> When you're stuck, mark it and get personalized help</p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-leaf/10 px-4 py-3 text-sm">
          <strong>Keyboard shortcut:</strong> Press <kbd className="rounded bg-white/50 px-1">Ctrl+N</kbd> anywhere to quickly add a task
        </div>
      </div>
    )
  }
];

interface OnboardingWizardProps {
  onClose: () => void;
}

export function OnboardingWizard({ onClose }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();

  const step = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(() => {
      localStorage.setItem("flowforge-onboarding-complete", "true");
      onClose();
    }, 300);
  };

  const handleSkip = () => {
    localStorage.setItem("flowforge-onboarding-complete", "true");
    onClose();
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-300 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleSkip}
    >
      <div
        className="card max-w-lg w-full transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="mb-6 h-1 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full bg-leaf transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Close button */}
        <button
          className="absolute right-4 top-4 text-ink/50 hover:text-ink transition"
          onClick={handleSkip}
          type="button"
        >
          <X size={20} />
        </button>

        {/* Step indicator */}
        <div className="mb-6 text-center">
          <p className="text-sm text-ink/60">
            Step {currentStep + 1} of {onboardingSteps.length}
          </p>
        </div>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          {<step.icon className="size-20" />}
        </div>

        {/* Content */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold">{step.title}</h2>
          <p className="mt-2 text-sm text-ink/60">{step.description}</p>
          <div className="mt-6 text-left">{step.content}</div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            className="button-secondary"
            disabled={currentStep === 0}
            onClick={handlePrevious}
            type="button"
          >
            Previous
          </button>
          <button className="button-primary flex items-center gap-2" onClick={handleNext} type="button">
            {isLastStep ? "Get started" : "Next"}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("flowforge-onboarding-complete");
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  return { showOnboarding, setShowOnboarding };
}
