export const motivationalQuotes = [
  "Focus is the gateway to mastery.",
  "Every session brings you closer to your goals.",
  "Consistency builds excellence, one day at a time.",
  "Your future self will thank you for today's work.",
  "Deep work is rare, valuable, and deeply satisfying.",
  "Progress, not perfection.",
  "Small daily improvements lead to stunning results.",
  "The secret of getting ahead is getting started.",
  "Discipline is choosing between what you want now and what you want most.",
  "Knowledge is power when applied with focus.",
  "Your only limit is the depth of your commitment.",
  "Invest in yourself. The returns are limitless.",
  "Champions are made in the quiet hours.",
  "Study like your dreams depend on it—because they do.",
  "The harder you work, the luckier you get.",
  "Excellence is not a destination, it's a continuous journey.",
  "Stay focused and never give up on your dreams.",
  "Learning is a treasure that follows its owner everywhere.",
  "The beautiful thing about learning is nobody can take it away from you.",
  "Education is the passport to the future.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Believe it. Build it.",
  "The only way to do great work is to love what you learn.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Sometimes later becomes never. Do it now.",
  "Study smart, stay consistent, achieve greatness.",
  "Your mind is a garden. Cultivate it with knowledge.",
];

export function getQuoteOfTheDay(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      1000 /
      60 /
      60 /
      24
  );
  return motivationalQuotes[dayOfYear % motivationalQuotes.length];
}
