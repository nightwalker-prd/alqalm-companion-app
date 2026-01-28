/**
 * Encouraging messages based on Make It Stick principles.
 * Used for exercise feedback and session summaries.
 */

/**
 * Get an encouraging message based on exercise result.
 * Messages are designed to reinforce the learning mindset.
 */
export function getEncouragingMessage(isCorrect: boolean, streak: number = 0): string {
  if (isCorrect) {
    const messages = [
      'Excellent!',
      'Well done!',
      'Perfect!',
      'That\'s right!',
      'Great job!',
    ];
    if (streak >= 3) {
      return 'You\'re on a roll!';
    }
    return messages[Math.floor(Math.random() * messages.length)];
  } else {
    // From Make It Stick: difficulty is good for learning
    const messages = [
      'This is how we learn!',
      'Mistakes help build stronger memories.',
      'Now you\'ll remember it better.',
      'Difficulty strengthens retention.',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
}

/**
 * Get a challenge-specific message based on result.
 */
export function getChallengeMessage(isCorrect: boolean): string {
  if (isCorrect) {
    const messages = [
      'Challenge completed!',
      'Mastery proven!',
      'Challenge conquered!',
      'Expert level!',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  } else {
    const messages = [
      'Challenge failed - keep practicing!',
      'Not quite at mastery level yet.',
      'Close! Try again to prove mastery.',
      'Review and try the challenge again.',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
}
