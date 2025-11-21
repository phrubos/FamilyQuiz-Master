import { NextRequest, NextResponse } from 'next/server';
import { pauseGame, resumeGame, getRoom, getPauseState } from '@/lib/gameStore';
import { pusherServer, getGameChannel } from '@/lib/pusher';

// POST /api/rooms/[code]/pause - Pause or resume game
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { action, remainingTime } = body;

    const room = getRoom(code);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (action === 'pause') {
      const pauseState = pauseGame(code, remainingTime);
      if (!pauseState) {
        return NextResponse.json({ error: 'Failed to pause game' }, { status: 400 });
      }

      await pusherServer.trigger(getGameChannel(code), 'game-paused', {
        pausedAt: pauseState.pausedAt,
        remainingTime: pauseState.remainingTime,
      });

      return NextResponse.json({ success: true, pauseState });
    }

    if (action === 'resume') {
      const success = resumeGame(code);
      if (!success) {
        return NextResponse.json({ error: 'Failed to resume game' }, { status: 400 });
      }

      const pauseState = getPauseState(code);

      await pusherServer.trigger(getGameChannel(code), 'game-resumed', {
        resumedAt: Date.now(),
        remainingTime: pauseState?.remainingTime,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Pause error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/rooms/[code]/pause - Get current pause state
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const pauseState = getPauseState(code);

    return NextResponse.json({ pauseState });
  } catch (error) {
    console.error('Get pause state error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
