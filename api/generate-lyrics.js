// This function runs on Vercel's server, not in the user's browser.
// The Claude API key lives here (as an environment variable), so it
// never appears in any code the user can see or copy.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let theme, genre, mood;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    theme = (body?.theme || '').trim();
    genre = body?.genre || 'Pop';
    mood = body?.mood || 'Bittersweet';
  } catch (e) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  if (!theme) {
    return res.status(400).json({ error: 'Theme is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is not configured yet (missing API key).' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Write original song lyrics for a ${genre} song with a ${mood} mood, about: "${theme}".
Structure it with [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Chorus] tags on their own lines, Suno-style.
Keep language simple and singable. Do not add any explanation, preamble, or notes — output only the tagged lyrics.`
          }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(502).json({ error: data.error.message || 'Claude API error' });
    }

    const text = (data.content || []).map(b => b.text || '').join('\n').trim();

    return res.status(200).json({ lyrics: text });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reach Claude API' });
  }
      }
