import React, { useState } from "react";

const FloatingButtons = ({ buttonType = "bars", buttonsList = [], direction = "up" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getButtonIcon = () => {
    if (buttonType === "bars") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-white"
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
    <div className="fixed bottom-16 right-10 flex flex-col items-center">
      {/* Extra Action Buttons */}
      {isOpen && (
        <div
          className={`flex ${direction === "up" ? "flex-col-reverse" : "flex-col"} items-center gap-4 mb-3 transition-all ease-out duration-300`}
        >
          {buttonsList.length === 0 ? (
            <p className="text-white">No actions available</p>
          ) : (
            buttonsList.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                className="w-14 h-14 bg-white text-green-700 p-2 rounded-full shadow-md hover:bg-green-100 transition duration-200 transform hover:scale-110"
                aria-label={`Action ${index + 1}`}
              >
                <img src={button.src} alt={`icon-${index}`} className="w-8 h-8" />
              </button>
            ))
          )}
        </div>
      )}

      {/* Main Action Button (WhatsApp-like) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-green-600 text-white flex justify-center items-center rounded-full shadow-xl hover:bg-green-700 transition duration-200 transform hover:scale-110"
        aria-label="Toggle actions"
      >
        {/* WhatsApp style icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19.52 4.48a10.49 10.49 0 00-14.95 0 10.49 10.49 0 000 14.95c.48.48.99.91 1.54 1.29l-.01.01.02.02c.6.43 1.3.8 2.04 1.13l1.9.6a5.35 5.35 0 002.91 0 5.35 5.35 0 002.45-2.45 5.35 5.35 0 000-2.9c.33-.7.69-1.41.96-2.14a10.49 10.49 0 000-14.95zM12 16.68a4.67 4.67 0 11.01-9.34A4.67 4.67 0 0112 16.68z" />
        </svg>
      </button>
    </div>
  );
};

export default FloatingButtons;
