import React, { useState } from 'react';

const PhotoCompare = ({ beforePhoto, afterPhoto, beforeLabel = 'Antes', afterLabel = 'Después' }) => {
  const [position, setPosition] = useState(50);

  if (!beforePhoto || !afterPhoto) return null;

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#E9D9CF] select-none bg-[#FAF4EE]">
      <img src={afterPhoto} alt={afterLabel} className="w-full h-full object-cover" />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img src={beforePhoto} alt={beforeLabel} className="w-full h-full object-cover" />
      </div>

      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-2 border-[#C87A72] shadow-md flex items-center justify-center text-[10px] font-bold text-[#8E4742]">
          ⇄
        </div>
      </div>

      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 text-[10px] font-bold text-[#2A201D] shadow-sm">
        {beforeLabel}
      </span>
      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#C87A72]/90 text-[10px] font-bold text-white shadow-sm">
        {afterLabel}
      </span>

      <input
        type="range"
        min="5"
        max="95"
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Comparar antes y después"
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
      />
    </div>
  );
};

export default PhotoCompare;
