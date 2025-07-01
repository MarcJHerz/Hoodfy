import { User } from './user';
import { Comment } from './comment';

export interface Media {
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

export interface Post {
  _id: string;
  content: string;
  author: User;
  media?: Media[];
  likes: string[];
  comments?: Comment[];
  commentsCount: number;
  community?: {
    _id: string;
    name: string;
    slug: string;
  };
  postType: 'general' | 'community';
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
  isPinned?: boolean;
  pinnedAt?: string;
} 