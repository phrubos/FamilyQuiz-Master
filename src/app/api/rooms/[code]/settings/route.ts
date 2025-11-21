import { NextResponse } from 'next/server';
import { updateRoomSettings, getRoom } from '@/lib/gameStore';
import { pusherServer, getGameChannel } from '@/lib/pusher';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { hostId, settings } = await request.json();

  const room = getRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'Szoba nem található' }, { status: 404 });
  }

  if (room.hostId !== hostId) {
    return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
  }
  
  const updatedRoom = updateRoomSettings(code, settings);
  
  if (!updatedRoom) {
      return NextResponse.json({ error: 'Hiba a beállítások frissítésekor' }, { status: 500 });
  }

  // Notify everyone about settings update (and potential team assignments)
  await pusherServer.trigger(getGameChannel(code), 'room-updated', {
    room: updatedRoom
  });

  return NextResponse.json({ success: true, room: updatedRoom });
}
