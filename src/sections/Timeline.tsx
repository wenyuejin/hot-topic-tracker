import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TimelineProps {
  data: {
    rank: number;
    title: string;
    heat: number;
    heatDisplay: string;
    trend: string;
    platforms: string[];
  }[];
  updateTime: string;
}

const platformColorMap: Record<string, string> = {
  '微博': '#E6162D',
  '知乎': '#0084FF',
  '百度': '#2932E1',
  'B站': '#00A1D6',
  '抖音': '#FE2C55',
};

export default function Timeline({ data, updateTime }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const items = containerRef.current.querySelectorAll('.timeline-item');
    animate(items, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 400,
      ease: 'outCubic',
      delay: stagger(50),
    });

    const badges = containerRef.current.querySelectorAll('.rank-badge');
    animate(badges, {
      scale: [0.8, 1],
      duration: 400,
      ease: 'outElastic(1, .8)',
      delay: stagger(40, { start: 200 }),
    });
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-[#FF5A65]" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-[#4ADE80]" />;
      default:
        return <Minus className="w-4 h-4 text-[#6B6B6B]" />;
    }
  };

  return (
    <div ref={containerRef}>
      {/* Timeline header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-[#F9F9F9] mb-2">
          全网热度趋势
        </h2>
        <p className="text-sm text-[#A0A0A0]">
          按热度变化排序，展示今日最受关注的话题
        </p>
      </div>

      {/* Timeline list */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
        {data.map((item, index) => {
          const isTop3 = item.rank <= 3;

          return (
            <div
              key={item.rank}
              className="timeline-item opacity-0 flex items-center gap-4 px-4 md:px-6 py-4 cursor-pointer transition-all duration-300 hover:bg-[rgba(255,90,101,0.04)] group"
              style={{
                borderBottom: index < data.length - 1
                  ? '1px solid rgba(255,255,255,0.04)'
                  : 'none',
              }}
            >
              {/* Left gradient line */}
              <div
                className="w-0.5 self-stretch rounded-full gradient-accent shrink-0 transition-all duration-300 group-hover:w-1"
                style={{ minHeight: '40px' }}
              />

              {/* Rank badge */}
              <div
                className={`rank-badge rounded-full gradient-accent flex items-center justify-center text-white font-din font-bold shrink-0 ${
                  isTop3 ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-xs'
                }`}
                style={isTop3 ? { boxShadow: '0 0 12px rgba(255,90,101,0.3)' } : {}}
              >
                {item.rank}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-sm md:text-base font-medium text-[#F9F9F9] truncate mb-1">
                  {item.title}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {item.platforms.map((platform) => (
                    <span
                      key={platform}
                      className="inline-flex items-center gap-1 text-xs text-[#A0A0A0]"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: platformColorMap[platform] || '#6B6B6B' }}
                      />
                      {platform}
                    </span>
                  ))}
                </div>
              </div>

              {/* Heat value */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm text-[#A0A0A0] font-din hidden sm:inline">
                  {item.heatDisplay}
                </span>
                {getTrendIcon(item.trend)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom note */}
      <p className="text-center text-xs text-[#6B6B6B] mt-8">
        数据抓取于 {updateTime} 09:00 · 仅供参考
      </p>
    </div>
  );
}
