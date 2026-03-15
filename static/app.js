let globalData = [];
let filteredData = [];
let availableMonths = [];
let selectedMonths = new Set();

const CHARTS_LAYOUT_BASE = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#fafafa', family: 'Inter' },
    margin: { t: 30, l: 50, r: 20, b: 50 },
    xaxis: { gridcolor: 'rgba(255,255,255,0.1)', titlefont: { size: 12 } },
    yaxis: { gridcolor: 'rgba(255,255,255,0.1)', titlefont: { size: 12 } },
    hovermode: 'x unified'
};

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch data
    try {
        // Updated for static GitHub Pages hosting
        const response = await fetch('./data.json');
        globalData = await response.json();
    } catch (e) {
        console.error("Failed to load data:", e);
        return;
    }

    if(globalData.length > 0) {
        // 2. Initialize filter
        initMonthFilter();
        
        // 3. Setup Navigation
        setupNavigation();

        // 4. Initial Render
        updateDashboard();

        // 5. Handle window resize manually for robustness
        window.addEventListener('resize', () => {
            const activeSection = document.querySelector('.view-section.active');
            if (activeSection) {
                const charts = activeSection.querySelectorAll('.plotly-chart');
                charts.forEach(chart => {
                    if (chart.data) Plotly.Plots.resize(chart);
                });
            }
        });
    }
});

function initMonthFilter() {
    availableMonths = [...new Set(globalData.map(d => d['月份']))].sort((a, b) => a - b);
    availableMonths.forEach(m => selectedMonths.add(m));

    const filterContainer = document.getElementById('month-filters');
    availableMonths.forEach(m => {
        const div = document.createElement('div');
        div.className = 'checkbox-label';
        
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = m;
        cb.checked = true;
        cb.addEventListener('change', (e) => {
            if (e.target.checked) selectedMonths.add(m);
            else selectedMonths.delete(m);
            updateDashboard();
        });

        const label = document.createElement('span');
        label.textContent = `${m}月`;

        div.appendChild(cb);
        div.appendChild(label);
        filterContainer.appendChild(div);
    });
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active nav class
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Show target section
            const targetId = item.getAttribute('data-target');
            document.querySelectorAll('.view-section').forEach(sec => {
                sec.classList.remove('active');
            });
            document.getElementById(targetId).classList.add('active');

            // Explicitly resize Plotly charts now that the container is visible
            setTimeout(() => {
                const activeSection = document.getElementById(targetId);
                const charts = activeSection.querySelectorAll('.plotly-chart');
                charts.forEach(chart => {
                    if (chart.data) Plotly.Plots.resize(chart);
                });
            }, 50);
        });
    });

    // CSV Download
    document.getElementById('download-csv').addEventListener('click', () => {
        downloadCSV();
    });
}

function updateDashboard() {
    // Filter data
    filteredData = globalData.filter(d => selectedMonths.has(d['月份']));

    renderOverview();
    renderEventAnalysis();
    renderTrafficAnalysis();
    renderRawData();
    
    // Resize visible charts in case layout shifted
    setTimeout(() => {
        const activeSection = document.querySelector('.view-section.active');
        if (activeSection) {
            const charts = activeSection.querySelectorAll('.plotly-chart');
            charts.forEach(chart => {
                if (chart.data) Plotly.Plots.resize(chart);
            });
        }
    }, 50);
}

function renderOverview() {
    if(!filteredData.length) return;

    const totalVisits = filteredData.reduce((sum, d) => sum + d['參拜人數'], 0);
    const avgVisits = Math.round(totalVisits / filteredData.length);

    document.getElementById('total-visits').textContent = totalVisits.toLocaleString() + ' 人';
    document.getElementById('avg-visits').textContent = avgVisits.toLocaleString() + ' 人';

    // Chart
    const trace = {
        x: filteredData.map(d => d['資料時間日期']),
        y: filteredData.map(d => d['參拜人數']),
        type: 'scatter',
        mode: 'lines',
        fill: 'tozeroy',
        line: { color: '#FF4B4B' },
        name: '參拜人數'
    };

    const layout = {
        ...CHARTS_LAYOUT_BASE,
        xaxis: { title: '日期', ...CHARTS_LAYOUT_BASE.xaxis },
        yaxis: { title: '參拜人數', ...CHARTS_LAYOUT_BASE.yaxis }
    };

    Plotly.newPlot('overview-chart', [trace], layout, {responsive: true});
}

function renderEventAnalysis() {
    if(!filteredData.length) return;

    const totalVisits = filteredData.reduce((sum, d) => sum + d['參拜人數'], 0);
    const totalActivity = filteredData.reduce((sum, d) => sum + d['活動參與人數'], 0);
    const ecr = totalVisits > 0 ? (totalActivity / totalVisits) * 100 : 0;

    document.getElementById('current-ecr').textContent = ecr.toFixed(1) + '%';

    // Bar Chart aggregated by Event Name
    const eventStats = {};
    filteredData.forEach(d => {
        const name = d['節慶名稱'];
        if(!eventStats[name]) eventStats[name] = {visits: 0, activity: 0};
        eventStats[name].visits += d['參拜人數'];
        eventStats[name].activity += d['活動參與人數'];
    });

    const x = Object.keys(eventStats);
    const traceVisits = {
        x: x, y: x.map(k => eventStats[k].visits),
        type: 'bar', name: '參拜人數', marker: {color: '#E5E5E5'}
    };
    const traceActivity = {
        x: x, y: x.map(k => eventStats[k].activity),
        type: 'bar', name: '活動參與人數', marker: {color: '#FF4B4B'}
    };

    const layoutBar = {
        ...CHARTS_LAYOUT_BASE, barmode: 'group'
    };
    Plotly.newPlot('event-bar-chart', [traceVisits, traceActivity], layoutBar, {responsive: true});

    // Funnel Chart
    const leads = Math.floor(totalActivity * 0.4);
    const traceFunnel = {
        type: 'funnel',
        y: ['總參拜人次', '活動參與人次', '留下聯絡資料'],
        x: [totalVisits, totalActivity, leads],
        textinfo: 'value+percent initial',
        marker: { color: ['#FF4B4B', '#ff7575', '#ff9e9e'] }
    };
    
    const layoutFunnel = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fafafa', family: 'Inter' },
        margin: { t: 30, l: 120, r: 20, b: 30 }
    };
    
    Plotly.newPlot('event-funnel-chart', [traceFunnel], layoutFunnel, {responsive: true});
}

function renderTrafficAnalysis() {
    if(!filteredData.length) return;

    let spfSum = 0;
    filteredData.forEach(d => {
        spfSum += (d['參拜人數'] / d['出站人次']);
    });
    const avgSpf = spfSum / filteredData.length;

    document.getElementById('avg-spf').textContent = avgSpf.toFixed(2);

    // Dual Chart
    const traceExits = {
        x: filteredData.map(d => d['資料時間日期']),
        y: filteredData.map(d => d['出站人次']),
        type: 'scatter', mode: 'lines', name: '車站出站 (13)',
        line: { color: '#a0a0a0' }
    };
    const traceVisits = {
        x: filteredData.map(d => d['資料時間日期']),
        y: filteredData.map(d => d['參拜人數']),
        type: 'bar', name: '宮廟參拜 (9)',
        marker: { color: '#FF4B4B' }
    };

    const layout = {
        ...CHARTS_LAYOUT_BASE,
        yaxis: { title: '人數' },
        barmode: 'overlay'
    };

    Plotly.newPlot('traffic-dual-chart', [traceVisits, traceExits], layout, {responsive: true});
}

function renderRawData() {
    if(!filteredData.length) {
        document.getElementById('table-header').innerHTML = '';
        document.getElementById('table-body').innerHTML = '';
        return;
    }

    const keys = Object.keys(filteredData[0]);
    
    // Header
    const ths = keys.map(k => `<th>${k}</th>`).join('');
    document.getElementById('table-header').innerHTML = ths;

    // Body
    const trs = filteredData.map(row => {
        return `<tr>${keys.map(k => `<td>${row[k]}</td>`).join('')}</tr>`;
    }).join('');
    document.getElementById('table-body').innerHTML = trs;
}

function downloadCSV() {
    if(!filteredData.length) return;
    const keys = Object.keys(filteredData[0]);
    
    // Add BOM for Excel UTF-8 display
    let csvContent = '\uFEFF' + keys.join(',') + '\n';
    
    filteredData.forEach(row => {
        const values = keys.map(k => `"${row[k]}"`);
        csvContent += values.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "temple_data.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
