/* eslint-disable @typescript-eslint/no-explicit-any */
import  { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ExamTimer from '../../components/Student/ExamTimer';
import ExamQuestion from '../../components/Student/ExamQuestion';
import ExamProgress from '../../components/Student/ExamProgress';
import ViolationWarning from '../../components/Student/ViolationWarning';
import useSocketExam from '../../hooks/useSocketExam';
import examApi from '../../apis/exam.api';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Save, AlertTriangle, CheckCircle } from 'lucide-react';

const ExamPage = () => {
  const { examCode } = useParams();
  const navigate = useNavigate();
  
  // Exam state
  const [session, setSession] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<any>(0);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  // Socket connection
  const { violations, resetViolations } = useSocketExam(session?._id);
  
  // Time check ref
  const timerIntervalRef = useRef(null);
  
  // Load exam on mount
  useEffect(() => {
    loadExam();
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [examCode]);
  
  // Watch for violations
  useEffect(() => {
    if (violations > 0) {
      setShowViolationWarning(true);
    }
  }, [violations]);
  
  const loadExam = async () => {
    try {
      setIsLoading(true);
      const response = await examApi.startExam({ exam_code: examCode as string});
      
      const { session: examSession, exam: examData, remaining_time } = response.data.result;
      
      setSession(examSession as any);
      setExam(examData as any);
      setRemainingTime(remaining_time);
      
      // Set initial answers from session if they exist
      if (examSession.answers && examSession.answers.length > 0) {
        const sessionAnswers: Record<string, number> = {};
        examSession.answers.forEach(answer => {
          sessionAnswers[answer.question_id] = answer.selected_index;
        });
        setAnswers(sessionAnswers);
      }
      
      // Check if the exam is already completed
      if (examSession.completed) {
        setCompleted(true);
      }
      
    } catch (error: any) {
      console.error('Failed to load exam:', error);
      toast.error(error.response?.data?.message || 'Failed to load exam');
      navigate('/student', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnswerSelect = (questionId: any, answerIndex: any) => {
    setAnswers((prev: any)=> ({
      ...prev,
      [questionId]: answerIndex
    }));
  };
  
  const handleNavigate = (index: number) => {
    if (index >= 0 && index < exam.questions.length) {
      setCurrentQuestionIndex(index);
      // Scroll to top of the page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      handleNavigate(currentQuestionIndex + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      handleNavigate(currentQuestionIndex - 1);
    }
  };
  
  const handleTimeUp = () => {
    toast.warning('Time is up! Submitting your exam...');
    submitExam();
  };
  
  const submitExam = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Format answers for API
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedIndex]) => ({
        question_id: questionId,
        selected_index: selectedIndex
      }));
      
      await examApi.submitExam({
        session_id: session._id,
        answers: formattedAnswers as any
      });
      
      toast.success('Exam submitted successfully');
      setCompleted(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/student', { replace: true });
      }, 3000);
      
    } catch (error: any) {
      console.error('Failed to submit exam:', error);
      toast.error(error.response?.data?.message || 'Failed to submit exam');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSubmitClick = () => {
    // Check if all questions have been answered
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = exam.questions.length;
    
    if (answeredCount < totalQuestions) {
      const confirmSubmit = window.confirm(
        `You've only answered ${answeredCount} out of ${totalQuestions} questions. Are you sure you want to submit?`
      );
      
      if (!confirmSubmit) return;
    } else {
      const confirmSubmit = window.confirm(
        'Are you sure you want to submit your exam? This action cannot be undone.'
      );
      
      if (!confirmSubmit) return;
    }
    
    submitExam();
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Render completed state
  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 py-12">
        <div className="bg-white shadow rounded-lg p-8 max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-xl font-medium text-gray-900">Exam Completed</h2>
          <p className="mt-2 text-sm text-gray-500">
            Your exam has been submitted successfully.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigate('/student', { replace: true })}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Main exam UI
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Timer */}
      <ExamTimer
        remainingTime={remainingTime}
        onTimeUp={handleTimeUp}
        enabled={!completed}
      />
      
      {/* Violation Warning */}
      {showViolationWarning && (
        <ViolationWarning
          count={violations}
          onDismiss={() => {
            setShowViolationWarning(false);
            resetViolations();
          }}
        />
      )}
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
          <p className="mt-2 text-sm text-gray-500">
            Exam Code: {examCode} • {exam.questions.length} questions
          </p>
          
          {violations > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mr-2" />
              <p className="text-sm text-yellow-700">
                You have {violations} violation{violations !== 1 ? 's' : ''}. Switching tabs or windows
                during the exam is not allowed and may affect your score.
              </p>
            </div>
          )}
        </div>
        
        {/* Progress indicator (for desktop) */}
        <ExamProgress
          questions={exam.questions}
          answers={answers}
          currentQuestionIndex={currentQuestionIndex}
          onNavigate={handleNavigate}
        />
        
        {/* Current Question */}
        <div className="mb-8">
          <ExamQuestion
            question={exam.questions[currentQuestionIndex]}
            questionIndex={currentQuestionIndex}
            selectedAnswer={answers[exam.questions[currentQuestionIndex]._id]}
            onAnswerSelect={handleAnswerSelect}
          />
        </div>
        
        {/* Navigation and Submit */}
        <div className="flex items-center justify-between pb-12">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="-ml-1 mr-2 h-5 w-5" />
            Previous
          </button>
          
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-4">
              {currentQuestionIndex + 1} of {exam.questions.length}
            </span>
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="-ml-1 mr-2 h-5 w-5" />
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
          
          <button
            type="button"
            onClick={handleNext}
            disabled={currentQuestionIndex === exam.questions.length - 1}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="-mr-1 ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;