// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.4';

type VoiceSafetyCategory =
  | 'safe'
  | 'insult'
  | 'hate'
  | 'sexual'
  | 'threat'
  | 'harassment'
  | 'irrelevant'
  | 'other';

type VoiceCheckResult = {
  safe: boolean;
  category: VoiceSafetyCategory;
  reason: string;
};

type VoiceCheckInput = {
  bucket: 'voice-messages' | 'community-voices';
  path: string;
  voiceKind: 'personal' | 'community';
  durationMs: number;
  voiceId?: string;
};

const allowedBuckets = new Set(['voice-messages', 'community-voices']);
const allowedCategories = new Set([
  'safe',
  'insult',
  'hate',
  'sexual',
  'threat',
  'harassment',
  'irrelevant',
  'other',
]);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  try {
    const input = validateInput(await request.json());
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    const provider = Deno.env.get('VOICE_AI_PROVIDER') ?? 'gemini';
    const model = Deno.env.get('GEMINI_CHECK_MODEL') ?? 'gemini-3.7-flash';

    if (provider !== 'gemini' || !apiKey) {
      console.error('[voice-safety] Gemini is not configured');
      return json(failedResult('voice_check_unavailable'), 503);
    }

    const audio = await downloadAudio(request, input);
    const normalizedMimeType = normalizeAudioMimeType(audio.type, input.path);
    console.info('[voice-safety] audio loaded', {
      bucket: input.bucket,
      voiceKind: input.voiceKind,
      model,
      size: audio.size,
      mimeType: normalizedMimeType,
    });
    const audioBase64 = arrayBufferToBase64(await audio.arrayBuffer());
    let result = await checkWithGemini({
      apiKey,
      model,
      audioBase64,
      mimeType: normalizedMimeType,
      voiceKind: input.voiceKind,
    });

    if (result.reason === 'audio_unreadable' && model !== 'gemini-3.7-flash') {
      console.info('[voice-safety] retrying with audio model', {
        from: model,
        to: 'gemini-3.7-flash',
      });
      result = await checkWithGemini({
        apiKey,
        model: 'gemini-3.7-flash',
        audioBase64,
        mimeType: normalizedMimeType,
        voiceKind: input.voiceKind,
      });
    }

    if (input.voiceKind === 'community' && input.voiceId) {
      await updateCommunityVoiceModeration(request, input, result);
    }

    console.info('[voice-safety] completed', {
      bucket: input.bucket,
      voiceKind: input.voiceKind,
      safe: result.safe,
      category: result.category,
      reason: result.reason.slice(0, 120),
    });

    return json(result);
  } catch (error) {
    const reason = getPublicFailureReason(error);
    console.error('[voice-safety] failed', error?.message ?? error);
    return json(failedResult(reason), 500);
  }
});

function validateInput(value: unknown): VoiceCheckInput {
  if (!value || typeof value !== 'object') {
    throw new Error('invalid_input');
  }

  const input = value as Partial<VoiceCheckInput>;
  if (!allowedBuckets.has(input.bucket ?? '')) {
    throw new Error('invalid_bucket');
  }
  if (typeof input.path !== 'string' || !input.path.trim()) {
    throw new Error('invalid_path');
  }
  if (input.voiceKind !== 'personal' && input.voiceKind !== 'community') {
    throw new Error('invalid_voice_kind');
  }
  if (
    typeof input.durationMs !== 'number' ||
    input.durationMs < 2000 ||
    input.durationMs > 10000
  ) {
    throw new Error('invalid_duration');
  }

  return {
    bucket: input.bucket,
    path: input.path,
    voiceKind: input.voiceKind,
    durationMs: input.durationMs,
    voiceId: typeof input.voiceId === 'string' ? input.voiceId : undefined,
  };
}

async function downloadAudio(request: Request, input: VoiceCheckInput): Promise<Blob> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const authorization = request.headers.get('Authorization');

  if (!supabaseUrl || !supabaseAnonKey || !authorization) {
    throw new Error('supabase_auth_unavailable');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });

  const { data, error } = await supabase.storage
    .from(input.bucket)
    .download(input.path);

  if (error || !data) {
    throw new Error(error?.message ?? 'audio_download_failed');
  }

  return data;
}

async function updateCommunityVoiceModeration(
  request: Request,
  input: VoiceCheckInput,
  result: VoiceCheckResult
): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('Authorization');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !authorization) {
    throw new Error('supabase_service_unavailable');
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('user_verification_failed');
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data, error } = await serviceClient
    .from('community_voices')
    .update({
      moderation_status: result.safe ? 'approved' : 'rejected',
      moderation_category: result.category,
      moderation_reason: result.reason,
      moderated_at: new Date().toISOString(),
    })
    .eq('id', input.voiceId)
    .eq('audio_path', input.path)
    .eq('sender_id', userData.user.id)
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'community_voice_moderation_update_failed');
  }
}

async function checkWithGemini({
  apiKey,
  model,
  audioBase64,
  mimeType,
  voiceKind,
}: {
  apiKey: string;
  model: string;
  audioBase64: string;
  mimeType: string;
  voiceKind: 'personal' | 'community';
}): Promise<VoiceCheckResult> {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/interactions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Revision': '2026-05-20',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        model,
        store: false,
        input: [
          {
            type: 'text',
            text: buildPrompt(voiceKind),
          },
          {
            type: 'audio',
            data: audioBase64,
            mime_type: mimeType,
          },
        ],
        response_format: {
          type: 'object',
          properties: {
            safe: { type: 'boolean' },
            category: {
              type: 'string',
              enum: [
                'safe',
                'insult',
                'hate',
                'sexual',
                'threat',
                'harassment',
                'irrelevant',
                'other',
              ],
            },
            reason: { type: 'string' },
          },
          required: ['safe', 'category', 'reason'],
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('[voice-safety] Gemini request failed', {
      model,
      status: response.status,
      body: body.slice(0, 500),
    });
    throw new Error(`gemini_request_failed_${response.status}`);
  }

  const payload = await response.json();
  const text = extractResponseText(payload);
  const parsed = parseJsonObject(text);
  return validateResult(parsed);
}

function extractResponseText(payload: any): string {
  const text =
    payload?.output_text ??
    payload?.candidates?.[0]?.content?.parts?.[0]?.text ??
    payload?.steps?.at?.(-1)?.content?.[0]?.text ??
    payload?.output?.at?.(-1)?.content?.[0]?.text;

  if (typeof text !== 'string' || !text.trim()) {
    console.error('[voice-safety] Gemini response had no text', {
      keys: Object.keys(payload ?? {}),
    });
    throw new Error('gemini_response_missing_text');
  }

  return text;
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(unfenced);
  } catch {
    const start = unfenced.indexOf('{');
    const end = unfenced.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(unfenced.slice(start, end + 1));
    }
    throw new Error('gemini_response_invalid_json');
  }
}

function getPublicFailureReason(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.startsWith('gemini_request_failed_') ||
    message.startsWith('gemini_response_') ||
    message === 'audio_download_failed' ||
    message === 'supabase_auth_unavailable'
  ) {
    return message;
  }
  return 'voice_check_failed';
}

function normalizeAudioMimeType(mimeType: string | undefined, path: string): string {
  if (mimeType === 'audio/mp4' && path.endsWith('.m4a')) {
    return 'audio/m4a';
  }
  return mimeType || 'audio/m4a';
}

function buildPrompt(voiceKind: 'personal' | 'community'): string {
  const audience =
    voiceKind === 'community' ? 'unknown users' : 'the selected receiver';

  return `
You are checking a short voice message that will be played as a morning wake-up alarm for ${audience}.
First understand the audio content. Then decide whether it is safe and appropriate for a wake-up voice.

If the audio cannot be heard, is empty, contains no speech, or cannot be understood, do not approve it.
Return {"safe":false,"category":"other","reason":"audio_unreadable"} in that case.

Safe examples:
- Morning greetings.
- Words that encourage the listener to wake up.
- Supportive or positive messages.
- Ordinary friendly daily conversation.
- A normal stronger wake-up phrase such as "Wake up, you will be late."

Reject examples:
- Insults or abusive language.
- Hate or discriminatory content.
- Sexual content.
- Threats.
- Harassment.
- Extremely unpleasant expressions.
- Content clearly unrelated or inappropriate for a morning wake-up voice.
- Random nonsense, spam-like speech, advertising, or content with no wake-up intent.
- Crude, mean, or uncomfortable language even when it is not a direct threat.

Approve ordinary morning messages even if they are casual or slightly energetic.
Do not approve a message only because it is short. It must contain a friendly, supportive, or wake-up-related intent.
Return JSON only.`;

  return `
これは朝の起床時に、${voiceKind === 'community' ? '知らないユーザー' : '相手ユーザー'}へ再生される短いVoiceです。
音声を文字起こししたうえで、安全性を判定してください。
音声の内容を聞き取れない場合、音声が空の場合、または音声内容が入力されていないと判断した場合は、絶対にsafeにしないでください。
その場合は {"safe":false,"category":"other","reason":"audio_unreadable"} を返してください。

安全なVoice:
- 朝の挨拶
- 起床を促す言葉
- 応援
- ポジティブなメッセージ
- 一般的な日常会話
- 「起きろー！遅刻するぞー！」程度の一般的な強めの起こし方

危険なVoice:
- 暴言
- 侮辱
- 差別
- 性的な内容
- 脅迫
- 嫌がらせ
- 著しく不快な表現
- 起床Voiceとして明らかに不適切な内容

過剰に厳しくしすぎず、朝に受け取っても問題ない一般的な内容はsafeにしてください。
返答はJSONのみです。`;
}

function validateResult(value: unknown): VoiceCheckResult {
  if (!value || typeof value !== 'object') {
    return failedResult('invalid_ai_result');
  }

  const candidate = value as Partial<VoiceCheckResult>;
  const category = allowedCategories.has(candidate.category ?? '')
    ? (candidate.category as VoiceSafetyCategory)
    : 'other';
  const safe = candidate.safe === true && category === 'safe';
  const reason =
    typeof candidate.reason === 'string' && candidate.reason.trim()
      ? candidate.reason.trim().slice(0, 240)
      : 'No reason returned';

  console.info('[voice-safety] Gemini decision', {
    safe: candidate.safe,
    category,
    reason: reason.slice(0, 160),
  });

  if (safe && indicatesUnreadableAudio(reason)) {
    return failedResult('audio_unreadable');
  }

  return {
    safe,
    category: safe ? 'safe' : category,
    reason,
  };
}

function indicatesUnreadableAudio(reason: string): boolean {
  const normalizedReason = reason.toLowerCase();
  return [
    '音声の内容が入力されていない',
    '判定できません',
    '聞き取れ',
    '文字起こしでき',
    'audio_unreadable',
    'no audio',
    'audio content is missing',
    'cannot determine',
    'could not transcribe',
    'unable to transcribe',
  ].some((pattern) => normalizedReason.includes(pattern));
}

function failedResult(reason: string): VoiceCheckResult {
  return {
    safe: false,
    category: 'other',
    reason,
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
