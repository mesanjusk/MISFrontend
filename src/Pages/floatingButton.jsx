import React, { useState } from "react";

const FloatingButtons = ({ buttonType = "bars", buttonsList = [], direction = "up" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getButtonIcon = () => {
    if (buttonType === "bars") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-white"
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
      {isOpen && (
        <div className={`flex ${direction === "up" ? "flex-col-reverse" : "flex-col"} items-center gap-2 mb-2`}>
          {buttonsList.map((button, index) => (
            <button
              key={index}
              onClick={button.onClick}
              className="w-12 h-12 bg-green-800 text-white p-2 rounded-full shadow-md hover:bg-green-700 transition"
            >
              <img src={button.src} alt={`icon-${index}`} className="w-8 h-8 filter invert" />
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-green-500 text-white flex justify-center items-center rounded-full shadow-lg hover:bg-green-600 transition"
      >
        {getButtonIcon()}
      </button>
    </div>
  );
};

export default FloatingButtons;
