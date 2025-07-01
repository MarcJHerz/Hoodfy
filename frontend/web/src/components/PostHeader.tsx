import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { theme } from '../theme';
import { UserAvatar } from './UserAvatar';

interface PostHeaderProps {
  author: {
    _id: string;
    name: string;
    username: string;
    profilePicture?: string;
  };
  createdAt: string;
  isPinned?: boolean;
  isAnnouncement?: boolean;
}

const PostHeader: React.FC<PostHeaderProps> = ({
  author,
  createdAt,
  isPinned,
  isAnnouncement,
}) => {
  return (
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center">
        <UserAvatar
          size={40}
          source={author.profilePicture}
          name={author.name}
        />
        <div className="ml-3">
          <div className="text-base font-semibold text-gray-900 dark:text-white">
            {author.name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(createdAt), {
              addSuffix: true,
              locale: es,
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {isPinned && (
          <div className="flex items-center px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/20">
            <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
              📌 Fijado
            </span>
          </div>
        )}
        {isAnnouncement && (
          <div className="flex items-center px-2 py-1 rounded-full bg-secondary-100 dark:bg-secondary-900/20">
            <span className="text-xs font-medium text-secondary-600 dark:text-secondary-400">
              📢 Anuncio
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostHeader; 