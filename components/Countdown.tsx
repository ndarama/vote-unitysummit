'use client';

import React, { useState, useEffect } from 'react';

const Countdown: React.FC = () => {
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    fetch('/api/countdown')
      .then((res) => res.json())
      .then((data) => {
        if (data?.targetDate) setTargetDate(data.targetDate);
        if (typeof data?.enabled === 'boolean') setEnabled(data.enabled);
      })
      .catch(() => {/* no config available */});
  }, []);

  useEffect(() => {
    if (!enabled || !targetDate) return;

    const target = new Date(targetDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, enabled]);

  if (!enabled || !targetDate) return null;

  return (
    <div className="flex justify-center gap-4 md:gap-8 mt-8 text-white">
      <div className="text-center">
        <div className="text-3xl md:text-5xl font-bold font-mono">{timeLeft.days}</div>
        <div className="text-xs md:text-sm uppercase tracking-widest opacity-80">Dager</div>
      </div>
      <div className="text-3xl md:text-5xl font-bold font-mono">:</div>
      <div className="text-center">
        <div className="text-3xl md:text-5xl font-bold font-mono">
          {timeLeft.hours.toString().padStart(2, '0')}
        </div>
        <div className="text-xs md:text-sm uppercase tracking-widest opacity-80">Timer</div>
      </div>
      <div className="text-3xl md:text-5xl font-bold font-mono">:</div>
      <div className="text-center">
        <div className="text-3xl md:text-5xl font-bold font-mono">
          {timeLeft.minutes.toString().padStart(2, '0')}
        </div>
        <div className="text-xs md:text-sm uppercase tracking-widest opacity-80">Minutter</div>
      </div>
      <div className="text-3xl md:text-5xl font-bold font-mono">:</div>
      <div className="text-center">
        <div className="text-3xl md:text-5xl font-bold font-mono">
          {timeLeft.seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-xs md:text-sm uppercase tracking-widest opacity-80">Sekunder</div>
      </div>
    </div>
  );
};

export default Countdown;
