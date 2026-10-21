import { useState } from 'react';

const PREVIEW_LENGTH = 220;

export function PostContent({
  content,
  compact = false,
}: {
  content: string;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = compact && content.length > PREVIEW_LENGTH;
  const preview = isLong
    ? content
        .slice(0, PREVIEW_LENGTH)
        .replace(/\s+\S*$/u, '')
        .trimEnd()
    : content;

  return (
    <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
      <p className="whitespace-pre-wrap wrap-break-word">
        {isLong && !expanded ? `${preview}…` : content}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-1 font-semibold text-gray-600 dark:text-gray-300 hover:underline"
        >
          {expanded ? 'Xem bớt' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
}
