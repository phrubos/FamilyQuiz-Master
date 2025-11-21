// Fisher-Yates shuffle algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Shuffle answers and update correct index
export function shuffleQuestion<T extends {
  id: string;
  question: string;
  answers: string[];
  correct: number | string | string[];
}>(question: T): T {
  if (typeof question.correct !== 'number') {
    // For sorting type, we might want to shuffle answers but keep correct as ordered list
    // But for now let's just return as is and let frontend shuffle or use randomItems
    return question;
  }

  const correctAnswer = question.answers[question.correct];
  const shuffledAnswers = shuffleArray(question.answers);
  const newCorrectIndex = shuffledAnswers.indexOf(correctAnswer);

  return {
    ...question,
    answers: shuffledAnswers,
    correct: newCorrectIndex,
  };
}

// Get random items from array
export function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

// Get random item from array
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
