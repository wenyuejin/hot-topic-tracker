import { useState, useEffect, useRef } from 'react';
import moment from 'moment';

export function useClock() {
  const [time, setTime] = useState(moment());
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTime(moment());
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timeStr: time.format('HH:mm:ss'),
    dateStr: time.format('YYYY-MM-DD'),
  };
}
