/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

const ExamQuestion = ({ question, questionIndex, selectedAnswer, onAnswerSelect }: any) => {
  const handleSelectAnswer = (answerIndex: React.Key | null | undefined) => {
    onAnswerSelect(question._id, answerIndex);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-start mb-4">
        <span className="flex-shrink-0 bg-blue-100 text-blue-800 font-medium py-1 px-2 rounded-full mr-3">
          Q{questionIndex + 1}
        </span>
        <h3 className="text-lg font-medium text-gray-900">{question.content}</h3>
      </div>
      
      <div className="mt-4 space-y-3">
        {question.answers.map((answer: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined, answerIndex: React.Key | null | undefined) => (
          <div
            key={answerIndex}
            className={`relative flex rounded-lg border p-4 cursor-pointer focus:outline-none transition-colors ${
              selectedAnswer === answerIndex
                ? 'bg-blue-50 border-blue-200'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => handleSelectAnswer(answerIndex)}
          >
            <div className="flex items-center h-5">
              <input
                id={`question-${questionIndex}-answer-${answerIndex}`}
                name={`question-${questionIndex}`}
                type="radio"
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                checked={selectedAnswer === answerIndex}
                onChange={() => handleSelectAnswer(answerIndex)}
              />
            </div>
            <div className="ml-3 flex-grow">
              <label
                htmlFor={`question-${questionIndex}-answer-${answerIndex}`}
                className={`text-sm font-medium ${
                  selectedAnswer === answerIndex ? 'text-blue-900' : 'text-gray-700'
                }`}
              >
                {answer}
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamQuestion;