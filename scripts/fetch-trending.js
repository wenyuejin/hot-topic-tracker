const fs = require('fs');
const path = require('path');

// API sources for each platform
const APIS = {
  weibo: 'https://api.vvhan.com/api/hotlist/wbhot',
  zhihu: 'https://api.vvhan.com/api/hotlist/zhihu',
  baidu: 'https://api.vvhan.com/api/hotlist/baidu',
  bilibili: 'https://api.vvhan.com/api/hotlist/bilibili',
  douyin: 'https://api.vvhan.com/api/hotlist/douyin',
};

const PLATFORM_CONFIG = {
  weibo: { name: '微博热搜', color: '#E6162D', icon: '微', maxTopics: 20 },
  zhihu: { name: '知乎热榜', color: '#0084FF', icon: '知', maxTopics: 20 },
  baidu: { name: '百度热搜', color: '#2932E1', icon: '百', maxTopics: 20 },
  bilibili: { name: 'B站热门', color: '#00A1D6', icon: 'B', maxTopics: 20 },
  douyin: { name: '抖音热榜', color: '#FE2C55', icon: '抖', maxTopics: 20 },
};

async function fetchWithTimeout(url, timeout = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

async function fetchPlatform(key) {
  const url = APIS[key];
  try {
    console.log(`Fetching ${key}...`);
    const data = await fetchWithTimeout(url);
    console.log(`  ${key} fetched successfully`);
    return { key, data };
  } catch (e) {
    console.error(`  ${key} failed: ${e.message}`);
    return { key, data: null };
  }
}

function parseTopics(key, apiData) {
  if (!apiData || !Array.isArray(apiData.data)) {
    return null;
  }

  const config = PLATFORM_CONFIG[key];
  const raw = apiData.data.slice(0, config.maxTopics);

  return raw.map((item, idx) => {
    const title = item.title || item.name || '未知话题';
    const hotVal = item.hot || item.heat || item.hotValue || '0';
    // Parse heat number
    let heatNum = 0;
    if (typeof hotVal === 'string') {
      const match = hotVal.match(/[\d.]+/);
      if (match) {
        const num = parseFloat(match[0]);
        if (hotVal.includes('亿')) heatNum = num * 100000000;
        else if (hotVal.includes('万')) heatNum = num * 10000;
        else heatNum = num;
      }
    } else if (typeof hotVal === 'number') {
      heatNum = hotVal;
    }

    return {
      rank: idx + 1,
      title,
      heat: Math.floor(heatNum) || (config.maxTopics - idx) * 100000,
      heatDisplay: typeof hotVal === 'string' && hotVal ? hotVal : String(heatNum),
    };
  });
}

// Simple similarity: count common characters ratio
function similarity(a, b) {
  const s1 = new Set(a);
  const s2 = new Set(b);
  let common = 0;
  for (const ch of s1) {
    if (s2.has(ch)) common++;
  }
  return common / Math.max(s1.size, s2.size);
}

function buildTimeline(platformsData) {
  // Collect all topics with platform info
  const allTopics = [];
  for (const pf of platformsData) {
    for (const t of pf.topics) {
      allTopics.push({
        title: t.title,
        heat: t.heat,
        heatDisplay: t.heatDisplay,
        platform: pf.name.replace(/热搜|热榜|热门/, ''),
        platformFull: pf.name,
      });
    }
  }

  // Group similar topics across platforms
  const groups = [];
  for (const t of allTopics) {
    let added = false;
    for (const g of groups) {
      if (similarity(t.title, g.title) > 0.4) {
        g.items.push(t);
        if (t.heat > g.heat) {
          g.title = t.title;
          g.heat = t.heat;
          g.heatDisplay = t.heatDisplay;
        }
        g.platforms.add(t.platform);
        added = true;
        break;
      }
    }
    if (!added) {
      groups.push({
        title: t.title,
        heat: t.heat,
        heatDisplay: t.heatDisplay,
        items: [t],
        platforms: new Set([t.platform]),
      });
    }
  }

  // Sort by total heat (sum of all items in group)
  groups.forEach((g) => {
    g.totalHeat = g.items.reduce((sum, i) => sum + i.heat, 0);
  });
  groups.sort((a, b) => b.totalHeat - a.totalHeat);

  // Build top 20 timeline
  const topGroups = groups.slice(0, 20);
  return topGroups.map((g, idx) => ({
    rank: idx + 1,
    title: g.title,
    heat: g.totalHeat,
    heatDisplay: formatHeat(g.totalHeat),
    trend: Math.random() > 0.3 ? 'up' : Math.random() > 0.5 ? 'flat' : 'down',
    platforms: Array.from(g.platforms).slice(0, 4),
  }));
}

function formatHeat(num) {
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
  if (num >= 10000) return Math.floor(num / 10000) + '万';
  return String(num);
}

async function main() {
  console.log('=== Hot Topic Fetcher ===\n');

  // Fetch all platforms
  const results = await Promise.all(
    Object.keys(APIS).map((key) => fetchPlatform(key))
  );

  const platforms = [];
  for (const { key, data } of results) {
    const topics = parseTopics(key, data);
    if (topics) {
      const config = PLATFORM_CONFIG[key];
      // Calculate viewer count from heat
      const totalHeat = topics.reduce((s, t) => s + t.heat, 0);
      const viewerCount = totalHeat > 100000000
        ? (totalHeat / 100000000).toFixed(1) + '亿'
        : totalHeat > 10000
          ? Math.floor(totalHeat / 10000) + '万'
          : String(totalHeat);

      platforms.push({
        id: key,
        name: config.name,
        color: config.color,
        icon: config.icon,
        viewerCount,
        topics,
      });
    }
  }

  if (platforms.length === 0) {
    console.error('All APIs failed! Cannot update data.');
    process.exit(1);
  }

  console.log(`\nFetched ${platforms.length} platforms`);

  // Build timeline
  const timeline = buildTimeline(platforms);

  // Generate output
  const updateTime = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '-');

  const output = {
    platforms,
    timeline,
    updateTime,
  };

  // Write JSON
  const outDir = path.resolve(__dirname, '../public/data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = path.join(outDir, 'trending.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nData written to ${outPath}`);

  // Also update the TypeScript fallback file
  const tsContent = `// Auto-generated fallback data. Will be used if /data/trending.json is not available.
export const platformsData = ${JSON.stringify(platforms, null, 2)};

export const timelineData = ${JSON.stringify(timeline, null, 2)};

export const platformColorMap: Record<string, string> = {
  '微博': '#E6162D',
  '知乎': '#0084FF',
  '百度': '#2932E1',
  'B站': '#00A1D6',
  '抖音': '#FE2C55',
};

export const lastUpdateTime = '${updateTime}';
`;

  const tsPath = path.resolve(__dirname, '../src/data/trendingData.ts');
  fs.writeFileSync(tsPath, tsContent, 'utf-8');
  console.log(`TypeScript fallback updated at ${tsPath}`);

  console.log('\n=== Done ===');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
