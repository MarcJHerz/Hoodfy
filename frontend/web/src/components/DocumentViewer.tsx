import React from 'react';
import { platform } from '../config/platform';
import { theme } from '../theme';

interface DocumentViewerProps {
  url: string;
  title: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ url, title }) => {
  return (
    <div className="flex flex-col h-full bg-white">
      <h2 className="text-lg font-semibold text-gray-900 py-4 text-center m-0">
        {title}
      </h2>
      <iframe
        src={url}
        className="flex-1 w-full h-[70vh] border-none"
        title={title}
      />
    </div>
  );
}; 