
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Prize } from '../types';

interface LuckyWheelProps {
  onWin: (label: string) => void;
  onClose: () => void;
  prizes: Prize[];
}

const LuckyWheel: React.FC<LuckyWheelProps> = ({ onWin, onClose, prizes }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);

  const activePrizes = useMemo(() => prizes && prizes.length > 0 ? prizes : [
    { label: "%5 داشکان", color: "#ff3131", prob: 100 }
  ], [prizes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const arc = (2 * Math.PI) / activePrizes.length;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    activePrizes.forEach((p, i) => {
      ctx.beginPath();
      ctx.fillStyle = p.color || "#444";
      ctx.moveTo(175, 175);
      ctx.arc(175, 175, 170, i * arc, (i + 1) * arc);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(175, 175);
      ctx.rotate(i * arc + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "white";
      ctx.font = "bold 14px Vazirmatn";
      ctx.fillText(p.label, 150, 5);
      ctx.restore();
    });
  }, [activePrizes]);

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    const totalProb = activePrizes.reduce((acc, p) => acc + Number(p.prob), 0);
    const rand = Math.random() * totalProb;
    let cumulative = 0;
    let winnerIndex = 0;
    for (let i = 0; i < activePrizes.length; i++) {
      cumulative += Number(activePrizes[i].prob);
      if (rand <= cumulative) {
        winnerIndex = i;
        break;
      }
    }

    const degPerSlice = 360 / activePrizes.length;
    const targetAngle = 270 - (winnerIndex * degPerSlice + degPerSlice / 2);
    const extraSpins = 10 * 360;
    const newRotation = rotation + extraSpins + (targetAngle - (rotation % 360));

    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      onWin(activePrizes[winnerIndex].label);
    }, 5000);
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-black/90 flex flex-col items-center justify-center p-4">
      <button onClick={onClose} className="absolute top-6 right-6 text-white text-3xl hover:text-red-500 transition-colors">✕</button>
      <div className="relative mb-8">
        <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-red-500 z-10 drop-shadow-lg"></div>
        <canvas
          ref={canvasRef}
          width="350"
          height="350"
          className="rounded-full border-[8px] border-[#333] shadow-2xl transition-transform duration-[5000ms] lucky-wheel-canvas"
          style={{ transitionTimingFunction: 'cubic-bezier(0.15, 0, 0.15, 1)', transform: `rotate(${rotation}deg)` }}
        />
      </div>
      <button onClick={spin} disabled={isSpinning} className={`px-12 py-4 rounded-full font-bold text-xl text-white transition-all ${isSpinning ? 'bg-gray-600' : 'bg-[#ff3131] hover:scale-110 shadow-lg shadow-red-500/20'}`}>
        {isSpinning ? 'دەسوڕێتەوە...' : 'بسوڕێنە! 🎰'}
      </button>
    </div>
  );
};

export default LuckyWheel;
