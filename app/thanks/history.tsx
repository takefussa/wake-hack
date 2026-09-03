import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ReceivedThanksSection } from '@/components/thanks/received-thanks-section';
import { MorningScreen } from '@/components/wake/morning-screen';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { onboardingRoute } from '@/features/navigation/onboarding-route';
import { useAppStore } from '@/store/use-app-store';
import { ScreenHeader } from '@/components/common/screen-header';

export default function ThanksHistoryScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const thanksMessages = useAppStore((state) => state.thanksMessages);
  const givenVoices = useAppStore((state) => state.givenVoiceMessages);
  const addThanksMessages = useAppStore((state) => state.addThanksMessages);

  if (!currentUser) return <Redirect href={onboardingRoute} />;
  return (
    <MorningScreen contentStyle={{ gap: 24 }}>
      <StatusBar style="dark" />
      <ScreenHeader onBack={() => goBackOrReplace('/(tabs)')} title="届いたありがとう" />
      <ReceivedThanksSection
        givenVoices={givenVoices}
        localMessages={thanksMessages}
        onMessagesLoaded={addThanksMessages}
        preview={false}
        userId={currentUser.id}
      />
    </MorningScreen>
  );
}
