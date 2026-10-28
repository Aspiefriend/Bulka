import { useState, useEffect } from 'react';
import './CountdownTimer.css';

function CountdownTimer({ deadline }) {
  const calculateTimeLeft = () => {
    const difference = new Date(deadline) - new Date();
    return difference > 0 ? difference : 0;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (timeLeft === 0) return;

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft === 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, timeLeft]);

  if (timeLeft === 0) {
    return <span className="timer timer--expired">Время оплаты истекло</span>;
  }

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <span className="timer">
      Оплатить за {minutes}:{seconds.toString().padStart(2, '0')}
    </span>
  );
}

export default CountdownTimer;
