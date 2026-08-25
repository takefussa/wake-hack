export type AvatarId = 'luna' | 'sunny' | 'sky' | 'violet' | 'ember' | 'mint';

export type UserType = '大学生' | '受験生' | '社会人' | '社会人1年目' | 'その他';

export type ProfileTag = '一人暮らし' | '朝が苦手' | '朝活したい' | '夜型';

export type UserProfile = {
  id: string;
  nickname: string;
  avatarId: AvatarId;
  userType: UserType;
  tags: ProfileTag[];
  createdAt: string;
};

export type CreateProfileInput = Omit<UserProfile, 'id' | 'createdAt'>;
