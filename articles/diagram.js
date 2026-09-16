// diagram.js - interactive projection-model visual for the "in favour of local ai" article
(function () {
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.getElementById('proj-svg');
    var threshSvg = document.getElementById('thresh-svg');
    var summaryEl = document.getElementById('diagram-summary');
    var caption = document.getElementById('diagram-caption');
    var lSlider = document.getElementById('l-slider');
    var lValue = document.getElementById('l-value');
    var regenBtn = document.getElementById('regen-btn');

    if (!svg || !threshSvg) return;

    var N = 100;
    var K = { name: 'you (segment k)', p: 0.05, angle: 15 };

    var NAME_POOL = [
        'ad engagement', "gov't compliance", 'other users', 'shareholder profit',
        'content moderation', 'ai safety research', 'enterprise contracts', 'brand trust'
    ];

    function defaultSegments() {
        return [
            { name: 'ad engagement', p: 0.30, angle: 150 },
            { name: "gov't compliance", p: 0.15, angle: 20 },
            { name: 'other users', p: 0.30, angle: 95 },
            { name: 'shareholder profit', p: 0.20, angle: 110 }
        ];
    }

    function shuffleArr(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
    }

    function randomSegments() {
        var count = 3 + Math.floor(Math.random() * 3);
        var names = shuffleArr(NAME_POOL.slice()).slice(0, count);
        var weights = names.map(function () { return 0.3 + Math.random(); });
        var total = weights.reduce(function (a, b) { return a + b; }, 0);
        var remaining = 1 - K.p;
        weights = weights.map(function (w) { return (w / total) * remaining; });
        return names.map(function (name, i) {
            return { name: name, p: weights[i], angle: Math.round(Math.random() * 360 - 180) };
        });
    }

    var segments = defaultSegments();

    function toRad(d) { return d * Math.PI / 180; }
    function fmt(v) { return (v >= 0 ? '+' : '') + v.toFixed(1); }

    function el(tag, attrs) {
        var e = document.createElementNS(svgNS, tag);
        for (var k in attrs) e.setAttribute(k, attrs[k]);
        return e;
    }

    function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

    function computeStats() {
        var contribs = segments.map(function (s) {
            var c = Math.cos(toRad(s.angle));
            return { name: s.name, val: s.p * N * c, q: s.p * N, c: c };
        });
        var rawD = contribs.reduce(function (sum, c) { return sum + c.val; }, 0);
        var cK = Math.cos(toRad(K.angle));
        var kVal = K.p * N * cK;
        var A = kVal;
        return { contribs: contribs, D: Math.abs(rawD), rawD: rawD, A: A, kVal: kVal, cK: cK };
    }

    // --- panel 1: contribution dot-plot on a single horizontal axis ---
    function renderContribPlot(stats) {
        clear(svg);
        var W = 700, H = 280;
        var axisY = 140;
        var left = 70, right = W - 30;

        var allVals = stats.contribs.map(function (c) { return c.val; }).concat([stats.kVal]);
        var domainMax = Math.max(30, Math.max.apply(null, allVals.map(Math.abs)) * 1.3);
        function px(v) { return W / 2 + v * ((right - left) / 2 / domainMax); }

        // baseline
        svg.appendChild(el('line', { x1: left, y1: axisY, x2: right, y2: axisY, stroke: 'var(--border)', 'stroke-width': 1.5 }));
        svg.appendChild(el('line', { x1: px(0), y1: axisY - 6, x2: px(0), y2: axisY + 6, stroke: 'var(--text-faint)', 'stroke-width': 1.5 }));

        var leftLabel = el('text', { x: left, y: axisY + 32, 'font-size': 11.5, fill: 'var(--diag-neg)', 'text-anchor': 'start' });
        leftLabel.textContent = '← pulls away from you';
        svg.appendChild(leftLabel);
        var rightLabel = el('text', { x: right, y: axisY + 32, 'font-size': 11.5, fill: 'var(--diag-pos)', 'text-anchor': 'end' });
        rightLabel.textContent = 'pulls toward you →';
        svg.appendChild(rightLabel);

        var items = stats.contribs.slice().sort(function (a, b) { return a.val - b.val; });

        // greedily assign each label to the first row (alternating above/below,
        // stacking further out as needed) whose last-used x is far enough away
        var MIN_GAP = 105;
        var rowsAbove = []; // each entry: last x placed in that row
        var rowsBelow = [];
        var assignments = items.map(function (c) {
            var x = px(c.val);
            var tryRows = [];
            for (var i = 0; i < 3; i++) { tryRows.push({ side: 'above', idx: i }); tryRows.push({ side: 'below', idx: i }); }
            for (var t = 0; t < tryRows.length; t++) {
                var arr = tryRows[t].side === 'above' ? rowsAbove : rowsBelow;
                var i2 = tryRows[t].idx;
                if (arr[i2] === undefined || Math.abs(x - arr[i2]) > MIN_GAP) {
                    arr[i2] = x;
                    return { c: c, x: x, side: tryRows[t].side, level: i2 };
                }
            }
            var arr2 = rowsAbove;
            arr2[0] = x;
            return { c: c, x: x, side: 'above', level: 0 };
        });

        assignments.forEach(function (a) {
            var c = a.c, x = a.x;
            var positive = c.val >= 0;
            var color = positive ? 'var(--diag-pos)' : 'var(--diag-neg)';
            var above = a.side === 'above';
            var rowY = above ? axisY - 46 - a.level * 32 : axisY + 62 + a.level * 32;
            var r = Math.max(4, Math.min(11, 3.5 + Math.sqrt(c.q) * 0.9));

            svg.appendChild(el('line', {
                x1: x, y1: axisY, x2: x, y2: above ? rowY + 10 : rowY - 10,
                stroke: color, 'stroke-width': 1, 'stroke-dasharray': '2,3', opacity: 0.5
            }));
            svg.appendChild(el('circle', { cx: x, cy: axisY, r: r, fill: color, opacity: 0.9 }));

            var lx = Math.max(left + 10, Math.min(right - 10, x));
            var nameLbl = el('text', {
                x: lx, y: above ? rowY - 4 : rowY + 14, 'font-size': 11.5,
                fill: 'var(--text-faint)', 'text-anchor': 'middle'
            });
            nameLbl.textContent = c.name;
            svg.appendChild(nameLbl);

            var valLbl = el('text', {
                x: lx, y: above ? rowY + 10 : rowY + 28, 'font-size': 11, 'font-weight': 700,
                fill: color, 'text-anchor': 'middle'
            });
            valLbl.textContent = fmt(c.val);
            svg.appendChild(valLbl);
        });

        // segment k — you: distinct, always centered above axis at a fixed near row
        var kx = px(stats.kVal);
        svg.appendChild(el('line', { x1: kx, y1: axisY, x2: kx, y2: axisY - 14, stroke: 'var(--diag-you)', 'stroke-width': 1.5 }));
        svg.appendChild(el('circle', { cx: kx, cy: axisY, r: 8, fill: 'none', stroke: 'var(--diag-you)', 'stroke-width': 2.5 }));
        svg.appendChild(el('circle', { cx: kx, cy: axisY, r: 3, fill: 'var(--diag-you)' }));
        var kLbl = el('text', {
            x: Math.max(left + 10, Math.min(right - 10, kx)), y: axisY - 20, 'font-size': 12,
            'font-weight': 700, fill: 'var(--diag-you)', 'text-anchor': 'middle'
        });
        kLbl.textContent = 'you (k): ' + fmt(stats.kVal);
        svg.appendChild(kLbl);
    }

    // --- panel 2: threshold bar, l vs D + A ---
    function renderThreshold(stats) {
        clear(threshSvg);
        var W = 700, zero = 60, right = W - 30;
        var maxVal = 100;
        function px(v) { return zero + v * ((right - zero) / maxVal); }

        threshSvg.appendChild(el('line', { x1: zero, y1: 45, x2: right, y2: 45, stroke: 'var(--border)', 'stroke-width': 1 }));
        threshSvg.appendChild(el('line', { x1: zero, y1: 20, x2: zero, y2: 70, stroke: 'var(--text-faint)', 'stroke-width': 1 }));

        var threshold = stats.D + stats.A;
        var thresholdX = px(Math.min(threshold, maxVal));
        threshSvg.appendChild(el('line', {
            x1: thresholdX, y1: 15, x2: thresholdX, y2: 75,
            stroke: 'var(--diag-neg)', 'stroke-width': 1.5, 'stroke-dasharray': '4,3'
        }));
        var tLabel = el('text', {
            x: thresholdX, y: 12, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--diag-neg)'
        });
        tLabel.textContent = 'D+A ≈ ' + threshold.toFixed(1);
        threshSvg.appendChild(tLabel);

        var l = parseFloat(lSlider.value);
        var lX = px(Math.min(l, maxVal));
        var win = l > threshold;
        threshSvg.appendChild(el('rect', {
            x: zero, y: 38, width: Math.max(0, lX - zero), height: 14,
            fill: win ? 'var(--diag-you)' : 'var(--text-faint2)',
            rx: 3, opacity: win ? 0.9 : 0.55
        }));
        var overflowsRight = lX > right - 60;
        var lLabel = el('text', {
            x: overflowsRight ? lX - 6 : lX + 6, y: 49, 'font-size': 12, 'font-weight': 700,
            'text-anchor': overflowsRight ? 'end' : 'start',
            fill: overflowsRight ? 'var(--bg)' : (win ? 'var(--diag-you)' : 'var(--text-faint)')
        });
        lLabel.textContent = 'l = ' + l.toFixed(1);
        threshSvg.appendChild(lLabel);

        if (caption) {
            caption.textContent = win
                ? 'l (' + l.toFixed(1) + ') clears D+A (' + threshold.toFixed(1) + ') — your local model wins the projection.'
                : 'l (' + l.toFixed(1) + ') is still short of D+A (' + threshold.toFixed(1) + ') — the frontier lab’s net pull still dominates.';
        }
    }

    function renderSummary(stats) {
        if (!summaryEl) return;
        summaryEl.innerHTML =
            '<span class="diagram-summary-item"><span class="diagram-var">D</span> = |Σ q<sub>i</sub>c<sub>i</sub>| = ' + stats.D.toFixed(1) + '</span>' +
            '<span class="diagram-summary-item"><span class="diagram-var">A</span> = q<sub>k</sub>c<sub>k</sub> = ' + stats.A.toFixed(1) + '</span>' +
            '<span class="diagram-summary-item"><span class="diagram-var">D+A</span> = ' + (stats.D + stats.A).toFixed(1) + '</span>';
    }

    function update() {
        var stats = computeStats();
        renderContribPlot(stats);
        renderThreshold(stats);
        renderSummary(stats);
        if (lValue) lValue.textContent = parseFloat(lSlider.value).toFixed(1);
    }

    if (lSlider) {
        lSlider.addEventListener('input', function () {
            renderThreshold(computeStats());
            if (lValue) lValue.textContent = parseFloat(lSlider.value).toFixed(1);
        });
    }

    if (regenBtn) {
        regenBtn.addEventListener('click', function () {
            segments = randomSegments();
            update();
        });
    }

    update();
})();
