import React, { useState } from 'react';

interface PostContentProps {
  content: string;
}

const PostContent: React.FC<PostContentProps> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_LENGTH = 200;

  const shouldShowToggle = content.length > MAX_LENGTH;
  const displayContent = isExpanded ? content : content.slice(0, MAX_LENGTH);

  return (
    <div className="mb-3">
      <p className="text-base leading-6 text-gray-900 dark:text-gray-200">
        {displayContent}
        {shouldShowToggle && !isExpanded && '...'}
      </p>
      {shouldShowToggle && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary-600 dark:text-primary-400 text-sm font-medium mt-1 hover:underline transition-colors"
        >
          {isExpanded ? 'Mostrar menos' : 'Mostrar más'}
        </button>
      )}
    </div>
  );
};

export default PostContent; 