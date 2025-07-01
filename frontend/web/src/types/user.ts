export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  verified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  followers: number;
  following: number;
  posts: number;
  isFollowing?: boolean;
} 