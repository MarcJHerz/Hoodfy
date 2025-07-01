export interface UserProfile {
  _id: string;
  name: string;
  username: string;
  profilePicture: string;
  bannerImage: string;
  bio: string;
  category: string;
  links: string[];
  subscriptionPrice: number;
  profileBlocks: Array<{
    type: string;
    content: any;
    position: number;
    styles: any;
  }>;
  createdAt: string;
  lastLogin: string;
  mainBadgeIcon: string | null;
}

export interface Community {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  members?: UserProfile[];
  creator?: UserProfile;
  isNew?: boolean;
}

export interface Comment {
  _id: string;
  content: string;
  author: UserProfile;
  createdAt: string;
}

export interface Post {
  _id: string;
  content: string;
  images?: string[];
  author: UserProfile;
  community?: Community;
  postType: 'general' | 'community';
  likes: string[];
  comments: Comment[];
  createdAt: string;
  isLiked?: boolean;
} 