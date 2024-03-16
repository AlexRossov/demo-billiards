import React, { useEffect, useRef } from 'react';
import './App.css'

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  color: string;
}

const BilliardsTable: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const selectedBallRef = useRef<Ball | null>(null);
  const isMouseDownRef = useRef<boolean>(false);
  const pointerXRef = useRef<number>(0);
  const pointerYRef = useRef<number>(0);
  const friction = 0.995; // Коэффициент трения
  const pushForceMultiplier = 60; // Увеличенный множитель силы толчка

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleMouseMove = (event: MouseEvent) => {
      pointerXRef.current = event.clientX - canvas.getBoundingClientRect().left;
      pointerYRef.current = event.clientY - canvas.getBoundingClientRect().top;

      if (isMouseDownRef.current && selectedBallRef.current) {
        const ball = selectedBallRef.current;
        const angle = Math.atan2(pointerYRef.current - ball.y, pointerXRef.current - ball.x);
        ball.dx = Math.cos(angle) * 0.1 * pushForceMultiplier;
        ball.dy = Math.sin(angle) * 0.1 * pushForceMultiplier;
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const balls = ballsRef.current;
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      balls.forEach(ball => {
        if (Math.sqrt((mouseX - ball.x) ** 2 + (mouseY - ball.y) ** 2) < ball.radius) {
          selectedBallRef.current = ball;
          isMouseDownRef.current = true;
          document.addEventListener('mousemove', handleMouseMove);
        }
      });
    };

    const handleMouseUp = () => {
      selectedBallRef.current = null;
      isMouseDownRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
    };

    document.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousedown', handleMouseDown);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const balls = ballsRef.current;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = 'green';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      balls.forEach(ball => {
        ctx.beginPath();
        ctx.fillStyle = ball.color;
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        // Применяем трение
        ball.dx *= friction;
        ball.dy *= friction;

        ball.x += ball.dx;
        ball.y += ball.dy;

        // Обработка столкновений со стенками
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvasWidth) {
          ball.dx *= -0.9; // Уменьшаем скорость при ударе о стенку
        }
        if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvasHeight) {
          ball.dy *= -0.9; // Уменьшаем скорость при ударе о стенку
        }

        // Обработка столкновений между шарами
        balls.forEach(otherBall => {
          if (ball !== otherBall) {
            const distX = otherBall.x - ball.x;
            const distY = otherBall.y - ball.y;
            const distance = Math.sqrt(distX * distX + distY * distY);

            if (distance < ball.radius + otherBall.radius) {
              const angle = Math.atan2(distY, distX);
              const sine = Math.sin(angle);
              const cosine = Math.cos(angle);

              // Rotate velocities
              const velocityX = ball.dx * cosine + ball.dy * sine;
              const otherVelocityX = otherBall.dx * cosine + otherBall.dy * sine;

              // Calculate new velocities after collision
              const velocityXAfterCollision = ((ball.radius - otherBall.radius) * velocityX + 2 * otherBall.radius * otherVelocityX) / (ball.radius + otherBall.radius);

              // Assign new velocities
              ball.dx = velocityXAfterCollision * cosine - ball.dy * sine;
              ball.dy = velocityXAfterCollision * sine + ball.dy * cosine;
              otherBall.dx = otherVelocityX * cosine - otherBall.dy * sine;
              otherBall.dy = otherVelocityX * sine + otherBall.dy * cosine;

              // Separate balls so they don't overlap
              const overlap = (ball.radius + otherBall.radius - distance) / 2;
              ball.x -= overlap * Math.cos(angle);
              ball.y -= overlap * Math.sin(angle);
              otherBall.x += overlap * Math.cos(angle);
              otherBall.y += overlap * Math.sin(angle);
            }
          }
        });


      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {};
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const balls: Ball[] = [];
    const colors = [
      '#ff0000',
      '#ff7f00',
      '#ffff00',
      '#00ff00',
      '#0000ff',
      '#4b0082',
      '#8a2be2',
      '#ffffff',
      '#a9a9a9',
      '#000000'
    ];
    const numBalls = 10;
    const minRadius = 10;
    const maxRadius = 30;

    for (let i = 0; i < numBalls; i++) {
      const radius = Math.floor(Math.random() * (maxRadius - minRadius + 1)) + minRadius;
      const x = Math.random() * (canvas.width - 2 * radius) + radius;
      const y = Math.random() * (canvas.height - 2 * radius) + radius;
      const dx = 0;
      const dy = 0;
      const color = colors[Math.floor(Math.random() * colors.length)];
      balls.push({ x, y, dx, dy, radius, color });
    }

    ballsRef.current = balls;
  }, []);

  return <canvas ref={canvasRef} width={700} height={500}></canvas>;
};

export default BilliardsTable;
