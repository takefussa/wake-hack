import { File } from 'expo-file-system';

const maxReadAttempts = 6;
const retryDelayMs = 180;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function readLocalAudioData(uri: string): Promise<ArrayBuffer> {
  let lastData: ArrayBuffer | null = null;

  for (let attempt = 0; attempt < maxReadAttempts; attempt += 1) {
    const file = new File(uri);

    if (!file.exists) {
      throw new Error('The local recording file does not exist');
    }

    lastData = await file.arrayBuffer();
    if (lastData.byteLength > 0) {
      return lastData;
    }

    await wait(retryDelayMs);
  }

  if (!lastData || lastData.byteLength === 0) {
    throw new Error('The local recording file is empty');
  }

  return lastData;
}
