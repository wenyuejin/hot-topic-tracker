import { useState, useEffect, useRef, useCallback } from 'react';
import { createTimeline } from 'animejs';
import Header from '@/sections/Header';
import Dashboard from '@/sections/Dashboard';
import Timeline from '@/sections/Timeline';
import Footer from '@/sections/Footer';

export interface TrendingData {
  platforms: {
    id: string;
    name: string;
    color: string;
    icon: string;
    viewerCount: string;
    topics: { rank: number; title: string; heat: number; heatDisplay: string }[];
  }[];
  timeline: {
    rank: number;
    title: string;
    heat: number;
    heatDisplay: string;
    trend: string;
    platforms: string[];
  }[];
  updateTime: string;
}

export default function Home() {
  const [mode, setMode] = useState<'dashboard' | 'timeline'>('dashboard');
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/data/trending.json?t=' + Date.now(), {
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          throw new Error('JSON not found');
        }
      } catch {
        const { platformsData, timelineData, lastUpdateTime } = await import('@/data/trendingData');
        setData({
          platforms: platformsData,
          timeline: timelineData,
          updateTime: lastUpdateTime || new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).replace(/\//g, '-'),
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleModeChange = useCallback(
    (newMode: 'dashboard' | 'timeline') => {
      if (isAnimating.current || newMode === mode) return;
      isAnimating.current = true;

      const currentRef = mode === 'dashboard' ? dashboardRef : timelineRef;
      const nextRef = newMode === 'dashboard' ? dashboardRef : timelineRef;

      const currentEl = currentRef.current;
      const nextEl = nextRef.current;

      if (!currentEl || !nextEl) {
        isAnimating.current = false;
        setMode(newMode);
        return;
      }

      const tl = createTimeline({
        onComplete: () => {
          isAnimating.current = false;
        },
      });

      tl.add(currentEl, {
        opacity: [1, 0],
        translateY: [0, -10],
        duration: 200,
        ease: 'inCubic',
        onComplete: () => {
          setMode(newMode);
        },
      })
      .add(nextEl, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 300,
        ease: 'outCubic',
      }, '+=50');
    },
    [mode]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0C0C0C' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#FF5A65] border-t-transparent animate-spin" />
          <p className="text-sm text-[#6B6B6B]">正在加载热点数据...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0C0C0C' }}>
      <div className="max-w-[1200px] mx-auto px-5 md:px-12 lg:px-12 py-8 md:py-12">
        <Header mode={mode} onModeChange={handleModeChange} updateTime={data.updateTime} />

        <div className="relative">
          <div
            ref={dashboardRef}
            style={{
              opacity: mode === 'dashboard' ? 1 : 0,
              display: mode === 'dashboard' ? 'block' : 'none',
              pointerEvents: mode === 'dashboard' ? 'auto' : 'none',
            }}
          >
            <Dashboard data={data.platforms} updateTime={data.updateTime} />
          </div>

          <div
            ref={timelineRef}
            style={{
              opacity: mode === 'timeline' ? 1 : 0,
              display: mode === 'timeline' ? 'block' : 'none',
              pointerEvents: mode === 'timeline' ? 'auto' : 'none',
            }}
          >
            <Timeline data={data.timeline} updateTime={data.updateTime} />
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
