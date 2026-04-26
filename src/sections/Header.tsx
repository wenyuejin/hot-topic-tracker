import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { useClock } from '@/hooks/useClock';

interface HeaderProps {
  mode: 'dashboard' | 'timeline';
  onModeChange: (mode: 'dashboard' | 'timeline') => void;
  updateTime: string;
}

export default function Header({ mode, onModeChange, updateTime }: HeaderProps) {
  const { timeStr } = useClock();
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headerRef.current) return;

    const els = headerRef.current.querySelectorAll('.header-animate');
    animate(els, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 500,
      ease: 'outCubic',
      delay: stagger(100),
    });
  }, []);

  return (
    <div ref={headerRef} className="mb-10">
      {/* Title row */}
      <div className="flex items-center gap-3 mb-2 header-animate opacity-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full gradient-accent" />
          <span className="text-xs font-medium tracking-wider text-[#A0A0A0] uppercase">
            LIVE
          </span>
        </div>
        <span className="text-sm text-[#6B6B6B] font-din tracking-wide">
          {timeStr}
        </span>
      </div>

      <h1
        className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight text-[#F9F9F9] mb-3 header-animate opacity-0"
        style={{ letterSpacing: '-0.02em', lineHeight: 1.1 }}
      >
        热点追踪器
      </h1>

      <p className="text-sm md:text-base text-[#A0A0A0] mb-2 header-animate opacity-0">
        每日全网热点话题聚合 · 早晚两次更新
      </p>

      <p className="text-xs md:text-sm text-[#6B6B6B] mb-6 header-animate opacity-0">
        {updateTime} 09:00 更新 · 下次更新 18:00
      </p>

      {/* Mode switch */}
      <div className="flex items-center gap-2 header-animate opacity-0">
        <button
          onClick={() => onModeChange('dashboard')}
          className="relative px-5 py-2 rounded-full text-sm font-medium transition-transform duration-150 active:scale-95"
          style={{
            background: mode === 'dashboard'
              ? 'linear-gradient(135deg, #FF5A65 0%, #7B6ED6 100%)'
              : '#1E1E1E',
            color: mode === 'dashboard' ? '#FFFFFF' : '#A0A0A0',
          }}
        >
          仪表盘
        </button>
        <button
          onClick={() => onModeChange('timeline')}
          className="relative px-5 py-2 rounded-full text-sm font-medium transition-transform duration-150 active:scale-95"
          style={{
            background: mode === 'timeline'
              ? 'linear-gradient(135deg, #FF5A65 0%, #7B6ED6 100%)'
              : '#1E1E1E',
            color: mode === 'timeline' ? '#FFFFFF' : '#A0A0A0',
          }}
        >
          时间线
        </button>
      </div>
    </div>
  );
}
