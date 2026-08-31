export type AvatarId = 'luna' | 'sunny' | 'sky' | 'violet' | 'ember' | 'mint';

export type UserType = '中高生' | '大学生・専門学生' | '社会人' | 'その他';

export type LifeRhythm = '朝型' | '夜型' | '不規則';

export type UserProfile = {
  id: string;
  nickname: string;
  avatarId: AvatarId;
  profileImageUri?: string;
  bio?: string;
  userType: UserType;
  tags: LifeRhythm[];
  createdAt: string;
};

export type CreateProfileInput = Omit<UserProfile, 'id' | 'createdAt'>;

export type UpdateProfileInput = CreateProfileInput;
