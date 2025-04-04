"use client";

import { useState, useEffect } from 'react';

interface ActivityProgressProps {
  questionsCompleted?: number;
  totalQuestions?: number;
  timeSpent?: number;
  domainsSolved?: number;
  totalDomains?: number;
}

export default function ActivityProgress({
  questionsCompleted = 24,
  totalQuestions = 120,
  timeSpent = 8.5,
  domainsSolved = 3,
  totalDomains = 5
}: ActivityProgressProps) {
  // Calculate percentages
  const questionsPercentage = Math.round((questionsCompleted / totalQuestions) * 100);
  const domainsPercentage = Math.round((domainsSolved / totalDomains) * 100);
  
  // For demo purposes, calculate a total progress percentage
  const totalProgress = Math.round((questionsPercentage * 0.7) + (domainsPercentage * 0.3));
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 max-w-md mx-auto">
      {/* Status header */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-gray-800 dark:text-gray-200 font-medium">Status.</h2>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Your learning progress</p>
        </div>
        <div className="flex space-x-0.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1 h-3 bg-gray-800 dark:bg-gray-200"></div>
          ))}
        </div>
      </div>
      
      {/* Main percentage */}
      <div className="flex justify-between items-center mb-8">
        <div className="text-8xl font-light text-gray-800 dark:text-gray-100">
          {totalProgress}%
        </div>
        <div className="text-gray-800 dark:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </div>
      </div>
      
      {/* Progress breakdown */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        <span className="mr-4">{questionsPercentage}% Questions</span>
        <span>{domainsPercentage}% Domains</span>
      </div>
      
      {/* Questions status box */}
      <div className="flex mb-4">
        <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg w-1/3">
          <h3 className="font-medium text-gray-800 dark:text-gray-200">Progress status</h3>
          <div className="text-3xl font-light text-gray-800 dark:text-gray-200 mt-1">
            {questionsPercentage}%
          </div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg ml-2 flex-grow flex items-center justify-end">
          <div className="text-right">
            <div className="text-gray-500 dark:text-gray-400 text-sm">{questionsCompleted} questions</div>
            <div className="text-gray-800 dark:text-gray-200">{totalQuestions} total</div>
          </div>
        </div>
      </div>
      
      {/* Time and domains stats */}
      <div className="flex">
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg w-1/2">
          <div className="flex items-center mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800 dark:text-gray-200 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-medium text-gray-800 dark:text-gray-200">Time spent</h3>
          </div>
          <div className="text-3xl font-light text-gray-800 dark:text-gray-200">
            {timeSpent}h
          </div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg ml-2 w-1/2">
          <div className="flex justify-between">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800 dark:text-gray-200 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <div className="text-3xl font-light text-gray-800 dark:text-gray-200">
                {domainsPercentage}%
              </div>
            </div>
            <div className="self-end text-right">
              <div className="text-gray-500 dark:text-gray-400 text-sm">{domainsSolved} domains</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom navigation */}
      <div className="flex justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Today
        </div>
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Progress
        </div>
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Content
        </div>
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile
        </div>
      </div>
    </div>
  );
}
