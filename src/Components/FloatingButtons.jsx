import React, { useState } from "react";

const FloatingButtons = ({
  buttonsList = [],
  direction = "up",
  autoClose = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleActionClick = (onClick) => {
    onClick();
    if (autoClose) setIsOpen(false);
  };

  return (
    <div className="fixed bottom-28 right-6 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          className={`glass-panel glass-panel--inset shadow-ambient flex flex-col gap-2 rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 transition-all ${
            direction === 'up' ? 'origin-bottom scale-100' : 'origin-top scale-100'
          }`}
        >
          {buttonsList.length === 0 ? (
            <span className="text-sm text-slate-300">No quick actions</span>
          ) : (
            buttonsList.map((button, index) => (
              <button
                key={button.label || index}
                onClick={() => handleActionClick(button.onClick)}
                className="group flex items-center gap-3 rounded-2xl border border-transparent bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/15 hover:text-white"
                aria-label={button.label || `Action ${index + 1}`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary/20 text-primary transition group-hover:bg-primary group-hover:text-white">
                  {button.icon ? <button.icon /> : '+'}
                </span>
                {button.label}
              </button>
            ))
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex h-16 w-16 items-center justify-center rounded-3xl border border-primary/40 bg-gradient-to-br from-primary to-secondary text-3xl font-semibold text-white shadow-glow transition-all hover:-translate-y-1 hover:shadow-2xl"
        aria-label="Toggle quick actions"
      >
        <span className="transition-transform duration-200 group-hover:rotate-90">
          {isOpen ? '×' : '+'}
        </span>
        <span className="pointer-events-none absolute -left-40 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-200 shadow-ambient md:block">
          Quick actions
        </span>
      </button>
    </div>
  );
};

export default FloatingButtons;
