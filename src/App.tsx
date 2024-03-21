import React, {useEffect, useRef, useState} from 'react';
import './App.css';

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  color: string;
}

const BilliardsTable: React.FC = () => {
  // Референсы для элементов и состояния
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const selectedBallRef = useRef<Ball | null>(null);
  const isMouseDownRef = useRef<boolean>(false);
  const pointerXRef = useRef<number>(0);
  const pointerYRef = useRef<number>(0);
  const [selectedBallIndex, setSelectedBallIndex] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
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

  // Константы для настройки поведения шаров
  const friction = 0.995; // Коэффициент типа трения
  const pushForceMultiplier = 7; // Увеличенный множитель силы толчка - сила удара

  // Инициализация холста и обработчиков событий
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleMouseMove = (event: MouseEvent) => {
      // Обновление координат указателя мыши
      pointerXRef.current = event.clientX - canvas.getBoundingClientRect().left;
      pointerYRef.current = event.clientY - canvas.getBoundingClientRect().top;

      if (isMouseDownRef.current && selectedBallRef.current) {
        // Расчет направления толчка выбранного шара
        const ball = selectedBallRef.current;
        const angle = Math.atan2(pointerYRef.current - ball.y, pointerXRef.current - ball.x);
        ball.dx = Math.cos(angle) * pushForceMultiplier;
        ball.dy = Math.sin(angle) * pushForceMultiplier;
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const balls = ballsRef.current;
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Проверка нажатия на шар и начало перемещения
      balls.forEach(ball => {
        if (Math.sqrt((mouseX - ball.x) ** 2 + (mouseY - ball.y) ** 2) < ball.radius) {
          selectedBallRef.current = ball;
          isMouseDownRef.current = true;
          document.addEventListener('mousemove', handleMouseMove);
        }
      });
    };

    const handleMouseUp = () => {
      // Очистка выбранного шара и завершение перемещения
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

  // Анимация и обновление шаров
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
        // Рисование шара
        ctx.beginPath();
        ctx.fillStyle = ball.color;
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        // Применение трения
        ball.dx *= friction;
        ball.dy *= friction;

        // Обновление координат шара
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Обработка столкновений со стенами
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvasWidth) {
          ball.dx *= -0.9; // Уменьшение скорости при ударе о стенку
        }
        if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvasHeight) {
          ball.dy *= -0.9; // Уменьшение скорости при ударе о стенку
        }

        // Обработка столкновений между шарами
        balls.forEach(ball => {
          balls.forEach(otherBall => {
            if (ball !== otherBall) {
              const distX = otherBall.x - ball.x;
              const distY = otherBall.y - ball.y;
              const distance = Math.sqrt(distX * distX + distY * distY);

              // Проверка на столкновение
              if (distance < ball.radius + otherBall.radius) {
                // Расчет угла и синуса/косинуса угла между шарами
                const angle = Math.atan2(distY, distX);
                const sine = Math.sin(angle);
                const cosine = Math.cos(angle);

                // Поворот скоростей
                const velocityX = ball.dx * cosine + ball.dy * sine;
                const velocityY = ball.dy * cosine - ball.dx * sine;
                const otherVelocityX = otherBall.dx * cosine + otherBall.dy * sine;
                const otherVelocityY = otherBall.dy * cosine - otherBall.dx * sine;

                // Расчет новых скоростей после столкновения (формула для упругого столкновения)
                const velocityXAfterCollision = ((ball.radius - otherBall.radius) * velocityX + 2 * otherBall.radius * otherVelocityX) / (ball.radius + otherBall.radius);
                const otherVelocityXAfterCollision = ((otherBall.radius - ball.radius) * otherVelocityX + 2 * ball.radius * velocityX) / (ball.radius + otherBall.radius);

                // Применение новых скоростей
                ball.dx = velocityXAfterCollision * cosine - velocityY * sine;
                ball.dy = velocityY * cosine + velocityXAfterCollision * sine;
                otherBall.dx = otherVelocityXAfterCollision * cosine - otherVelocityY * sine;
                otherBall.dy = otherVelocityY * cosine + otherVelocityXAfterCollision * sine;

                // Отделение шаров, чтобы они не перекрывались
                const overlap = (ball.radius + otherBall.radius - distance) / 2;
                ball.x -= overlap * Math.cos(angle);
                ball.y -= overlap * Math.sin(angle);
                otherBall.x += overlap * Math.cos(angle);
                otherBall.y += overlap * Math.sin(angle);
              }
            }
          });
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {};
  }, []);

  // Инициализация массива шаров
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const balls: Ball[] = [];
    const numBalls = 10;
    const minRadius = 10;
    const maxRadius = 30;

    // Генерация случайных шаров с различными параметрами
    for (let i = 0; i < numBalls; i++) {
      const radius = Math.floor(Math.random() * (maxRadius - minRadius + 1)) + minRadius;
      const x = Math.random() * (canvas.width - 2 * radius) + radius;
      const y = Math.random() * (canvas.height - 2 * radius) + radius;
      const dx = 0;
      const dy = 0;
      const color = colors[Math.floor(Math.random() * colors.length)];
      balls.push({ x, y, dx, dy, radius, color });
    }

    // Сохранение сгенерированных шаров в референсе
    ballsRef.current = balls;
  }, []);

  const onClickBall = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const clickedBallIndex = ballsRef.current.findIndex(
        (ball) =>
          Math.sqrt(
            (mouseX - ball.x) ** 2 + (mouseY - ball.y) ** 2
          ) < ball.radius
      );
      if (clickedBallIndex !== -1) {
        handleBallClick(clickedBallIndex, e);
      }
    }
  };

  const handleBallClick = (index: number, event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    setSelectedBallIndex(index);
    setMenuPosition({ x: event.clientX, y: event.clientY });
    setIsMenuOpen(true);
  };

  const handleColorSelect = (color: string, selectedBallIndex: number) => {
    if (selectedBallIndex !== null) {
      ballsRef.current[selectedBallIndex].color = color
    }
    setIsMenuOpen(false);
  };

  // Рендеринг компонента с холстом
  return (
    <div>
      <canvas
        ref={canvasRef}
        width={700}
        height={500}
        onClick={(e) => onClickBall(e)}
        onContextMenu={(e) => e.preventDefault()}
      />
      {isMenuOpen && selectedBallIndex !== null && (
        <div
          className="color-menu"
          style={{ top: menuPosition.y, left: menuPosition.x }}
        >
          {colors.map((color) => (
            <div
              key={color}
              className="color-option"
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color, selectedBallIndex)}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BilliardsTable;