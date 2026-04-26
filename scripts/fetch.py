#!/usr/bin/env python3
import json
import os
import urllib.request
from datetime import datetime

APIS = {
    "weibo": "https://api.vvhan.com/api/hotlist/wbhot",
    "zhihu": "https://api.vvhan.com/api/hotlist/zhihu",
    "baidu": "https://api.vvhan.com/api/hotlist/baidu",
    "bilibili": "https://api.vvhan.com/api/hotlist/bilibili",
    "douyin": "https://api.vvhan.com/api/hotlist/douyin",
}

META = {
    "weibo": {"name": "微博热搜", "color": "#E6162D", "icon": "微"},
    "zhihu": {"name": "知乎热榜", "color": "#0084FF", "icon": "知"},
    "baidu": {"name": "百度热搜", "color": "#2932E1", "icon": "百"},
    "bilibili": {"name": "B站热门", "color": "#00A1D6", "icon": "B"},
    "douyin": {"name": "抖音热榜", "color": "#FE2C55", "icon": "抖"},
}

def fetch(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  Failed: {e}")
        return None

def parse_heat(val):
    if isinstance(val, (int, float)): return int(val)
    if not val or not isinstance(val, str): return 0
    import re
    m = re.search(r"[\d.]+", val)
    if not m: return 0
    n = float(m.group())
    if "亿" in val: return int(n * 100000000)
    if "万" in val: return int(n * 10000)
    return int(n)

def main():
    print("=== Fetching ===")
    platforms = []
    for key, url in APIS.items():
        print(f"Fetching {key}...")
        data = fetch(url)
        if not data or not isinstance(data.get("data"), list):
            print(f"  ❌ No data")
            continue
        topics = []
        for i, item in enumerate(data["data"][:20]):
            title = item.get("title") or item.get("name") or "未知"
            hot = item.get("hot") or item.get("heat") or "0"
            heat = parse_heat(hot)
            topics.append({
                "rank": i + 1, "title": title,
                "heat": heat if heat > 0 else (20 - i) * 100000,
                "heatDisplay": hot if isinstance(hot, str) and hot else str(heat),
            })
        meta = META[key]
        total = sum(t["heat"] for t in topics)
        vc = f"{total/100000000:.1f}亿" if total > 100000000 else f"{total//10000}万" if total > 10000 else str(total)
        platforms.append({
            "id": key, "name": meta["name"], "color": meta["color"], "icon": meta["icon"],
            "viewerCount": vc, "topics": topics,
        })
        print(f"  ✅ {len(topics)} topics")

    if not platforms:
        print("All failed! Keeping existing data.")
        return

    all_t = []
    for pf in platforms:
        pn = pf["name"].replace("热搜", "").replace("热榜", "").replace("热门", "")
        for t in pf["topics"]:
            all_t.append({"title": t["title"], "heat": t["heat"], "heatDisplay": t["heatDisplay"], "platform": pn})

    groups = []
    for t in all_t:
        added = False
        for g in groups:
            common = len(set(t["title"]) & set(g["title"]))
            if common / max(len(t["title"]), len(g["title"])) > 0.4:
                g["items"].append(t)
                if t["heat"] > g["heat"]:
                    g["title"], g["heat"], g["heatDisplay"] = t["title"], t["heat"], t["heatDisplay"]
                g["platforms"].add(t["platform"]); added = True; break
        if not added:
            groups.append({"title": t["title"], "heat": t["heat"], "heatDisplay": t["heatDisplay"], "items": [t], "platforms": {t["platform"]}})

    for g in groups: g["totalHeat"] = sum(i["heat"] for i in g["items"])
    groups.sort(key=lambda x: x["totalHeat"], reverse=True)

    import random
    timeline = []
    for i, g in enumerate(groups[:20]):
        r = random.random()
        t = "up" if r > 0.3 else ("flat" if r > 0.5 else "down")
        timeline.append({
            "rank": i + 1, "title": g["title"], "heat": g["totalHeat"],
            "heatDisplay": f"{g['totalHeat']//10000}万" if g["totalHeat"] > 10000 else str(g["totalHeat"]),
            "trend": t, "platforms": list(g["platforms"])[:4],
        })

    output = {
        "platforms": platforms, "timeline": timeline,
        "updateTime": datetime.now().strftime("%Y-%m-%d"),
    }

    os.makedirs("data", exist_ok=True)
    with open("data/trending.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(platforms)} platforms, {len(timeline)} timeline items")

if __name__ == "__main__":
    main()
