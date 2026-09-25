import React, { useEffect, useState, useRef } from 'react';

export interface TypeWritterProps {
  key?: React.Key;
  text: string;
  speed?: number; // ms per character, default 28ms
  onComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;
  cursorColor?: string;
}

export function TypeWritter({
  text,
  speed = 28,
  onComplete,
  className,
  style,
  cursorColor = '#FF4D24',
}: TypeWritterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    setIsFinished(false);

    const interval = setInterval(() => {
      index++;
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
      } else {
        clearInterval(interval);
        setIsFinished(true);
        onCompleteRef.current?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <div
      className={className}
      style={{
        fontFamily: "'Geist Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace",
        fontSize: 12.5,
        lineHeight: 1.6,
        color: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        ...style,
      }}
    >
      <span>{displayedText}</span>
      {!isFinished && (
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 13,
            backgroundColor: cursorColor,
            marginLeft: 2,
            borderRadius: 1,
            animation: 'blink 0.8s infinite',
            verticalAlign: 'middle',
          }}
        />
      )}
    </div>
  );
}
