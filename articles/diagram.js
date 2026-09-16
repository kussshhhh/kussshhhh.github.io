// diagram.js - interactive projection-model visual for the "in favour of local ai" article
(function () {
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.getElementById('scene-svg');
    var summaryEl = document.getElementById('diagram-summary');
    var caption = document.getElementById('diagram-caption');
    var lSlider = document.getElementById('l-slider');
    var lValue = document.getElementById('l-value');
    var regenBtn = document.getElementById('regen-btn');

    if (!svg) return;

    var N = 100;
    var K = { name: 'you (segment k)', p: 0.05, angle: 15 };

    var NAME_POOL = [
        'ad engagement', "gov't compliance", 'other users', 'shareholder profit',
        'content moderation', 'ai safety research', 'enterprise contracts', 'brand trust'
    ];

    function defaultSegments() {
        return [
            { name: 'ad engagement', p: 0.30, angle: 155 },
            { name: "gov't compliance", p: 0.15, angle: 35 },
            { name: 'other users', p: 0.30, angle: -70 },
            { name: 'shareholder profit', p: 0.20, angle: -160 }
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
        var count = 3 + Math.floor(Math.random() * 2); // 3-4, kept spread out
        var names = shuffleArr(NAME_POOL.slice()).slice(0, count);
        var weights = names.map(function () { return 0.3 + Math.random(); });
        var total = weights.reduce(function (a, b) { return a + b; }, 0);
        var remaining = 1 - K.p;
        weights = weights.map(function (w) { return (w / total) * remaining; });
        var base = Math.random() * 360;
        var slice = 360 / count;
        return names.map(function (name, i) {
            var angle = base + i * slice + (Math.random() * slice * 0.4 - slice * 0.2);
            angle = ((angle + 180) % 360 + 360) % 360 - 180;
            return { name: name, p: weights[i], angle: Math.round(angle) };
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
            return { name: s.name, val: s.p * N * c, q: s.p * N, c: c, angle: s.angle };
        });
        var rawD = contribs.reduce(function (sum, c) { return sum + c.val; }, 0);
        var cK = Math.cos(toRad(K.angle));
        var kVal = K.p * N * cK;
        return { contribs: contribs, D: Math.abs(rawD), rawD: rawD, A: kVal, kVal: kVal };
    }

    var W = 820, H = 460;

    // -- band 1: the vector geometry (origin, segment pushes, true projections) --
    var VORIGIN = { x: 330, y: 150 };
    var VSCALE = 2.2;
    var VEC_MAX = 100;
    var VAXIS_END_X = 700;

    // -- band 2: the race (l vs. D+A threshold, same axis direction, dedicated lane) --
    var RORIGIN = { x: 90, y: 400 };
    var RSCALE = 3.6;
    var RAXIS_END_X = 740;

    function addDefs() {
        var defs = el('defs', {});
        function mk(id, color) {
            var m = el('marker', {
                id: id, viewBox: '0 0 10 10', refX: 8, refY: 5,
                markerWidth: 9, markerHeight: 9, markerUnits: 'userSpaceOnUse', orient: 'auto-start-reverse'
            });
            m.appendChild(el('path', { d: 'M0,0 L10,5 L0,10 z', fill: color }));
            return m;
        }
        defs.appendChild(mk('m-axis', 'var(--text)'));
        defs.appendChild(mk('m-pos', 'var(--diag-pos)'));
        defs.appendChild(mk('m-neg', 'var(--diag-neg)'));
        defs.appendChild(mk('m-you', 'var(--diag-you)'));

        var glow = el('filter', { id: 'glow-blur', x: '-60%', y: '-60%', width: '220%', height: '220%' });
        glow.appendChild(el('feGaussianBlur', { stdDeviation: '6', result: 'blur' }));
        defs.appendChild(glow);
        return defs;
    }

    function addGuides() {
        [35, 70, 100].forEach(function (r) {
            svg.appendChild(el('circle', {
                cx: VORIGIN.x, cy: VORIGIN.y, r: r, fill: 'none',
                stroke: 'var(--border)', 'stroke-width': 1, opacity: 0.5
            }));
        });
    }

    function buildVectorBand(stats) {
        svg.appendChild(el('line', {
            x1: VORIGIN.x, y1: VORIGIN.y, x2: VAXIS_END_X - 12, y2: VORIGIN.y,
            stroke: 'var(--text)', 'stroke-width': 2, 'marker-end': 'url(#m-axis)'
        }));
        var axisLabel = el('text', {
            x: VAXIS_END_X + 4, y: VORIGIN.y + 5, 'font-style': 'italic', 'font-size': 16, fill: 'var(--text)'
        });
        axisLabel.textContent = 'â (you)';
        svg.appendChild(axisLabel);
        svg.appendChild(el('circle', { cx: VORIGIN.x, cy: VORIGIN.y, r: 3.5, fill: 'var(--text-faint)' }));

        var placedLabelsX = [];
        segments.forEach(function (s) {
            var c = Math.cos(toRad(s.angle));
            var rad = toRad(s.angle);
            var rawLen = s.p * N * VSCALE;
            var len = Math.min(rawLen, VEC_MAX);
            var ux = Math.cos(rad), uy = -Math.sin(rad);
            var tip = { x: VORIGIN.x + len * ux, y: VORIGIN.y + len * uy };
            var positive = c >= 0;
            var color = positive ? 'var(--diag-pos)' : 'var(--diag-neg)';
            var marker = positive ? 'm-pos' : 'm-neg';

            svg.appendChild(el('line', {
                x1: VORIGIN.x, y1: VORIGIN.y, x2: tip.x, y2: tip.y,
                stroke: color, 'stroke-width': 2.25, 'marker-end': 'url(#' + marker + ')', opacity: 0.9
            }));
            svg.appendChild(el('line', {
                x1: tip.x, y1: tip.y, x2: tip.x, y2: VORIGIN.y,
                stroke: color, 'stroke-width': 1, 'stroke-dasharray': '3,3', opacity: 0.45
            }));
            svg.appendChild(el('circle', { cx: tip.x, cy: VORIGIN.y, r: 3, fill: color }));

            var labelDist = 18;
            var tries = 0;
            while (placedLabelsX.some(function (x) { return Math.abs(x - tip.x) < 55; }) && tries < 4) {
                labelDist += 15; tries++;
            }
            placedLabelsX.push(tip.x);
            var lx = tip.x + ux * labelDist;
            var ly = Math.max(14, Math.min(310, tip.y + uy * labelDist));
            var anchor = Math.abs(ux) < 0.2 ? 'middle' : (ux > 0 ? 'start' : 'end');
            var clampedLx = anchor === 'end' ? Math.max(70, lx) : Math.min(W - 10, lx);
            var nameLbl = el('text', {
                x: clampedLx, y: ly, 'font-size': 12, fill: 'var(--text-faint)', 'text-anchor': anchor
            });
            nameLbl.textContent = s.name + '  ' + fmt(s.p * N * c);
            svg.appendChild(nameLbl);
        });

        svg.appendChild(el('line', {
            id: 'k-line', x1: VORIGIN.x, y1: VORIGIN.y, x2: VORIGIN.x, y2: VORIGIN.y,
            stroke: 'var(--diag-you)', 'stroke-width': 2.5, 'marker-end': 'url(#m-you)'
        }));
        svg.appendChild(el('line', {
            id: 'k-drop', x1: VORIGIN.x, y1: VORIGIN.y, x2: VORIGIN.x, y2: VORIGIN.y,
            stroke: 'var(--diag-you)', 'stroke-width': 1, 'stroke-dasharray': '3,3', opacity: 0.5
        }));
        var kLbl = el('text', {
            id: 'k-label', x: VORIGIN.x, y: VORIGIN.y - 10, 'font-size': 12, 'font-weight': 700,
            fill: 'var(--diag-you)', 'text-anchor': 'middle'
        });
        svg.appendChild(kLbl);
    }

    function updateKVector() {
        var kc = Math.cos(toRad(K.angle));
        var l = parseFloat(lSlider.value);
        var kBase = K.p * N * VSCALE;
        var kLen = Math.min(kBase + l * 0.85, VEC_MAX);
        var kRad = toRad(K.angle);
        var kux = Math.cos(kRad), kuy = -Math.sin(kRad);
        var kTip = { x: VORIGIN.x + kLen * kux, y: VORIGIN.y + kLen * kuy };

        var kLine = document.getElementById('k-line');
        var kDrop = document.getElementById('k-drop');
        var kLbl = document.getElementById('k-label');
        if (kLine) { kLine.setAttribute('x2', kTip.x); kLine.setAttribute('y2', kTip.y); }
        if (kDrop) { kDrop.setAttribute('x1', kTip.x); kDrop.setAttribute('y1', kTip.y); kDrop.setAttribute('x2', kTip.x); kDrop.setAttribute('y2', VORIGIN.y); }
        if (kLbl) {
            // fixed lane below the origin, clear of the segment cluster above —
            // decoupled from k's actual angle so it never collides with segment labels
            var lx = VORIGIN.x + Math.max(kLen, 40) * 0.6;
            var ly = VORIGIN.y + 26;
            kLbl.setAttribute('x', lx);
            kLbl.setAttribute('y', ly);
            kLbl.textContent = 'you + l: ' + fmt(K.p * N * kc + l);
        }
    }

    function buildRaceBand(stats) {
        var caption1 = el('text', {
            x: RORIGIN.x, y: RORIGIN.y - 62, 'font-size': 13, fill: 'var(--text-faint)', 'text-anchor': 'start'
        });
        caption1.textContent = 'the same axis — does l clear the frontier’s net pull?';
        svg.appendChild(caption1);

        svg.appendChild(el('line', {
            x1: RORIGIN.x, y1: RORIGIN.y, x2: RAXIS_END_X, y2: RORIGIN.y,
            stroke: 'var(--border)', 'stroke-width': 2
        }));
        svg.appendChild(el('circle', { cx: RORIGIN.x, cy: RORIGIN.y, r: 3.5, fill: 'var(--text-faint)' }));

        var threshold = stats.D + stats.A;
        var tickX = RORIGIN.x + threshold * RSCALE;
        svg.appendChild(el('line', {
            x1: tickX, y1: RORIGIN.y - 28, x2: tickX, y2: RORIGIN.y + 28,
            stroke: 'var(--diag-neg)', 'stroke-width': 2, 'stroke-dasharray': '5,3'
        }));
        var tickLbl = el('text', {
            x: tickX, y: RORIGIN.y - 36, 'font-size': 13, 'font-weight': 700,
            fill: 'var(--diag-neg)', 'text-anchor': 'middle'
        });
        tickLbl.textContent = 'D+A = ' + threshold.toFixed(1);
        svg.appendChild(tickLbl);

        svg.appendChild(el('line', {
            id: 'l-glow', x1: RORIGIN.x, y1: RORIGIN.y, x2: RORIGIN.x, y2: RORIGIN.y,
            stroke: 'var(--diag-you)', 'stroke-width': 11, opacity: 0, filter: 'url(#glow-blur)'
        }));
        svg.appendChild(el('line', {
            id: 'l-line', x1: RORIGIN.x, y1: RORIGIN.y, x2: RORIGIN.x, y2: RORIGIN.y,
            stroke: 'var(--diag-you)', 'stroke-width': 6, 'marker-end': 'url(#m-you)'
        }));
        svg.appendChild(el('circle', { id: 'win-badge', cx: RORIGIN.x, cy: RORIGIN.y, r: 0, fill: 'var(--diag-you)' }));
        var lLbl = el('text', {
            id: 'l-label', x: RORIGIN.x, y: RORIGIN.y + 34, 'font-size': 14, 'font-weight': 700,
            fill: 'var(--diag-you)', 'text-anchor': 'start'
        });
        lLbl.textContent = 'l';
        svg.appendChild(lLbl);

        var winTag = el('text', {
            id: 'win-tag', x: RAXIS_END_X, y: RORIGIN.y - 36, 'font-size': 14, 'font-weight': 700,
            fill: 'var(--diag-you)', 'text-anchor': 'end'
        });
        winTag.textContent = 'w';
        svg.appendChild(winTag);
    }

    function buildScene() {
        clear(svg);
        svg.appendChild(addDefs());
        addGuides();
        var stats = computeStats();
        buildVectorBand(stats);
        buildRaceBand(stats);
        return stats;
    }

    function updateDynamic(stats) {
        var l = parseFloat(lSlider.value);
        var threshold = stats.D + stats.A;
        var win = l > threshold;
        var lx = RORIGIN.x + l * RSCALE;

        updateKVector();

        var lLine = document.getElementById('l-line');
        var lGlow = document.getElementById('l-glow');
        var badge = document.getElementById('win-badge');
        var lLbl = document.getElementById('l-label');
        var winTag = document.getElementById('win-tag');

        if (lLine) { lLine.setAttribute('x2', lx); lLine.setAttribute('y2', RORIGIN.y); }
        if (lGlow) {
            lGlow.setAttribute('x2', lx);
            lGlow.setAttribute('y2', RORIGIN.y);
            lGlow.setAttribute('opacity', win ? 0.5 : 0);
            lGlow.classList.toggle('diagram-pulse', win);
        }
        if (badge) {
            badge.setAttribute('cx', lx);
            badge.setAttribute('cy', RORIGIN.y);
            badge.setAttribute('r', win ? 7 : 0);
            badge.classList.toggle('diagram-pulse', win);
        }
        if (lLbl) {
            var overflowsRight = lx > RAXIS_END_X - 40;
            lLbl.setAttribute('x', overflowsRight ? lx - 8 : lx + 8);
            lLbl.setAttribute('text-anchor', overflowsRight ? 'end' : 'start');
        }
        if (winTag) {
            winTag.textContent = win ? 'w' : 'possibility of being fucked';
            winTag.setAttribute('fill', win ? 'var(--diag-you)' : 'var(--diag-neg)');
            winTag.classList.toggle('diagram-pulse', win);
        }

        svg.classList.toggle('diagram-winning', win);

        if (caption) {
            caption.textContent = win
                ? 'l (' + l.toFixed(1) + ') clears D+A (' + threshold.toFixed(1) + ') — winning.'
                : 'l (' + l.toFixed(1) + ') is still short of D+A (' + threshold.toFixed(1) + ') — the frontier lab’s net pull still dominates.';
        }
        if (lValue) lValue.textContent = l.toFixed(1);
    }

    function renderSummary(stats) {
        if (!summaryEl) return;
        summaryEl.innerHTML =
            '<span class="diagram-summary-item"><span class="diagram-var">D</span> = |Σ q<sub>i</sub>c<sub>i</sub>| = ' + stats.D.toFixed(1) + '</span>' +
            '<span class="diagram-summary-item"><span class="diagram-var">A</span> = q<sub>k</sub>c<sub>k</sub> = ' + stats.A.toFixed(1) + '</span>' +
            '<span class="diagram-summary-item"><span class="diagram-var">D+A</span> = ' + (stats.D + stats.A).toFixed(1) + '</span>';
    }

    var currentStats;

    function fullRender() {
        currentStats = buildScene();
        renderSummary(currentStats);
        updateDynamic(currentStats);
    }

    if (lSlider) {
        lSlider.addEventListener('input', function () { updateDynamic(currentStats); });
    }
    if (regenBtn) {
        regenBtn.addEventListener('click', function () { segments = randomSegments(); fullRender(); });
    }

    fullRender();
})();
