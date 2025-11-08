import React from 'react';
import type { SavedSession } from '../types';
import { CloseIcon, TrashIcon } from './Icons';

interface LoadSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedSession[];
  onLoad: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}

export const LoadSessionModal: React.FC<LoadSessionModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onLoad,
  onDelete,
}) => {
  if (!isOpen) return null;

  // Sort sessions by newest first
  const sortedSessions = [...sessions].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-40"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl w-full max-w-2xl m-4 transform transition-all"
        onClick={e => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-200">Load Session</h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-slate-400 hover:bg-white/10"
            aria-label="Close modal"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {sortedSessions.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No saved sessions yet.</p>
          ) : (
            <ul className="space-y-3">
              {sortedSessions.map(session => (
                <li 
                  key={session.id} 
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1 mb-3 sm:mb-0">
                    <p className="font-semibold text-slate-200">{session.name}</p>
                    <p className="text-sm text-slate-400">
                      {new Date(session.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2 w-full sm:w-auto">
                    <button 
                      onClick={() => onLoad(session.id)}
                      className="flex-1 sm:flex-none justify-center px-4 py-2 text-sm font-semibold text-black bg-slate-200 rounded-md hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-white transition-colors"
                    >
                      Load
                    </button>
                    <button 
                      onClick={() => onDelete(session.id)}
                      className="p-2 text-slate-400 bg-white/5 rounded-md hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                      aria-label={`Delete session ${session.name}`}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};