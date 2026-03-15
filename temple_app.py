import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import numpy as np

# --- 1. 模擬數據生成 (維持 21 欄位邏輯) ---
@st.cache_data
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
    return pd.DataFrame(data)

df = generate_mock_data()

# --- 2. 側邊欄導航 (Sidebar Navigation) ---
st.set_page_config(page_title="宮廟轉型戰情室", layout="wide")

with st.sidebar:
    st.title("⛩️ 經營選單")
    nav_option = st.radio(
        "請選擇分析模組：",
        ["📊 營運總覽", "🎯 活動效益分析", "🚉 交通關聯分析", "📑 原始數據查詢"]
    )
    st.divider()
    st.info("💡 提示：本數據每月更新，確保轉型決策時效性。")

# --- 3. 頁面內容邏輯 ---

# 共通過濾器 (篩選月份)
selected_month = st.sidebar.multiselect("篩選月份", options=df["月份"].unique(), default=df["月份"].unique())
f_df = df[df["月份"].isin(selected_month)]

if nav_option == "📊 營運總覽":
    st.header("宮廟營運總覽")
    c1, c2, c3 = st.columns(3)
    c1.metric("總參拜人次", f"{f_df['參拜人數'].sum():,} 人")
    c2.metric("日均參拜人數", f"{int(f_df['參拜人數'].mean())} 人")
    c3.metric("資料覆蓋率 (數位資訊)", "92%", "+3%")
    
    st.subheader("每日人流波動趨勢 (時空維度)")
    fig = px.area(f_df, x="資料時間日期", y="參拜人數", title="參拜人潮時序圖", color_discrete_sequence=['#FF4B4B'])
    st.plotly_chart(fig, use_container_width=True)

elif nav_option == "🎯 活動效益分析":
    st.header("節慶活動成效評估")
    ecr = (f_df['活動參與人數'].sum() / f_df['參拜人數'].sum()) * 100
    st.subheader(f"當前平均轉化率 (ECR): {ecr:.1f}%")
    
    col1, col2 = st.columns(2)
    with col1:
        # 活動與參拜對比
        fig_bar = px.bar(f_df, x="節慶名稱", y=["參拜人數", "活動參與人數"], 
                        barmode="group", title="節慶日與活動人數對比", color_discrete_map={"參拜人數":"#E5E5E5", "活動參與人數":"#FF4B4B"})
        st.plotly_chart(fig_bar, use_container_width=True)
    with col2:
        # 漏斗分析
        funnel_df = pd.DataFrame({
            "階段": ["總參拜人次", "活動參與人次", "留下聯絡資料"],
            "人數": [f_df["參拜人數"].sum(), f_df["活動參與人數"].sum(), int(f_df["活動參與人數"].sum()*0.4)]
        })
        fig_fun = px.funnel(funnel_df, x='人數', y='階段', title="信眾關係管理 (CRM) 漏斗")
        st.plotly_chart(fig_fun, use_container_width=True)

elif nav_option == "🚉 交通關聯分析":
    st.header("車站人流與信仰經濟分析")
    spf = (f_df["參拜人數"] / f_df["出站人次"]).mean()
    st.metric("平均車站導流係數 (SPF)", f"{spf:.2f}", help="每 1 位出站旅客帶動的參拜人數")

    fig_dual = go.Figure()
    fig_dual.add_trace(go.Scatter(x=f_df["資料時間日期"], y=f_df["出站人次"], name="車站出站 (13)", line=dict(color='lightgray')))
    fig_dual.add_trace(go.Bar(x=f_df["資料時間日期"], y=f_df["參拜人數"], name="宮廟參拜 (9)", marker_color='red'))
    fig_dual.update_layout(title="外部人流(線)與內部人流(柱)相關性", xaxis_title="日期", yaxis_title="人數")
    st.plotly_chart(fig_dual, use_container_width=True)

elif nav_option == "📑 原始數據查詢":
    st.header("原始數據清單 (21 欄位)")
    # 顯示部分資料並允許下載
    st.dataframe(f_df)
    csv = f_df.to_csv(index=False).encode('utf-8-sig')
    st.download_button("下載報表 (CSV)", data=csv, file_name="temple_data.csv", mime="text/csv")