import { useState, useEffect } from 'react';

interface Question {
  question_id: number;
  title: string;
}

interface QuestionListProps {
  topicId: number | null;
  onSelectQuestion: (questionId: number) => void;
  selectedQuestionId: number | null;
}

export default function QuestionList({ 
  topicId, 
  onSelectQuestion, 
  selectedQuestionId 
}: QuestionListProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!topicId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/questions?topicId=${topicId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }
        
        const data = await response.json();
        setQuestions(data);
      } catch (err) {
        setError('Error loading questions. Please try again.');
        console.error('Error fetching questions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [topicId]);

  if (!topicId) {
    return (
      <div className="card shadow-card overflow-hidden">
        <h2 className="text-xl font-semibold p-4 bg-orange-500 text-white">Questions</h2>
        <div className="p-4 text-gray-500">Please select a topic to view questions.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card shadow-card overflow-hidden">
        <h2 className="text-xl font-semibold p-4 bg-orange-500 text-white">Questions</h2>
        <div className="p-4">Loading questions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card shadow-card overflow-hidden">
        <h2 className="text-xl font-semibold p-4 bg-orange-500 text-white">Questions</h2>
        <div className="p-4 text-red-500">{error}</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="card shadow-card overflow-hidden">
        <h2 className="text-xl font-semibold p-4 bg-orange-500 text-white">Questions</h2>
        <div className="p-4 text-gray-500">No questions found for this topic.</div>
      </div>
    );
  }

  return (
    <div className="card shadow-card overflow-hidden">
      <h2 className="text-xl font-semibold p-4 bg-orange-500 text-white">Questions</h2>
      <div className="max-h-[60vh] overflow-y-auto hide-scrollbar">
        {questions.map((question) => (
          <div key={question.question_id} className="p-3 border-b border-gray-100">
            <button
              onClick={() => onSelectQuestion(question.question_id)}
              className={`w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors ${
                selectedQuestionId === question.question_id ? 'bg-gray-100 border-l-4 border-orange-500' : ''
              }`}
            >
              <h3 className={`${selectedQuestionId === question.question_id ? 'font-medium text-orange-500' : 'text-gray-800'}`}>
                {question.title}
              </h3>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 