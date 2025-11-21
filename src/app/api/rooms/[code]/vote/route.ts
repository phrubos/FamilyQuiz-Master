import { NextRequest, NextResponse } from 'next/server';
import { startVoting, castVote, endVoting, getRoom, getVotingState, setQuestionStartTime } from '@/lib/gameStore';
import { pusherServer, getGameChannel } from '@/lib/pusher';
import { CategoryType, CATEGORY_META } from '@/types/game';
import { categories } from '@/data/questions';

// POST /api/rooms/[code]/vote - Start voting or cast vote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { action, playerId, category } = body;

    const room = getRoom(code);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (action === 'start') {
      // Start voting
      const votingState = startVoting(code);
      if (!votingState) {
        return NextResponse.json({ error: 'Failed to start voting' }, { status: 400 });
      }

      // Get category names for display
      const categoryOptions = votingState.options.map(cat => ({
        id: cat,
        name: CATEGORY_META[cat].name,
        icon: CATEGORY_META[cat].icon,
        color: CATEGORY_META[cat].color,
      }));

      await pusherServer.trigger(getGameChannel(code), 'voting-started', {
        categories: categoryOptions,
        duration: 10000,
        endTime: votingState.endTime,
      });

      return NextResponse.json({ success: true, votingState: { ...votingState, categoryOptions } });
    }

    if (action === 'cast') {
      // Cast vote
      if (!playerId || !category) {
        return NextResponse.json({ error: 'Missing playerId or category' }, { status: 400 });
      }

      const success = castVote(code, playerId, category as CategoryType);
      if (!success) {
        return NextResponse.json({ error: 'Failed to cast vote' }, { status: 400 });
      }

      const votingState = getVotingState(code);

      // Count current votes
      const voteCounts: Record<string, number> = {};
      if (votingState) {
        for (const cat of votingState.options) {
          voteCounts[cat] = 0;
        }
        for (const cat of Object.values(votingState.votes)) {
          voteCounts[cat] = (voteCounts[cat] || 0) + 1;
        }
      }

      await pusherServer.trigger(getGameChannel(code), 'vote-cast', {
        playerId,
        category,
        currentVotes: voteCounts,
      });

      return NextResponse.json({ success: true, currentVotes: voteCounts });
    }

    if (action === 'end') {
      // End voting
      const winner = endVoting(code);
      if (!winner) {
        return NextResponse.json({ error: 'Failed to end voting' }, { status: 400 });
      }

      const votingState = getVotingState(code);

      // Count final votes
      const voteCounts: Record<string, number> = {};
      if (votingState) {
        for (const cat of votingState.options) {
          voteCounts[cat] = 0;
        }
        for (const cat of Object.values(votingState.votes)) {
          voteCounts[cat] = (voteCounts[cat] || 0) + 1;
        }
      }

      await pusherServer.trigger(getGameChannel(code), 'voting-ended', {
        winner,
        winnerName: CATEGORY_META[winner].name,
        winnerIcon: CATEGORY_META[winner].icon,
        votes: voteCounts,
      });

      // Automatically proceed to next question
      setTimeout(async () => {
        const room = getRoom(code);
        if (room && room.questions[room.currentQuestionIndex]) {
            setQuestionStartTime(code);
            
            const nextQ = room.questions[room.currentQuestionIndex];
            const categoryData = categories.find(c => c.questions.some(q => q.id === nextQ.id));
            const currentRound = room.rounds[room.currentRoundIndex];
            
            await pusherServer.trigger(getGameChannel(code), 'question-shown', {
              question: {
                ...nextQ,
                categoryName: categoryData?.name,
                isBonus: categoryData?.isBonus || false,
              },
              questionIndex: room.currentQuestionIndex,
              totalQuestions: room.questions.length,
              roundInfo: {
                  current: room.currentRoundIndex + 1,
                  total: room.rounds.length,
                  name: currentRound.name,
                  type: currentRound.type
              }
            });
        }
      }, 4000);

      return NextResponse.json({
        success: true,
        winner,
        winnerName: CATEGORY_META[winner].name,
        votes: voteCounts
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/rooms/[code]/vote - Get current voting state
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const votingState = getVotingState(code);

    if (!votingState) {
      return NextResponse.json({ error: 'No active voting' }, { status: 404 });
    }

    // Count current votes
    const voteCounts: Record<string, number> = {};
    for (const cat of votingState.options) {
      voteCounts[cat] = 0;
    }
    for (const cat of Object.values(votingState.votes)) {
      voteCounts[cat] = (voteCounts[cat] || 0) + 1;
    }

    return NextResponse.json({
      votingState,
      currentVotes: voteCounts
    });
  } catch (error) {
    console.error('Get voting state error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
