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
    <div className="fixed bottom-16 right-6 flex flex-col items-end z-50">
      {/* Action Buttons */}
      {isOpen && (
        <div
          className={`flex ${
            direction === "up" ? "flex-col-reverse" : "flex-col"
          } items-end gap-3 mb-3 transition-all ease-out duration-300`}
        >
          {buttonsList.length === 0 ? (
            <p className="text-white text-sm">No actions</p>
          ) : (
            buttonsList.map((button, index) => (
              <button
                key={index}
                onClick={() => handleActionClick(button.onClick)}
                className="px-4 h-12 bg-white text-blue-600 font-semibold rounded-full shadow-lg hover:bg-blue-100 transition-all duration-200 transform hover:scale-105 focus:outline-none"
                aria-label={button.label || `Action ${index + 1}`}
              >
                {button.label}
              </button>
            ))
          )}
        </div>
      )}

      {/* Toggle FAB with + icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-blue-600 text-white text-3xl font-bold flex justify-center items-center rounded-full shadow-2xl hover:bg-blue-700 transition-all duration-200 transform hover:rotate-90 focus:outline-none"
        aria-label="Toggle actions"
      >
        {isOpen ? "×" : "+"}
      </button>
    </div>
  );
};

export default FloatingButtons;
