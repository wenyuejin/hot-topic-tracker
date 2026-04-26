import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

interface DashboardProps {
  data: {
    id: string;
    name: string;
    color: string;
    icon: string;
    viewerCount: string;
    topics: { rank: number; title: string; heat: number; heatDisplay: string }[];
  }[];
  updateTime: string;
}

export default function Dashboard({ data, updateTime }: DashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll('.platform-card');
    animate(cards, {
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 500,
      ease: 'outCubic',
      delay: stagger(80),
    });

    const rankEls = containerRef.current.querySelectorAll('.top-rank');
    animate(rankEls, {
      scale: [0.8, 1],
      duration: 400,
      ease: 'outElastic(1, .8)',
      delay: stagger(50, { start: 300 }),
    });
  }, []);

  const getMaxHeat = (topics: { heat: number }[]) => {
    return Math.max(...topics.map((t) => t.heat));
  };

  return (
    <div ref={containerRef}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {data.map((platform) => {
          const maxHeat = getMaxHeat(platform.topics);
          return (
            <div
              key={platform.id}
              className="platform-card rounded-xl p-5 md:p-6 opacity-0 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                backgroundColor: '#161616',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,90,101,0.15)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
              }}
            >
              {/* Card header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#F9F9F9]">
                      {platform.name}
                    </h3>
                    <span className="text-xs text-[#6B6B6B]">
                      {platform.viewerCount}人在看
                    </span>
                  </div>
                </div>
                <span className="text-xs text-[#6B6B6B] cursor-pointer hover:text-[#FF5A65] transition-colors duration-200">
                  查看全部 →
                </span>
              </div>

              {/* Topics list */}
              <div className="space-y-3">
                {platform.topics.map((topic) => {
                  const isTop3 = topic.rank <= 3;
                  const heatBarWidth = (topic.heat / maxHeat) * 120;

                  return (
                    <div
                      key={topic.rank}
                      className="flex items-center gap-3 group cursor-pointer"
                    >
                      <span
                        className={`top-rank font-din font-bold text-sm w-5 text-center shrink-0 ${
                          isTop3 ? 'gradient-text' : 'text-[#6B6B6B]'
                        }`}
                      >
                        {topic.rank}
                      </span>

                      <span className="flex-1 text-sm text-[#F9F9F9] truncate group-hover:text-[#FF5A65] transition-colors duration-200">
                        {topic.title}
                      </span>

                      {isTop3 && (
                        <div
                          className="h-1.5 rounded-full gradient-accent shrink-0 hidden sm:block"
                          style={{ width: `${Math.max(heatBarWidth, 20)}px` }}
                        />
                      )}

                      <span className="text-xs text-[#6B6B6B] shrink-0 font-din">
                        {topic.heatDisplay}
                      </span>
                    </div>
                  );
                })}
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
