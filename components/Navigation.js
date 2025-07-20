import React from 'react';

const Navigation = ({ onSavedVideosClick }) => (
  <nav className="w-full flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white shadow-md">
    <span className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-wide mb-2 sm:mb-0">
      Face Tracking + Recording
    </span>
    <ul className="flex flex-col sm:flex-row items-center ml-0 sm:ml-auto">
      <li className="">
        <button
          onClick={onSavedVideosClick}
          className="text-base font-semibold text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          Saved Videos
        </button>
      </li>
    </ul>
  </nav>
);

export default Navigation; 