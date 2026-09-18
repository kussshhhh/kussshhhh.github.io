// concept-diagrams.js - a build-up sequence of static diagrams for "the model" section.
// Each stage reuses the exact same origin/geometry/colors as the final interactive
// diagram (diagram.js) so the sequence reads as one image gaining detail, ending in it.
(function () {
    var svgNS = 'http://www.w3.org/2000/svg';

    var N = 100;
    var K = { name: 'you', p: 0.05, angle: 15 };
    var SEGMENTS = [
        { name: 'ad engagement', p: 0.30, angle: 155 },
        { name: "gov't compliance", p: 0.15, angle: 35 },
        { name: 'other users', p: 0.30, angle: -70 },
        { name: 'shareholder profit', p: 0.20, angle: -160 }
    ];

    var VORIGIN = { x: 330, y: 150 };
    var VSCALE = 2.2;
    var VEC_MAX = 100;
    var VAXIS_END_X = 700;

    function toRad(d) { return d * Math.PI / 180; }
    function fmt(v) { return (v >= 0 ? '+' : '') + v.toFixed(1); }

    function el(tag, attrs) {
        var e = document.createElementNS(svgNS, tag);
        for (var k in attrs) e.setAttribute(k, attrs[k]);
        return e;
    }

    function seededRand(seed) {
        var x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    function addDefs(svg) {
        var defs = el('defs', {});
        function mk(id, color) {
            var m = el('marker', {
                id: id, viewBox: '0 0 10 10', refX: 8, refY: 5,
                markerWidth: 9, markerHeight: 9, markerUnits: 'userSpaceOnUse', orient: 'auto-start-reverse'
            });
            m.appendChild(el('path', { d: 'M0,0 L10,5 L0,10 z', fill: color }));
            return m;
        }
        defs.appendChild(mk('cdm-axis', 'var(--text)'));
        defs.appendChild(mk('cdm-pos', 'var(--diag-pos)'));
        defs.appendChild(mk('cdm-neg', 'var(--diag-neg)'));
        defs.appendChild(mk('cdm-you', 'var(--diag-you)'));
        defs.appendChild(mk('cdm-neutral', 'var(--accent2)'));
        svg.appendChild(defs);
    }

    function drawOrigin(svg) {
        svg.appendChild(el('circle', { cx: VORIGIN.x, cy: VORIGIN.y, r: 3.5, fill: 'var(--text-faint)' }));
    }

    function drawAxis(svg) {
        svg.appendChild(el('line', {
            x1: VORIGIN.x, y1: VORIGIN.y, x2: VAXIS_END_X - 12, y2: VORIGIN.y,
            stroke: 'var(--text)', 'stroke-width': 2, 'marker-end': 'url(#cdm-axis)'
        }));
        var lbl = el('text', {
            x: VAXIS_END_X + 4, y: VORIGIN.y + 5, 'font-style': 'italic', 'font-size': 16, fill: 'var(--text)'
        });
        lbl.textContent = 'â (you)';
        svg.appendChild(lbl);
    }

    function unit(angle) {
        var rad = toRad(angle);
        return { x: Math.cos(rad), y: -Math.sin(rad) };
    }

    // greedy label placement: push a label further out along its vector's own
    // direction until it clears any label already placed nearby (same approach
    // as the final interactive diagram) so close angles (k=15°, gov't=35°) don't collide
    function placeLabel(svg, tip, u, text, color, placedX, fontWeight) {
        var dist = 16;
        var tries = 0;
        while (placedX.some(function (x) { return Math.abs(x - tip.x) < 60; }) && tries < 4) {
            dist += 15; tries++;
        }
        placedX.push(tip.x);
        var lx = tip.x + u.x * dist;
        var ly = Math.max(14, Math.min(286, tip.y + u.y * dist));
        var lbl = el('text', {
            x: lx, y: ly, 'font-size': 12, fill: color,
            'font-weight': fontWeight || 400,
            'text-anchor': u.x < -0.2 ? 'end' : (u.x > 0.2 ? 'start' : 'middle')
        });
        lbl.textContent = text;
        svg.appendChild(lbl);
    }

    // slots: 5 evenly spaced, non-overlapping positions for the pre-vector stages.
    // direction/angle isn't introduced until x̂_i, so population and weights use a
    // plain left-to-right layout rather than the final diagram's angles.
    var SLOTS = (function () {
        var all = SEGMENTS.concat([K]);
        var margin = 90, usable = 820 - margin * 2, step = usable / (all.length - 1);
        return all.map(function (seg, i) { return { seg: seg, x: margin + step * i, y: 130 }; });
    })();

    function drawSlotDots(svg, slot, seedBase, radius, count) {
        var isK = slot.seg === K;
        for (var i = 0; i < count; i++) {
            var a = seededRand(seedBase + i * 13.7) * Math.PI * 2;
            var r = Math.sqrt(seededRand(seedBase + i * 7.3)) * radius;
            var dx = slot.x + Math.cos(a) * r;
            var dy = slot.y + Math.sin(a) * r;
            svg.appendChild(el('circle', {
                cx: dx, cy: dy, r: isK ? 5 : 3.2,
                fill: isK ? 'var(--diag-you)' : 'var(--text-faint2)',
                opacity: isK ? 1 : 0.8
            }));
        }
    }

    // --- stage 1: population, clustered into segments (no weights, no vectors) ---
    function renderPopulation(svg) {
        addDefs(svg);
        SLOTS.forEach(function (slot, si) {
            var isK = slot.seg === K;
            drawSlotDots(svg, slot, si * 97 + 1, 26, isK ? 6 : 10);
            var lbl = el('text', {
                x: slot.x, y: slot.y + 26 + 22, 'font-size': 12, 'font-weight': isK ? 700 : 400,
                fill: isK ? 'var(--diag-you)' : 'var(--text-faint)', 'text-anchor': 'middle'
            });
            lbl.textContent = isK ? 'you (segment k)' : slot.seg.name;
            svg.appendChild(lbl);
        });
    }

    // --- stage 2: same slots, blob size now scales with weight p_i, summing to 1 ---
    function renderWeights(svg) {
        addDefs(svg);
        SLOTS.forEach(function (slot, si) {
            var isK = slot.seg === K;
            var radius = 12 + slot.seg.p * 90;
            var count = Math.max(3, Math.round(slot.seg.p * 40));
            drawSlotDots(svg, slot, si * 97 + 2, radius, count);
            var lbl = el('text', {
                x: slot.x, y: slot.y + radius + 22, 'font-size': 12, 'font-weight': isK ? 700 : 400,
                fill: isK ? 'var(--diag-you)' : 'var(--text-faint)', 'text-anchor': 'middle'
            });
            lbl.textContent = (isK ? 'you  p=' : slot.seg.name + '  p=') + slot.seg.p.toFixed(2);
            svg.appendChild(lbl);
        });
        var sumLbl = el('text', {
            x: 410, y: 285, 'font-size': 13, 'font-weight': 700,
            fill: 'var(--text-soft)', 'text-anchor': 'middle'
        });
        var total = SEGMENTS.concat([K]).reduce(function (s, x) { return s + x.p; }, 0);
        sumLbl.textContent = 'Σ p_i = ' + total.toFixed(2);
        svg.appendChild(sumLbl);
    }

    // K always gets its own fixed lane below the origin for its label, rather than
    // competing in the segments' angle-based collision system (k=15° sits too close
    // to gov't compliance=35° for that to ever separate them cleanly)
    function drawKVector(svg, markerId) {
        var u = unit(K.angle);
        var len = Math.min(K.p * N * VSCALE, VEC_MAX);
        var tip = { x: VORIGIN.x + len * u.x, y: VORIGIN.y + len * u.y };
        svg.appendChild(el('line', {
            x1: VORIGIN.x, y1: VORIGIN.y, x2: tip.x, y2: tip.y,
            stroke: 'var(--diag-you)', 'stroke-width': 3, 'marker-end': 'url(#' + markerId + ')', opacity: 0.9
        }));
        return tip;
    }

    function kLabelLane(svg, text) {
        var lbl = el('text', {
            x: VORIGIN.x, y: VORIGIN.y + 26, 'font-size': 12, 'font-weight': 700,
            fill: 'var(--diag-you)', 'text-anchor': 'middle'
        });
        lbl.textContent = text;
        svg.appendChild(lbl);
    }

    // --- stage 3: vectors, length = q_i, direction = x̂_i, still sentiment-neutral ---
    function renderVectors(svg) {
        addDefs(svg);
        drawOrigin(svg);
        var placedX = [];
        SEGMENTS.forEach(function (seg) {
            var u = unit(seg.angle);
            var len = Math.min(seg.p * N * VSCALE, VEC_MAX);
            var tip = { x: VORIGIN.x + len * u.x, y: VORIGIN.y + len * u.y };
            svg.appendChild(el('line', {
                x1: VORIGIN.x, y1: VORIGIN.y, x2: tip.x, y2: tip.y,
                stroke: 'var(--accent2)', 'stroke-width': 2.25, 'marker-end': 'url(#cdm-neutral)', opacity: 0.9
            }));
            placeLabel(svg, tip, u, seg.name + ' q=' + (seg.p * N).toFixed(0), 'var(--accent2)', placedX, 400);
        });
        drawKVector(svg, 'cdm-you');
        kLabelLane(svg, 'you: q=' + (K.p * N).toFixed(0));
    }

    // --- stage 4: add â, vectors still neutral ---
    function renderAxis(svg) {
        addDefs(svg);
        drawOrigin(svg);
        drawAxis(svg);
        SEGMENTS.concat([K]).forEach(function (seg) {
            var isK = seg === K;
            var u = unit(seg.angle);
            var len = Math.min(seg.p * N * VSCALE, VEC_MAX);
            var tip = { x: VORIGIN.x + len * u.x, y: VORIGIN.y + len * u.y };
            var color = isK ? 'var(--diag-you)' : 'var(--accent2)';
            var marker = isK ? 'cdm-you' : 'cdm-neutral';
            svg.appendChild(el('line', {
                x1: VORIGIN.x, y1: VORIGIN.y, x2: tip.x, y2: tip.y,
                stroke: color, 'stroke-width': isK ? 3 : 2.25, 'marker-end': 'url(#' + marker + ')', opacity: 0.9
            }));
        });
    }

    // --- stage 5: projections + the color reveal (c_i determines pos/neg) ---
    function renderProjection(svg) {
        addDefs(svg);
        drawOrigin(svg);
        drawAxis(svg);
        var placedX = [];
        SEGMENTS.forEach(function (seg) {
            var u = unit(seg.angle);
            var c = Math.cos(toRad(seg.angle));
            var len = Math.min(seg.p * N * VSCALE, VEC_MAX);
            var tip = { x: VORIGIN.x + len * u.x, y: VORIGIN.y + len * u.y };
            var positive = c >= 0;
            var color = positive ? 'var(--diag-pos)' : 'var(--diag-neg)';
            var marker = positive ? 'cdm-pos' : 'cdm-neg';
            svg.appendChild(el('line', {
                x1: VORIGIN.x, y1: VORIGIN.y, x2: tip.x, y2: tip.y,
                stroke: color, 'stroke-width': 2.25, 'marker-end': 'url(#' + marker + ')', opacity: 0.9
            }));
            svg.appendChild(el('line', {
                x1: tip.x, y1: tip.y, x2: tip.x, y2: VORIGIN.y,
                stroke: color, 'stroke-width': 1, 'stroke-dasharray': '3,3', opacity: 0.45
            }));
            svg.appendChild(el('circle', { cx: tip.x, cy: VORIGIN.y, r: 3, fill: color }));
            placeLabel(svg, tip, u, seg.name + ' c=' + c.toFixed(2), color, placedX, 400);
        });
        var kTip = drawKVector(svg, 'cdm-you');
        svg.appendChild(el('line', {
            x1: kTip.x, y1: kTip.y, x2: kTip.x, y2: VORIGIN.y,
            stroke: 'var(--diag-you)', 'stroke-width': 1, 'stroke-dasharray': '3,3', opacity: 0.5
        }));
        svg.appendChild(el('circle', { cx: kTip.x, cy: VORIGIN.y, r: 3, fill: 'var(--diag-you)' }));
        kLabelLane(svg, 'you c=' + Math.cos(toRad(K.angle)).toFixed(2));
    }

    // shared "highlight subset, dim the rest" renderer for D and A stages
    function renderHighlight(svg, highlightK, readoutLabel, readoutValue) {
        addDefs(svg);
        drawOrigin(svg);
        drawAxis(svg);
        var sumVal = 0;
        SEGMENTS.concat([K]).forEach(function (seg) {
            var isK = seg === K;
            var include = highlightK ? isK : !isK;
            var u = unit(seg.angle);
            var c = Math.cos(toRad(seg.angle));
            var len = Math.min(seg.p * N * VSCALE, VEC_MAX);
            var tip = { x: VORIGIN.x + len * u.x, y: VORIGIN.y + len * u.y };
            var positive = c >= 0;
            var color = isK ? 'var(--diag-you)' : (positive ? 'var(--diag-pos)' : 'var(--diag-neg)');
            var marker = isK ? 'cdm-you' : (positive ? 'cdm-pos' : 'cdm-neg');
            var op = include ? 0.95 : 0.18;
            svg.appendChild(el('line', {
                x1: VORIGIN.x, y1: VORIGIN.y, x2: tip.x, y2: tip.y,
                stroke: color, 'stroke-width': isK ? 3 : 2.25, 'marker-end': 'url(#' + marker + ')', opacity: op
            }));
            svg.appendChild(el('line', {
                x1: tip.x, y1: tip.y, x2: tip.x, y2: VORIGIN.y,
                stroke: color, 'stroke-width': 1, 'stroke-dasharray': '3,3', opacity: include ? 0.45 : 0.1
            }));
            svg.appendChild(el('circle', { cx: tip.x, cy: VORIGIN.y, r: 3, fill: color, opacity: op }));
            if (!isK) sumVal += seg.p * N * c;
        });
        var lbl = el('text', {
            x: VORIGIN.x, y: 280, 'font-size': 15, 'font-weight': 700,
            fill: 'var(--text-strong)', 'text-anchor': 'middle'
        });
        lbl.textContent = readoutLabel + ' = ' + readoutValue.toFixed(1);
        svg.appendChild(lbl);
    }

    function computeD() {
        var raw = SEGMENTS.reduce(function (s, seg) {
            return s + seg.p * N * Math.cos(toRad(seg.angle));
        }, 0);
        return Math.abs(raw);
    }

    function computeA() {
        return K.p * N * Math.cos(toRad(K.angle));
    }

    var RENDERERS = {
        'cd-population': renderPopulation,
        'cd-weights': renderWeights,
        'cd-vectors': renderVectors,
        'cd-axis': renderAxis,
        'cd-projection': renderProjection,
        'cd-d': function (svg) { renderHighlight(svg, false, 'D', computeD()); },
        'cd-a': function (svg) { renderHighlight(svg, true, 'A', computeA()); }
    };

    Object.keys(RENDERERS).forEach(function (id) {
        var svg = document.getElementById(id);
        if (svg) RENDERERS[id](svg);
    });
})();
