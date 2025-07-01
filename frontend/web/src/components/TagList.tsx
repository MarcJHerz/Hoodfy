import React from 'react';

interface TagListProps {
  tags: string[];
}

export const TagList: React.FC<TagListProps> = ({ tags }) => {
  return (
    <div className="my-2">
      <div className="flex flex-wrap gap-2 px-1">
        {tags.map((tag, index) => (
          <button
            key={index}
            className="bg-primary-50 px-3 py-1.5 rounded-full text-primary-600 text-sm font-medium hover:bg-primary-100 transition-colors"
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
}; 