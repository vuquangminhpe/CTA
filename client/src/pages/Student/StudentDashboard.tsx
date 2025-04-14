/* eslint-disable @typescript-eslint/no-explicit-any */
import  { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../../components/Student/QRScanner';
import ExamHistory from '../../components/Student/ExamHistory';
import examApi from '../../apis/exam.api';
import { toast } from 'sonner';
import { QrCode, History, User } from 'lucide-react';
import { AuthContext } from '../../Contexts/auth.context';

const StudentDashboard = () => {
  const [examHistory, setExamHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scanner');
  const { profile } = useContext(AuthContext) as any;
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'history') {
      fetchExamHistory();
    }
  }, [activeTab]);

  const fetchExamHistory = async () => {
    try {
      setIsLoading(true);
      const response = await examApi.getExamHistory();
      setExamHistory(response.data.result as any);
    } catch (error) {
      console.error('Failed to fetch exam history:', error);
      toast.error('Failed to load exam history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async (examCode: any) => {
    try {
      toast.loading('Starting exam...');
       await examApi.startExam({ exam_code: examCode });
      toast.dismiss();
      toast.success('Exam started successfully');
      navigate(`/exam/${examCode}`);
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Failed to start exam');
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
        {profile && (
          <div className="mt-3 flex items-center text-sm text-gray-600 sm:mt-0">
            <User className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500" />
            <p>
              Welcome, <span className="font-medium text-gray-900">{profile?.name || profile?.username}</span>
            </p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">
            Select a tab
          </label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            <option value="scanner">Scan QR Code</option>
            <option value="history">Exam History</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('scanner')}
                className={`${
                  activeTab === 'scanner'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <QrCode className="-ml-0.5 mr-2 h-5 w-5" />
                Scan QR Code
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <History className="-ml-0.5 mr-2 h-5 w-5" />
                Exam History
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {activeTab === 'scanner' ? (
            <>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Scan Exam QR Code</h2>
              <QRScanner onScan={handleScan} />
            </>
          ) : (
            <>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Exam History</h2>
              <ExamHistory examSessions={examHistory} isLoading={isLoading} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;