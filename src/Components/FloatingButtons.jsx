import React, { useState } from "react";

const FloatingButtons = ({ buttonType = "bars", buttonsList = [], direction = "up" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getButtonIcon = () => {
    if (buttonType === "bars") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" y1="6" x2="20" y2="6"></line>
          <line x1="4" y1="12" x2="20" y2="12"></line>
          <line x1="4" y1="18" x2="20" y2="18"></line>
        </svg>
      );
    }
    if (buttonType === "vert-dots") return "⋮";
    return "?";
  };

  return (
    <div className="fixed bottom-16 right-6 flex flex-col items-center z-50">
      {/* Action Buttons */}
      {isOpen && (
        <div
          className={`flex ${direction === "up" ? "flex-col-reverse" : "flex-col"} items-center gap-3 mb-3 transition-all ease-out duration-300`}
        >
          {buttonsList.length === 0 ? (
            <p className="text-white text-sm">No actions</p>
          ) : (
            buttonsList.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                className="w-14 h-14 bg-white text-green-600 p-2 rounded-full shadow-lg hover:bg-green-100 transition-all duration-200 transform hover:scale-110 focus:outline-none"
                aria-label={`Action ${index + 1}`}
              >
                <img src={button.src} alt={`icon-${index}`} className="w-7 h-7 mx-auto" />
              </button>
            ))
          )}
        </div>
      )}

      {/* Toggle FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-green-600 text-white flex justify-center items-center rounded-full shadow-2xl hover:bg-green-700 transition-all duration-200 transform hover:rotate-90 focus:outline-none"
        aria-label="Toggle actions"
      >
        {getButtonIcon()}
      </button>
    </div>
  );
};

export default FloatingButtons;
