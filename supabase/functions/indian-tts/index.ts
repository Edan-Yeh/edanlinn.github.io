const ALLOWED_ORIGINS = new Set([
  'https://edanlinn.github.io',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
]);

const VOICES = new Set([
  'en-IN-PrabhatNeural',
  'en-IN-NeerjaNeural'
]);

function cors(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://edanlinn.github.io';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Expose-Headers': 'X-Edan-TTS-Voice, X-Edan-TTS-Provider',
    'Vary': 'Origin'
  };
}

function json(body: unknown, status: number, headers: Record<string,string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, ch => ({
    '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'
  }[ch]!));
}

Deno.serve(async (req: Request) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, headers);

  let payload: { text?: unknown; rate?: unknown; voice?: unknown };
  try { payload = await req.json(); }
  catch { return json({ error: 'invalid_json' }, 400, headers); }

  const text = String(payload.text ?? '').replace(/\s+/g,' ').trim();
  if (!text) return json({ error: 'text_required' }, 400, headers);
  if (text.length > 1200) return json({ error: 'text_too_long', max: 1200 }, 413, headers);

  const requestedVoice = String(payload.voice ?? 'en-IN-PrabhatNeural');
  const voice = VOICES.has(requestedVoice) ? requestedVoice : 'en-IN-PrabhatNeural';
  const numericRate = Number(payload.rate ?? 1);
  const rate = Number.isFinite(numericRate) ? Math.max(0.72, Math.min(1.22, numericRate)) : 1;
  const ratePct = Math.round((rate - 1) * 100);
  const rateValue = ratePct === 0 ? '0%' : (ratePct > 0 ? '+' : '') + ratePct + '%';

  const key = Deno.env.get('AZURE_SPEECH_KEY');
  const region = Deno.env.get('AZURE_SPEECH_REGION');
  if (!key || !region) {
    return json({
      error: 'azure_speech_not_configured',
      message: 'Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in Supabase Edge Function secrets.'
    }, 503, headers);
  }

  const ssml =
    "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-IN'>" +
    "<voice name='" + voice + "'><prosody rate='" + rateValue + "'>" +
    escapeXml(text) +
    "</prosody></voice></speak>";

  let azure: Response;
  try {
    azure = await fetch('https://' + region + '.tts.speech.microsoft.com/cognitiveservices/v1', {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
        'User-Agent': 'Edan-English-Coach'
      },
      body: ssml
    });
  } catch (error) {
    console.error('Azure Speech network error', error);
    return json({ error: 'azure_network_error' }, 502, headers);
  }

  if (!azure.ok) {
    const detail = (await azure.text()).slice(0, 500);
    console.error('Azure Speech error', azure.status, detail);
    return json({ error: 'azure_speech_error', status: azure.status }, 502, headers);
  }

  const audio = await azure.arrayBuffer();
  return new Response(audio, {
    status: 200,
    headers: {
      ...headers,
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'private, max-age=86400',
      'X-Edan-TTS-Provider': 'azure-speech',
      'X-Edan-TTS-Voice': voice
    }
  });
});
