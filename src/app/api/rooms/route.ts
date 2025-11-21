import { NextResponse } from 'next/server';
import { createRoom } from '@/lib/gameStore';
import { v4 as uuidv4 } from 'uuid';

export async function POST() {
  const hostId = uuidv4();
  const room = createRoom(hostId);

  return NextResponse.json({
    code: room.code,
    hostId: room.hostId,
  });
}
