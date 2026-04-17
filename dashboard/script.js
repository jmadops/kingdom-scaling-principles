// ============================================
// KSP OPS DASHBOARD — Prototype Script
// Mock data only. In production, /api/metrics returns this shape.
// ============================================

const COLORS = {
    slate: '#64748b',
    slateSoft: 'rgba(100, 116, 139, 0.15)',
    gold: '#c2a859',
    goldSoft: 'rgba(194, 168, 89, 0.15)',
    text: 'rgba(255, 255, 255, 0.85)',
    textDim: 'rgba(255, 255, 255, 0.35)',
    grid: 'rgba(255, 255, 255, 0.06)',
};

// ============================================
// MOCK DATA (swap for /api/metrics fetch in prod)
// ============================================
const mockData = {
    visitorsOverTime: {
        labels: ['Apr 11', 'Apr 12', 'Apr 13', 'Apr 14', 'Apr 15', 'Apr 16', 'Apr 17'],
        variantA: [42, 68, 89, 72, 96, 118, 140],
        variantB: [41, 65, 88, 74, 98, 120, 136],
    },
    funnel: {
        labels: ['Landed', 'Scrolled to checkout', 'Started form', 'Purchased'],
        variantA: [625, 198, 152, 17],
        variantB: [622, 268, 201, 24],
    },
    revenue: {
        labels: ['Apr 11', 'Apr 12', 'Apr 13', 'Apr 14', 'Apr 15', 'Apr 16', 'Apr 17'],
        variantA: [29, 87, 145, 203, 290, 406, 493],
        variantB: [58, 116, 232, 348, 464, 580, 696],
    },
    activity: [
        { when: '2m', type: 'purchase', variant: 'B', text: 'Purchase · <strong>Alex M.</strong>', amount: 29 },
        { when: '4m', type: 'form',     variant: 'A', text: 'Form started · <strong>(anonymous)</strong>' },
        { when: '7m', type: 'purchase', variant: 'A', text: 'Purchase · <strong>Sarah K.</strong>', amount: 29 },
        { when: '9m', type: 'scroll',   variant: 'B', text: 'Scrolled to checkout · <strong>meta-lookalike</strong>' },
        { when: '11m', type: 'view',    variant: 'B', text: 'Page view · <strong>UTM: meta-retargeting</strong>' },
        { when: '13m', type: 'purchase', variant: 'B', text: 'Purchase · <strong>Michael R.</strong>', amount: 29 },
        { when: '16m', type: 'form',    variant: 'A', text: 'Form started · <strong>daniel@... </strong>' },
        { when: '18m', type: 'view',    variant: 'A', text: 'Page view · <strong>UTM: google-search</strong>' },
        { when: '22m', type: 'purchase', variant: 'B', text: 'Purchase · <strong>James T.</strong>', amount: 29 },
        { when: '24m', type: 'scroll',  variant: 'A', text: 'Scrolled to checkout · <strong>direct</strong>' },
        { when: '28m', type: 'view',    variant: 'B', text: 'Page view · <strong>UTM: meta-interests</strong>' },
        { when: '31m', type: 'form',    variant: 'B', text: 'Form started · <strong>j.patrick@...</strong>' },
        { when: '34m', type: 'purchase', variant: 'A', text: 'Purchase · <strong>Caleb W.</strong>', amount: 29 },
        { when: '38m', type: 'view',    variant: 'A', text: 'Page view · <strong>UTM: meta-lookalike</strong>' },
        { when: '42m', type: 'scroll',  variant: 'B', text: 'Scrolled to checkout · <strong>direct</strong>' },
    ],
};

// ============================================
// NUMBER COUNT-UP ANIMATION
// ============================================
function animateCount(el, target, decimals = 0, duration = 1200) {
    const start = 0;
    const startTime = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);

    function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const current = start + (target - start) * ease(progress);
        el.textContent = decimals === 0
            ? Math.round(current).toLocaleString()
            : current.toFixed(decimals);
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.countDecimals || '0', 10);
    animateCount(el, target, decimals);
});

// ============================================
// CHART.JS GLOBAL DEFAULTS
// ============================================
Chart.defaults.font.family = "'Open Sans', sans-serif";
Chart.defaults.color = COLORS.text;
Chart.defaults.borderColor = COLORS.grid;

// ============================================
// VISITORS OVER TIME
// ============================================
new Chart(document.getElementById('visitorsChart'), {
    type: 'line',
    data: {
        labels: mockData.visitorsOverTime.labels,
        datasets: [
            {
                label: 'No VSL',
                data: mockData.visitorsOverTime.variantA,
                borderColor: COLORS.slate,
                backgroundColor: COLORS.slateSoft,
                tension: 0.35,
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: COLORS.slate,
                fill: true,
            },
            {
                label: 'VSL',
                data: mockData.visitorsOverTime.variantB,
                borderColor: COLORS.gold,
                backgroundColor: COLORS.goldSoft,
                tension: 0.35,
                borderWidth: 2.5,
                pointRadius: 3,
                pointBackgroundColor: COLORS.gold,
                fill: true,
            },
        ],
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0d0e10',
                titleColor: COLORS.gold,
                bodyColor: COLORS.text,
                borderColor: 'rgba(194, 168, 89, 0.25)',
                borderWidth: 1,
                padding: 12,
                titleFont: { family: "'Sora', sans-serif", size: 11, weight: '600' },
                bodyFont: { family: "'Montserrat', sans-serif", size: 13, weight: '700' },
            },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: COLORS.textDim, font: { size: 11 } } },
            y: {
                grid: { color: COLORS.grid, drawBorder: false },
                ticks: { color: COLORS.textDim, font: { size: 11 } },
                beginAtZero: true,
            },
        },
    },
});

// ============================================
// FUNNEL CHART
// ============================================
new Chart(document.getElementById('funnelChart'), {
    type: 'bar',
    data: {
        labels: mockData.funnel.labels,
        datasets: [
            {
                label: 'No VSL',
                data: mockData.funnel.variantA,
                backgroundColor: COLORS.slate,
                borderRadius: 4,
                borderSkipped: false,
            },
            {
                label: 'VSL',
                data: mockData.funnel.variantB,
                backgroundColor: COLORS.gold,
                borderRadius: 4,
                borderSkipped: false,
            },
        ],
    },
    options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0d0e10',
                titleColor: COLORS.gold,
                bodyColor: COLORS.text,
                borderColor: 'rgba(194, 168, 89, 0.25)',
                borderWidth: 1,
                padding: 12,
            },
        },
        scales: {
            x: {
                grid: { color: COLORS.grid, drawBorder: false },
                ticks: { color: COLORS.textDim, font: { size: 11 } },
                beginAtZero: true,
            },
            y: {
                grid: { display: false },
                ticks: { color: COLORS.text, font: { size: 12, weight: '600' } },
            },
        },
    },
});

// ============================================
// CUMULATIVE REVENUE
// ============================================
new Chart(document.getElementById('revenueChart'), {
    type: 'line',
    data: {
        labels: mockData.revenue.labels,
        datasets: [
            {
                label: 'No VSL',
                data: mockData.revenue.variantA,
                borderColor: COLORS.slate,
                backgroundColor: 'rgba(100, 116, 139, 0.25)',
                tension: 0.3,
                fill: 'origin',
                borderWidth: 2,
                pointRadius: 3,
            },
            {
                label: 'VSL',
                data: mockData.revenue.variantB,
                borderColor: COLORS.gold,
                backgroundColor: 'rgba(194, 168, 89, 0.25)',
                tension: 0.3,
                fill: 'origin',
                borderWidth: 2.5,
                pointRadius: 3,
            },
        ],
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                align: 'end',
                labels: {
                    color: COLORS.text,
                    font: { family: "'Sora', sans-serif", size: 12 },
                    boxWidth: 10,
                    boxHeight: 10,
                    usePointStyle: true,
                    pointStyle: 'circle',
                },
            },
            tooltip: {
                backgroundColor: '#0d0e10',
                titleColor: COLORS.gold,
                bodyColor: COLORS.text,
                borderColor: 'rgba(194, 168, 89, 0.25)',
                borderWidth: 1,
                padding: 12,
                callbacks: {
                    label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}`,
                },
            },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: COLORS.textDim, font: { size: 11 } } },
            y: {
                grid: { color: COLORS.grid, drawBorder: false },
                ticks: {
                    color: COLORS.textDim,
                    font: { size: 11 },
                    callback: v => '$' + v.toLocaleString(),
                },
                beginAtZero: true,
            },
        },
    },
});

// ============================================
// ACTIVITY FEED
// ============================================
const iconMap = {
    purchase: { cls: 'icon-purchase', glyph: '$' },
    form:     { cls: 'icon-form',     glyph: '✎' },
    view:     { cls: 'icon-view',     glyph: '◉' },
    scroll:   { cls: 'icon-scroll',   glyph: '↓' },
};

function renderActivity() {
    const list = document.getElementById('activity-list');
    list.innerHTML = '';
    mockData.activity.forEach(evt => {
        const icon = iconMap[evt.type];
        const amount = evt.amount ? `<span class="activity-amount">$${evt.amount}</span>` : '';
        const vTag = `<span class="activity-variant variant-tag-${evt.variant.toLowerCase()}">Variant ${evt.variant}</span>`;
        const li = document.createElement('li');
        li.className = 'activity-item';
        li.innerHTML = `
            <span class="activity-icon ${icon.cls}">${icon.glyph}</span>
            <span class="activity-when">${evt.when} ago</span>
            <span class="activity-text">${evt.text}</span>
            ${vTag}
            ${amount}
        `;
        list.appendChild(li);
    });
}
renderActivity();

// ============================================
// LIVE INDICATOR — fake "last updated" tick
// ============================================
let seconds = 12;
setInterval(() => {
    seconds += 1;
    if (seconds > 59) seconds = 0;
    document.getElementById('last-updated').textContent = seconds + 's';
}, 1000);

document.getElementById('last-sync').textContent = new Date().toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
});

// ============================================
// RANGE PICKER
// ============================================
document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        // In prod: refetch /api/metrics?range={btn.dataset.range}
    });
});

// ============================================
// SIMULATE NEW EVENT ARRIVING (every 15s)
// Shows off the live feel in the prototype.
// ============================================
const sampleEvents = [
    { type: 'purchase', variant: 'B', text: 'Purchase · <strong>New buyer</strong>', amount: 29 },
    { type: 'view',     variant: 'A', text: 'Page view · <strong>UTM: tiktok-main</strong>' },
    { type: 'form',     variant: 'B', text: 'Form started · <strong>(anonymous)</strong>' },
    { type: 'scroll',   variant: 'A', text: 'Scrolled to checkout · <strong>organic</strong>' },
];
let evtCounter = 0;
setInterval(() => {
    const newEvt = { when: 'just now', ...sampleEvents[evtCounter % sampleEvents.length] };
    evtCounter++;
    mockData.activity.unshift(newEvt);
    if (mockData.activity.length > 15) mockData.activity.pop();
    const list = document.getElementById('activity-list');
    const icon = iconMap[newEvt.type];
    const amount = newEvt.amount ? `<span class="activity-amount">$${newEvt.amount}</span>` : '';
    const vTag = `<span class="activity-variant variant-tag-${newEvt.variant.toLowerCase()}">Variant ${newEvt.variant}</span>`;
    const li = document.createElement('li');
    li.className = 'activity-item is-new';
    li.innerHTML = `
        <span class="activity-icon ${icon.cls}">${icon.glyph}</span>
        <span class="activity-when">just now</span>
        <span class="activity-text">${newEvt.text}</span>
        ${vTag}
        ${amount}
    `;
    list.insertBefore(li, list.firstChild);
    if (list.children.length > 15) list.lastChild.remove();
}, 15000);
