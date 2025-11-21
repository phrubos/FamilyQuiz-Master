import { NextResponse } from 'next/server';
import { addSpectator, getRoom } from '@/lib/gameStore';
import { pusherServer, getGameChannel } from '@/lib/pusher';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  
  const room = getRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'Szoba nem található' }, { status: 404 });
  }

  const spectatorId = uuidv4();
  const spectator = addSpectator(code, { id: spectatorId, name: 'Néző' });

  if (!spectator) {
      return NextResponse.json({ error: 'Nem sikerült csatlakozni' }, { status: 500 });
  }

  // Notify host about new spectator
  await pusherServer.trigger(getGameChannel(code), 'spectator-joined', {
    spectator
  });

  return NextResponse.json({
    spectatorId: spectator.id,
    roomCode: code,
  });
}
