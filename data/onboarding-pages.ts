export type OnboardingSceneType = 'receive' | 'give' | 'connection';

export type OnboardingPage = {
  id: string;
  title: string;
  description: string;
  scene: OnboardingSceneType;
};

export const onboardingPages: OnboardingPage[] = [
  {
    id: 'receive',
    title: '朝、誰かの声が届く。',
    description: 'あなたの明日を知った誰かが、短い声を残してくれます。',
    scene: 'receive',
  },
  {
    id: 'give',
    title: '夜、自分も短い声を届ける。',
    description: '明日の誰かへ、10秒だけ。あなたの言葉をそっと届けます。',
    scene: 'give',
  },
  {
    id: 'connection',
    title: '小さなつながりが、朝を少し変える。',
    description: '深くつながらなくても、ひとりではない朝をつくれます。',
    scene: 'connection',
  },
];
