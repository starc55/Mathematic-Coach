import React from 'react';
import { practiceTopics, PracticeProblem } from '../data/practiceProblems';
import { ContentRenderer } from './ContentRenderer';
import { ChevronLeftIcon, CheckCircleIcon } from './Icons';

interface PracticeProblemsProps {
  onSelectProblem: (problem: PracticeProblem) => void;
  onBack: () => void;
  completedProblemIds: Set<string>;
}

export const PracticeProblems: React.FC<PracticeProblemsProps> = ({ onSelectProblem, onBack, completedProblemIds }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
      <div className="relative mb-6 text-center">
        <button 
          onClick={onBack} 
          className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-400 hover:bg-white/10"
          aria-label="Go back to welcome screen"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-light text-white">Practice Problems</h2>
        <p className="text-slate-400 mt-2">Select a topic to test your knowledge.</p>
      </div>

      <div className="space-y-8">
        {practiceTopics.map((topic) => {
          const completedCount = topic.problems.filter(p => completedProblemIds.has(p.id)).length;
          const totalCount = topic.problems.length;
          const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

          return (
            <section key={topic.id}>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-white/10 pb-2 mb-4">
                <h3 className="text-2xl font-semibold text-slate-200 mb-2 sm:mb-0">{topic.title}</h3>
                <div className="text-right">
                  <span className="text-sm font-medium text-slate-400">{completedCount} / {totalCount} Completed</span>
                  <div className="w-32 h-2 bg-white/10 rounded-full mt-1">
                    <div 
                      className="h-2 bg-slate-400 rounded-full transition-all" 
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <p className="text-slate-400 mb-6">{topic.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topic.problems.map((problem) => {
                  const isCompleted = completedProblemIds.has(problem.id);
                  return (
                    <button
                      key={problem.id}
                      onClick={() => onSelectProblem(problem)}
                      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-left hover:bg-white/10 hover:border-white/20 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-slate-400 h-full flex flex-col"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-100 mb-2 pr-2">{problem.title}</h4>
                        {isCompleted && <CheckCircleIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                      </div>
                      <div className="text-slate-300 flex-grow">
                        <ContentRenderer content={problem.problem} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};