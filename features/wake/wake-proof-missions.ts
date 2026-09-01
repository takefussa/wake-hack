export type WakeProofMissionType = 'phrase' | 'tap' | 'shake';

export type WakeProofMission = {
  type: WakeProofMissionType;
  title: string;
  description: string;
};

const missions: WakeProofMission[] = [
  {
    type: 'phrase',
    title: '合言葉を入力',
    description: '表示された朝の合言葉を、そのまま入力します。',
  },
  {
    type: 'tap',
    title: '光った順にタップ',
    description: '番号どおりに丸をタップして、指先を起こします。',
  },
  {
    type: 'shake',
    title: 'スマホを振る',
    description: 'スマホを5回振って、からだごと朝に切り替えます。',
  },
];

export function resolveWakeProofMission(sessionId: string): WakeProofMission {
  const seed = Array.from(sessionId).reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );
  return missions[seed % missions.length];
}

export const wakeProofPhrase = 'ASA-42';
export const wakeProofTapSequence = [2, 0, 3, 1] as const;
export const wakeProofShakeGoal = 5;
