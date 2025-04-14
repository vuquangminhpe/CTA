/* eslint-disable @typescript-eslint/no-explicit-any */
import  { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

const ExamTimer = ({ remainingTime, onTimeUp, enabled = true }: any) => {
  const [timeLeft, setTimeLeft] = useState(remainingTime);
  const [isFlashing, setIsFlashing] = useState(false);
  
  useEffect(() => {
    setTimeLeft(remainingTime);
  }, [remainingTime]);

  useEffect(() => {
    if (!enabled) return;
    
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev: number) => prev - 1);
    }, 1000);

    // Flash warning when less than 5 minutes left
    if (timeLeft < 300) {
      const flashInterval = setInterval(() => {
        setIsFlashing(prev => !prev);
      }, 500);
      
      return () => {
        clearInterval(timer);
        clearInterval(flashInterval);
      };
    }

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp, enabled]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const isLowTime = timeLeft < 300; // Less than 5 minutes

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center rounded-lg px-4 py-2 shadow-md transition-colors ${
        isLowTime
          ? isFlashing
            ? 'bg-red-100 text-red-800 animate-pulse'
            : 'bg-red-600 text-white'
          : 'bg-white text-gray-800 border border-gray-200'
      }`}
    >
      {isLowTime ? (
        <AlertTriangle className="mr-2 h-5 w-5" />
      ) : (
        <Clock className="mr-2 h-5 w-5 text-blue-600" />
      )}
      <span className={`font-medium ${isLowTime ? '' : 'text-gray-900'}`}>
        {formatTime(timeLeft)}
      </span>
    </div>
  );
};

export default ExamTimer;