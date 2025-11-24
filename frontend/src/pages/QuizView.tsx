import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { quizzesService } from '../services/quizzes';
import { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Question } from '../types';
import { cn } from '../utils/cn';

const QuizView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<(string | string[])[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [startTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', id],
    queryFn: () => quizzesService.getById(id!),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: (submission: { answers: (string | string[])[]; timeSpent: number }) =>
      quizzesService.submit(id!, submission),
    onSuccess: (data) => {
      // Store both result and quiz data
      setResult({
        ...data.result,
        quiz: data.quiz,
      });
      setSubmitted(true);
      toast.success(
        data.result.passed
          ? `Тест пройден! Вы набрали ${data.result.percentage}%`
          : `Тест не пройден. Вы набрали ${data.result.percentage}%`
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка отправки теста');
    },
  });

  const handleAnswerChange = (questionIndex: number, answer: string | string[]) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      toast.error('Тест не загружен или не содержит вопросов');
      return;
    }
    
    // Ensure answers array matches questions length
    const currentAnswers = [...answers];
    while (currentAnswers.length < quiz.questions.length) {
      currentAnswers.push('');
    }

    // Check if all questions are answered
    const unansweredQuestions = quiz.questions.filter((_, index) => {
      const answer = currentAnswers[index];
      if (!answer) return true;
      if (Array.isArray(answer) && answer.length === 0) return true;
      if (typeof answer === 'string' && answer.trim() === '') return true;
      return false;
    });

    if (unansweredQuestions.length > 0) {
      toast.error(`Ответьте на все вопросы. Осталось ${unansweredQuestions.length} вопросов`);
      return;
    }

    const spent = Math.round((Date.now() - startTime) / 1000 / 60); // minutes
    setTimeSpent(spent);
    submitMutation.mutate({ answers: currentAnswers.slice(0, quiz.questions.length), timeSpent: spent });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Тест не найден</h3>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Назад
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
        {quiz.description && (
          <p className="mt-2 text-gray-600 dark:text-gray-400">{quiz.description}</p>
        )}
        {quiz.timeLimit && (
          <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4 mr-1" />
            Лимит времени: {quiz.timeLimit} минут
          </div>
        )}
      </div>

      {!submitted ? (
        <div className="space-y-6">
          {quiz.questions && Array.isArray(quiz.questions) && quiz.questions.length > 0 ? (
            quiz.questions.map((question: Question, index: number) => (
              <div key={question._id || index} className="card">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Вопрос {index + 1}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {question.points || 1} балл{(question.points || 1) !== 1 ? 'ов' : ''}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">{question.question || 'Вопрос без текста'}</p>

              {question.type === 'single' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      className={cn(
                        'flex items-center p-3 border rounded-lg cursor-pointer transition-colors',
                        answers[index] === option
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      )}
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={option}
                        checked={answers[index] === option}
                        onChange={() => handleAnswerChange(index, option)}
                        className="mr-3"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'multiple' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const selectedAnswers = Array.isArray(answers[index])
                      ? (answers[index] as string[])
                      : [];
                    const isChecked = selectedAnswers.includes(option);
                    return (
                      <label
                        key={optionIndex}
                        className={cn(
                          'flex items-center p-3 border rounded-lg cursor-pointer transition-colors',
                          isChecked
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const newSelected = isChecked
                              ? selectedAnswers.filter((a) => a !== option)
                              : [...selectedAnswers, option];
                            handleAnswerChange(index, newSelected);
                          }}
                          className="mr-3"
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {question.type === 'text' && (
                <input
                  type="text"
                  value={Array.isArray(answers[index]) ? '' : (answers[index] as string) || ''}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  className="input"
                  placeholder="Введите ответ"
                />
              )}
              </div>
            ))
          ) : (
            <div className="card">
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Тест не содержит вопросов
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={handleSubmit} className="btn btn-primary" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? 'Отправка...' : 'Отправить ответы'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card">
            <div className="text-center mb-6">
              {result?.passed ? (
                <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
              ) : (
                <XCircle className="h-16 w-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
              )}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {result?.passed ? 'Тест пройден!' : 'Тест не пройден'}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Ваш результат: {result?.score || 0} / {result?.maxScore || quiz?.questions?.reduce((sum: number, q: any) => sum + (q.points || 1), 0) || 0} ({result?.percentage || 0}%)
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Проходной балл: {quiz?.passingScore || 70}%
              </p>
            </div>
          </div>

          {result?.answers && Array.isArray(result.answers) && result.quiz && result.quiz.questions && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Результаты по вопросам
              </h3>
              {result.quiz.questions.map((question: any, index: number) => {
                const answerResult = result.answers[index];
                if (!answerResult) return null;
                return (
                  <div
                    key={question._id || index}
                    className={cn(
                      'card',
                      answerResult.isCorrect
                        ? 'border-green-200 dark:border-green-800'
                        : 'border-red-200 dark:border-red-800'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Вопрос {index + 1}
                      </h4>
                      {answerResult.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">{question.question || 'Вопрос без текста'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Ваш ответ: {Array.isArray(answerResult.answer) ? answerResult.answer.join(', ') : (answerResult.answer || 'Нет ответа')}
                    </p>
                    {!answerResult.isCorrect && question.correctAnswers && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Правильный ответ:{' '}
                        {Array.isArray(question.correctAnswers)
                          ? question.correctAnswers.join(', ')
                          : question.correctAnswers}
                      </p>
                    )}
                    {question.explanation && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {question.explanation}
                      </p>
                    )}
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
                      Баллы: {answerResult.points || 0} / {question.points || 0}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizView;

