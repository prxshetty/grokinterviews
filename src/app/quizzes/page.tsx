'use client';

export default function QuizzesPage() {
  return (
    <div className="bg-white dark:bg-black min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          Quizzes
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Please select a domain from the navigation bar to start a quiz.
        </p>
      </div>
    </div>
  );
}
