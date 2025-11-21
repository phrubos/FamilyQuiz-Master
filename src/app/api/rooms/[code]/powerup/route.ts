import { NextResponse } from 'next/server';
import { activatePowerUp, getFiftyFiftyAnswers, getPlayerPowerUp, getRoom } from '@/lib/gameStore';
import { pusherServer, getGameChannel } from '@/lib/pusher';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { playerId, action } = await request.json();

  const room = getRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'Szoba nem található' }, { status: 404 });
  }

  if (action === 'activate') {
    const result = activatePowerUp(code, playerId);
    if (!result.success) {
      return NextResponse.json({ error: 'Nincs elérhető power-up' }, { status: 400 });
    }

    // Notify about power-up activation
    await pusherServer.trigger(getGameChannel(code), 'powerup-activated', {
      playerId,
      powerUp: result.powerUp,
    });

    // If fifty_fifty, return the eliminated answers
    if (result.powerUp === 'fifty_fifty') {
      const eliminatedAnswers = getFiftyFiftyAnswers(code);
      return NextResponse.json({
        success: true,
        powerUp: result.powerUp,
        eliminatedAnswers,
      });
    }

    return NextResponse.json({
      success: true,
      powerUp: result.powerUp,
    });
  }

  if (action === 'get') {
    const powerUp = getPlayerPowerUp(code, playerId);
    return NextResponse.json({ powerUp });
  }

  return NextResponse.json({ error: 'Ismeretlen művelet' }, { status: 400 });
}
