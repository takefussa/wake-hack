import { useEffect, useState } from 'react';

import { profileService } from '@/services/profile-service';
import type { UserProfile, VoiceMessage } from '@/types';

export function useVoiceSender(voice: VoiceMessage | null): UserProfile | null {
  const [sender, setSender] = useState<UserProfile | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSender() {
      if (!voice || voice.type !== 'personal') {
        setSender(null);
        return;
      }

      try {
        const profile = await profileService.getProfile(voice.senderId);
        if (isMounted) {
          setSender(profile);
        }
      } catch {
        if (isMounted) {
          setSender(null);
        }
      }
    }

    void loadSender();
    return () => {
      isMounted = false;
    };
  }, [voice]);

  return sender;
}
