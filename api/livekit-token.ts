// api/livekit-token.ts
import { AccessToken } from 'livekit-server-sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  const { roomName, identity } = req.body;

  if (!roomName || !identity) {
    return res.status(400).json({ message: 'Missing roomName or identity' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error("LiveKit server credentials not configured.");
    return res.status(500).json({ message: 'Server not configured.' });
  }
  
  const at = new AccessToken(apiKey, apiSecret, { identity });
  at.addGrant({ roomJoin: true, room: roomName });
  
  const token = await at.toJwt();

  res.status(200).json({ token });
}
