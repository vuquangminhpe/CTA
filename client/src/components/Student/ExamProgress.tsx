/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

const ExamProgress = ({ questions, answers, currentQuestionIndex, onNavigate }: any) => {
  const handleNavigate = (index: any) => {
    onNavigate(index);
  };

  return (
    <div className="hidden lg:block fixed left-4 top-1/2 transform -translate-y-1/2 bg-white shadow-md rounded-lg p-4 z-10">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Question Navigator</h3>
      <div className="flex flex-col space-y-2">
        {questions.map((question: { _id: React.Key | null | undefined; }, index: number) => {
          const isAnswered = answers[question._id as any] !== undefined;
          const isCurrent = index === currentQuestionIndex;
          
          return (
            <button
              key={question._id}
              onClick={() => handleNavigate(index)}
              className={`flex items-center space-x-2 p-2 rounded-md transition-colors ${
                isCurrent
                  ? 'bg-blue-100 text-blue-800'
                  : isAnswered
                  ? 'bg-green-50 text-green-800 hover:bg-green-100'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {isAnswered ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">{index + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ExamProgress;