import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Full class strings (not interpolated) so Tailwind keeps them at build time
const TONE_CLASSES = {
  seen: 'text-green-600 bg-green-50',
  seenStrong: 'text-green-600 bg-green-100',
  unseenYellow: 'text-yellow-600 bg-yellow-50',
  unseenYellowStrong: 'text-yellow-600 bg-yellow-100',
  unseenRed: 'text-red-600 bg-red-50 font-medium',
};

// Pill showing whether the other party has seen a complaint or its reply
const SeenBadge = ({
  seen,
  seenLabel = 'Seen',
  unseenLabel = 'Unseen',
  unseenColor = 'yellow',
  tone = 'light',
}) => {
  const strong = tone === 'strong';
  let colorClasses;
  if (seen) {
    colorClasses = strong ? TONE_CLASSES.seenStrong : TONE_CLASSES.seen;
  } else if (unseenColor === 'red') {
    colorClasses = TONE_CLASSES.unseenRed;
  } else {
    colorClasses = strong ? TONE_CLASSES.unseenYellowStrong : TONE_CLASSES.unseenYellow;
  }

  const Icon = seen ? Eye : EyeOff;

  return (
    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${colorClasses}`}>
      <Icon className="w-3 h-3" />
      <span>{seen ? seenLabel : unseenLabel}</span>
    </div>
  );
};

export default SeenBadge;
