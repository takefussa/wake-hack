export type OnboardingSceneType = 'setup' | 'give' | 'wake' | 'thanks';

export type OnboardingPage = {
  id: string;
  title?: string;
  description?: string;
  scene: OnboardingSceneType;
};

export const onboardingPages: OnboardingPage[] = [
  {
    id: 'setup',
    title: '夜、明日の朝を設定する。',
    description: '起きる時間・予定・気分と、どんな声がほしいかを登録します。',
    scene: 'setup',
  },
  {
    id: 'give',
    title: 'タイムラインから、声を届ける。',
    description: '起こしたい相手へ10秒の声を録音すると、あなたの朝にも誰かの声が届きます。',
    scene: 'give',
  },
  {
    id: 'wake',
    title: '朝、通知と一緒に声が届く。',
    description: '設定した時間に通知が届き、誰かの声を聴いて朝を始めます。',
    scene: 'wake',
  },
  {
    id: 'thanks',
    title: '起きたら、ありがとうを返す。',
    description: 'オキタ証明をして、声をくれた相手へ感謝やひとことを届けます。',
    scene: 'thanks',
  },
];
