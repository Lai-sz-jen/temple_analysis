import json
import pandas as pd
import numpy as np
import io

def generate_mock_data():
    dates = pd.date_range(start="2026-01-01", end="2026-03-01", freq='D')
    data = []
    festivals = {"2026-01-01": "元旦祈福", "2026-02-17": "元宵燈會", "2026-02-02": "車公誕"}
    
    for dt in dates:
        date_str = dt.strftime("%Y-%m-%d")
        is_fest = date_str in festivals
        fest_name = festivals[date_str] if is_fest else "一般日"
        
        # 核心數據：參拜與活動 (9, 10)
        base = np.random.randint(100, 300) if not is_fest else np.random.randint(1200, 2500)
        act = int(base * (np.random.uniform(0.15, 0.25) if not is_fest else 0.75))
        
        # 車站數據 (13, 14)
        exits = int(base * np.random.uniform(1.8, 3.0))
        entries = int(exits * np.random.uniform(0.7, 1.2))
        
        data.append({
            "年份": dt.year, "月份": dt.month, "日期": dt.day,
            "節慶名稱": fest_name, "活動類型": "祭祀" if not is_fest else "宗教慶典",
            "宮廟名稱": "數位宮", "縣市": "高雄市", "鄉鎮市區": "三民區",
            "參拜人數": base, "活動參與人數": act,
            "地區": "南部", "車站": "三民車站", "出站人次": exits,
            "入站人次": entries, "資料時間日期": date_str,
            "資料週期": "每日", "郵遞區號": "807", "機關代碼": "STA01",
            "電子郵件": f"devotee{np.random.randint(100)}@example.com",
            "行動電話": f"0912-{np.random.randint(100, 999)}-{np.random.randint(100, 999)}",
            "市話": "07-3123456"
        })
    return data

if __name__ == '__main__':
    data = generate_mock_data()
    with io.open('data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Successfully generated data.json")
