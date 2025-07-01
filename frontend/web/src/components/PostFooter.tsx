import React from 'react';
import { Post } from '@/types/post';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from '@heroicons/react/24/solid';

interface PostFooterProps {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  isLiked?: boolean;
  isSaved?: boolean;
}

export const PostFooter: React.FC<PostFooterProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onSave,
  isLiked = false,
  isSaved = false,
}) => {
  return (
    <div className="px-0 py-3 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onLike}
            className={`flex items-center space-x-2 text-gray-500 hover:text-red-500`}
          >
            {post.isLiked || isLiked ? (
              <HeartIconSolid className="h-6 w-6 text-red-500" />
            ) : (
              <HeartIcon className="h-6 w-6" />
            )}
            <span>{post.likes.length}</span>
          </button>
          <button
            onClick={onComment}
            className="flex items-center space-x-2 text-gray-500 hover:text-blue-500"
          >
            <ChatBubbleLeftIcon className="h-6 w-6" />
            <span>{post.comments?.length || 0}</span>
          </button>
          <button
            onClick={onShare}
            className="text-gray-500 hover:text-green-500"
          >
            <ShareIcon className="h-6 w-6" />
          </button>
        </div>
        <button
          onClick={onSave}
          className="text-gray-500 hover:text-yellow-500"
        >
          {isSaved ? (
            <BookmarkIconSolid className="h-6 w-6 text-yellow-500" />
          ) : (
            <BookmarkIcon className="h-6 w-6" />
          )}
        </button>
      </div>
    </div>
  );
}; 