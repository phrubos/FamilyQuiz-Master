import { NextResponse } from 'next/server';
import { addPlayer, getRoom } from '@/lib/gameStore';
import { pusherServer, getGameChannel } from '@/lib/pusher';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { name, avatar } = await request.json();

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: 'Név megadása kötelező' }, { status: 400 });
  }

  const room = getRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'Szoba nem található' }, { status: 404 });
  }

  if (room.status !== 'waiting') {
    return NextResponse.json({ error: 'A játék már elkezdődött' }, { status: 400 });
  }

  try {
    const player = addPlayer(code, {
      id: uuidv4(),
      name: name.trim(),
      avatar,
    });

    if (!player) {
      console.error('Failed to add player to room:', code);
      return NextResponse.json({ error: 'Nem sikerült csatlakozni' }, { status: 500 });
    }

    console.log('Player added successfully:', player.id, player.name);

    // Notify host about new player
    try {
      await pusherServer.trigger(getGameChannel(code), 'player-joined', {
        player: {
          id: player.id,
          name: player.name,
          avatar: player.avatar,
          score: player.score,
          teamId: player.teamId,
        },
      });
      console.log('Pusher notification sent for player:', player.id);
    } catch (pusherError) {
      console.error('Pusher trigger failed:', pusherError);
      // Don't fail the request if Pusher fails, player is already added
    }

    return NextResponse.json({
      player: {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        teamId: player.teamId,
      },
      roomCode: code,
    });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json(
      { error: 'Szerver hiba történt' }, 
      { status: 500 }
    );
  }
}
