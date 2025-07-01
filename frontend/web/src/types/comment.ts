import { User } from './user';

export interface Comment {
  _id: string;
  content: string;
  user: User;
  post: string;
  likes: string[];
  parentComment?: string;
  replies?: Comment[];
  createdAt: string;
} 