export type FollowStatus = 'pending' | 'accepted';
export type FollowRelation = 'none' | 'pending' | 'accepted';

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  status?: FollowStatus;
}

export interface FollowRequestProfile {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
}
