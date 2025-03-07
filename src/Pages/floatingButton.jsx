import React, { useState } from "react";

const FloatingButtons = ({ buttonType = "plus", buttonsList = [], direction = "up" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getButtonIcon = () => {
    if (buttonType === "plus") return "+";
    if (buttonType === "vert-dots") return "⋮";
    return "?";
  };

  return (
    <div className="fixed bottom-16 right-10 flex flex-col items-center">
      {isOpen && (
        <div
          className={`flex ${direction === "up" ? "flex-col-reverse" : "flex-col"} items-center gap-2 mb-2`}
        >
          {buttonsList.map((button, index) => (
            <button
              key={index}
              onClick={button.onClick}
              className="w-12 h-12 bg-green-800 p-2 rounded-full shadow-md hover:bg-green-700 transition"
            >
              <img src={button.src} alt={`icon-${index}`} className="w-8 h-8" />
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-green-500 text-white text-3xl rounded-full shadow-lg hover:bg-green-600 transition"
      >
        {getButtonIcon()}
      </button>
    </div>
  );
};

export default FloatingButtons;
