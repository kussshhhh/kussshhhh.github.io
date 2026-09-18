// concept-diagrams.js - a build-up sequence of static diagrams for "the model" section.
// Segments are groups of PEOPLE (regions of the user distribution); x̂_i is the
// direction that group gets pushed. Later stages reuse the exact same
// origin/geometry/colors as the final interactive diagram (diagram.js), so the
// sequence reads as one image gaining detail, ending in it.
(function () {
    var svgNS = 'http://www.w3.org/2000/svg';

    var N = 100;
    var K = { name: 'people like you', p: 0.05, angle: 15 };
    // segments are groups of people. what pushes them (regulation, revenue,
    // engagement targets) is the direction x̂_i, never the segment itself.
    var SEGMENTS = [
        { name: 'teens & students', push: 'safety rails', p: 0.30, angle: 155 },
        { name: 'young professionals', push: 'conversion', p: 0.15, angle: 35 },
        { name: 'everyone else', push: 'generic helpfulness', p: 0.30, angle: -70 },
        { name: 'enterprise seats', push: 'revenue', p: 0.20, angle: -160 }
    ];

    var VORIGIN = { x: 330, y: 150 };
    var VSCALE = 3.0;
    var VEC_MAX = 110;
    var VAXIS_END_X = 700;
    // every segment's direction x̂_i is drawn out to this common radius as a
    // dotted ray, so direction stays legible even when q_i is tiny. the solid
    // part of the arrow is still the magnitude. labels ride the same circle,
    // which also keeps them from colliding.
    var UNIT_R = 132;
    var LABEL_R = UNIT_R + 16;

    function toRad(d) { return d * Math.PI / 180; }

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

    // ---------------------------------------------------------------
    // the user distribution, and the segmentation drawn over it
    // ---------------------------------------------------------------
    // one 2d slice of a much higher-dimensional feature space. the actor draws
    // the boundaries; population density and the actor's weight p_i are
    // deliberately not the same thing.
    var PLOT = { x0: 150, y0: 40, x1: 690, y1: 214 };
    var SPLIT = { vx: 390, leftY: 132, rightY1: 102, rightY2: 166 };

    // left = younger, right = older; top = higher spend
    var REGIONS = [
        { seg: SEGMENTS[1], box: [PLOT.x0, PLOT.y0, SPLIT.vx, SPLIT.leftY], pop: 18 },
        { seg: SEGMENTS[0], box: [PLOT.x0, SPLIT.leftY, SPLIT.vx, PLOT.y1], pop: 46 },
        { seg: SEGMENTS[3], box: [SPLIT.vx, PLOT.y0, PLOT.x1, SPLIT.rightY1], pop: 12 },
        { seg: K, box: [SPLIT.vx, SPLIT.rightY1, PLOT.x1, SPLIT.rightY2], pop: 9, isK: true },
        { seg: SEGMENTS[2], box: [SPLIT.vx, SPLIT.rightY2, PLOT.x1, PLOT.y1], pop: 30 }
    ];

    function drawPlotFrame(svg) {
        svg.appendChild(el('rect', {
            x: PLOT.x0, y: PLOT.y0, width: PLOT.x1 - PLOT.x0, height: PLOT.y1 - PLOT.y0,
            fill: 'none', stroke: 'var(--border)', 'stroke-width': 1
        }));
        var xl = el('text', {
            x: (PLOT.x0 + PLOT.x1) / 2, y: PLOT.y1 + 26, 'font-size': 12,
            fill: 'var(--text-faint)', 'text-anchor': 'middle'
        });
        xl.textContent = 'age →';
        svg.appendChild(xl);
        var cy = (PLOT.y0 + PLOT.y1) / 2;
        var yl = el('text', {
            x: PLOT.x0 - 16, y: cy, 'font-size': 12,
            fill: 'var(--text-faint)', 'text-anchor': 'middle',
            transform: 'rotate(-90 ' + (PLOT.x0 - 16) + ' ' + cy + ')'
        });
        yl.textContent = 'spend per user →';
        svg.appendChild(yl);
        var note = el('text', {
            x: PLOT.x1, y: PLOT.y0 - 12, 'font-size': 11,
            fill: 'var(--text-faint2)', 'text-anchor': 'end'
        });
        note.textContent = '(one 2d slice of many metrics)';
        svg.appendChild(note);
    }

    function drawSegmentBoundaries(svg) {
        [
            [SPLIT.vx, PLOT.y0, SPLIT.vx, PLOT.y1],
            [PLOT.x0, SPLIT.leftY, SPLIT.vx, SPLIT.leftY],
            [SPLIT.vx, SPLIT.rightY1, PLOT.x1, SPLIT.rightY1],
            [SPLIT.vx, SPLIT.rightY2, PLOT.x1, SPLIT.rightY2]
        ].forEach(function (l) {
            svg.appendChild(el('line', {
                x1: l[0], y1: l[1], x2: l[2], y2: l[3],
                stroke: 'var(--text-faint2)', 'stroke-width': 1.25, 'stroke-dasharray': '5,4'
            }));
        });
    }

    // every population dot, so they can be given a slow idle drift
    var driftDots = [];

    function drawRegionDots(svg, region, seedBase, dotOpacity) {
        var b = region.box, m = 10;
        var w = b[2] - b[0] - m * 2, h = b[3] - b[1] - m * 2;
        for (var i = 0; i < region.pop; i++) {
            // average of two randoms -> soft centre-weighted density, reads like a cloud
            var rx = (seededRand(seedBase + i * 13.7) + seededRand(seedBase + i * 4.1)) / 2;
            var ry = (seededRand(seedBase + i * 7.3) + seededRand(seedBase + i * 2.9)) / 2;
            var isYou = region.isK && i === 0;
            // pin "you" to the edge of your segment nearest young professionals,
            // rather than letting the scatter drop it wherever
            if (isYou) { rx = 0.08; ry = 0.62; }
            var cx = b[0] + m + rx * w;
            var cy = b[1] + m + ry * h;
            var dot = el('circle', {
                cx: cx, cy: cy, r: isYou ? 5.5 : 3,
                fill: isYou ? 'var(--diag-you)' : 'var(--text-faint2)',
                opacity: isYou ? 1 : dotOpacity
            });
            svg.appendChild(dot);
            driftDots.push({
                node: dot, x: cx, y: cy,
                px: seededRand(seedBase + i * 3.1) * 6.28,
                py: seededRand(seedBase + i * 5.9) * 6.28,
                sx: 0.25 + seededRand(seedBase + i * 8.3) * 0.35,
                sy: 0.25 + seededRand(seedBase + i * 11.2) * 0.35,
                amp: isYou ? 1.2 : 1.8 + seededRand(seedBase + i * 6.1) * 1.6
            });
            if (isYou) {
                var youLbl = el('text', {
                    x: cx + 10, y: cy + 4,
                    'font-size': 11.5, 'font-weight': 700, fill: 'var(--diag-you)'
                });
                youLbl.textContent = 'you';
                svg.appendChild(youLbl);
            }
        }
    }

    function startDrift() {
        if (!driftDots.length) return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        function frame(ts) {
            var t = ts / 1000;
            for (var i = 0; i < driftDots.length; i++) {
                var d = driftDots[i];
                d.node.setAttribute('cx', d.x + Math.sin(t * d.sx + d.px) * d.amp);
                d.node.setAttribute('cy', d.y + Math.cos(t * d.sy + d.py) * d.amp);
            }
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    function regionLabel(svg, region, text, color, weight) {
        var b = region.box;
        var lbl = el('text', {
            x: b[0] + 8, y: b[1] + 16, 'font-size': 11.5,
            'font-weight': weight || 400, fill: color
        });
        lbl.textContent = text;
        svg.appendChild(lbl);
    }

    // --- stage 1: the distribution, carved into segments ---
    function renderPopulation(svg) {
        addDefs(svg);
        drawPlotFrame(svg);
        drawSegmentBoundaries(svg);
        REGIONS.forEach(function (region, i) {
            drawRegionDots(svg, region, i * 131 + 5, 0.75);
            regionLabel(
                svg, region,
                region.isK ? region.seg.name + ' (segment k)' : region.seg.name,
                region.isK ? 'var(--diag-you)' : 'var(--text-faint)',
                region.isK ? 700 : 400
            );
        });
    }

    // --- stage 2: same people, shaded by the weight the actor gives them ---
    function renderWeights(svg) {
        addDefs(svg);
        drawPlotFrame(svg);
        REGIONS.forEach(function (region, i) {
            var b = region.box;
            svg.appendChild(el('rect', {
                x: b[0], y: b[1], width: b[2] - b[0], height: b[3] - b[1],
                fill: region.isK ? 'var(--diag-you)' : 'var(--accent2)',
                opacity: 0.04 + region.seg.p * 1.15
            }));
            drawRegionDots(svg, region, i * 131 + 5, 0.4);
            regionLabel(
                svg, region,
                region.seg.name + '   p=' + region.seg.p.toFixed(2),
                region.isK ? 'var(--diag-you)' : 'var(--text-soft)',
                700
            );
        });
        drawSegmentBoundaries(svg);
        var sumLbl = el('text', {
            x: (PLOT.x0 + PLOT.x1) / 2, y: PLOT.y1 + 50, 'font-size': 12.5, 'font-weight': 700,
            fill: 'var(--text-soft)', 'text-anchor': 'middle'
        });
        sumLbl.textContent = 'Σ p_i = 1.00   (weight is not headcount)';
        svg.appendChild(sumLbl);
    }

    // ---------------------------------------------------------------
    // vector stages (same geometry as the final interactive diagram)
    // ---------------------------------------------------------------

    // labels ride the common unit-ray circle, so their spacing follows the
    // angular spread of the segments and never needs collision nudging
    function placeLabel(svg, u, text, color, fontWeight, opacity) {
        var lbl = el('text', {
            x: VORIGIN.x + LABEL_R * u.x,
            y: Math.max(14, Math.min(292, VORIGIN.y + LABEL_R * u.y + 4)),
            'font-size': 12, fill: color, opacity: opacity === undefined ? 1 : opacity,
            'font-weight': fontWeight || 400,
            'text-anchor': u.x < -0.2 ? 'end' : (u.x > 0.2 ? 'start' : 'middle')
        });
        lbl.textContent = text;
        svg.appendChild(lbl);
    }

    // one segment's arrow: a dotted ray all the way out to UNIT_R showing x̂_i,
    // with the solid arrow on top of it carrying the magnitude q_i
    function drawSegVector(svg, seg, opt) {
        var u = unit(seg.angle);
        var len = Math.min(seg.p * N * VSCALE, VEC_MAX);
        var tip = { x: VORIGIN.x + len * u.x, y: VORIGIN.y + len * u.y };
        var op = opt.dim ? 0.18 : 0.95;

        svg.appendChild(el('line', {
            x1: VORIGIN.x, y1: VORIGIN.y,
            x2: VORIGIN.x + UNIT_R * u.x, y2: VORIGIN.y + UNIT_R * u.y,
            stroke: opt.color, 'stroke-width': 1.25, 'stroke-dasharray': '2,5',
            opacity: opt.dim ? 0.12 : 0.4
        }));
        svg.appendChild(el('line', {
            x1: VORIGIN.x, y1: VORIGIN.y, x2: tip.x, y2: tip.y,
            stroke: opt.color, 'stroke-width': opt.bold ? 3.5 : 2.75,
            'marker-end': 'url(#' + opt.marker + ')', opacity: op
        }));

        if (opt.drop) {
            svg.appendChild(el('line', {
                x1: tip.x, y1: tip.y, x2: tip.x, y2: VORIGIN.y,
                stroke: opt.color, 'stroke-width': 1, 'stroke-dasharray': '3,3',
                opacity: opt.dim ? 0.1 : 0.45
            }));
            svg.appendChild(el('circle', {
                cx: tip.x, cy: VORIGIN.y, r: 3, fill: opt.color, opacity: op
            }));
        }
        if (opt.label) placeLabel(svg, u, opt.label, opt.color, opt.bold ? 700 : 400, opt.dim ? 0.3 : 1);
        return tip;
    }

    // --- stage 3: vectors, length = q_i, direction = x̂_i, still sentiment-neutral ---
    function renderVectors(svg) {
        addDefs(svg);
        drawOrigin(svg);
        SEGMENTS.forEach(function (seg) {
            drawSegVector(svg, seg, {
                color: 'var(--accent2)', marker: 'cdm-neutral',
                label: seg.name + ' → ' + seg.push
            });
        });
        drawSegVector(svg, K, {
            color: 'var(--diag-you)', marker: 'cdm-you', bold: true,
            label: 'people like you  q=' + (K.p * N).toFixed(0)
        });
    }

    // --- stage 4: add â, vectors still neutral ---
    function renderAxis(svg) {
        addDefs(svg);
        drawOrigin(svg);
        drawAxis(svg);
        SEGMENTS.forEach(function (seg) {
            drawSegVector(svg, seg, { color: 'var(--accent2)', marker: 'cdm-neutral' });
        });
        drawSegVector(svg, K, { color: 'var(--diag-you)', marker: 'cdm-you', bold: true });
    }

    // --- stage 5: projections + the colour reveal (c_i determines pos/neg) ---
    function renderProjection(svg) {
        addDefs(svg);
        drawOrigin(svg);
        drawAxis(svg);
        SEGMENTS.forEach(function (seg) {
            var c = Math.cos(toRad(seg.angle));
            var positive = c >= 0;
            drawSegVector(svg, seg, {
                color: positive ? 'var(--diag-pos)' : 'var(--diag-neg)',
                marker: positive ? 'cdm-pos' : 'cdm-neg',
                drop: true,
                label: seg.name + ' c=' + c.toFixed(2)
            });
        });
        drawSegVector(svg, K, {
            color: 'var(--diag-you)', marker: 'cdm-you', bold: true, drop: true,
            label: 'people like you c=' + Math.cos(toRad(K.angle)).toFixed(2)
        });
    }

    // --- the approximation: x̂_k points almost at â, and almost isn't all ---
    function renderApprox(svg) {
        addDefs(svg);
        var O = { x: 190, y: 206 };
        var AXIS_END = 690;
        var LEN = 300;
        var u = unit(K.angle);
        var tip = { x: O.x + LEN * u.x, y: O.y + LEN * u.y };

        svg.appendChild(el('line', {
            x1: O.x, y1: O.y, x2: AXIS_END - 12, y2: O.y,
            stroke: 'var(--text)', 'stroke-width': 2, 'marker-end': 'url(#cdm-axis)'
        }));
        var aLbl = el('text', {
            x: AXIS_END + 4, y: O.y + 5, 'font-style': 'italic', 'font-size': 15, fill: 'var(--text)'
        });
        aLbl.textContent = 'â';
        svg.appendChild(aLbl);
        svg.appendChild(el('circle', { cx: O.x, cy: O.y, r: 3.5, fill: 'var(--text-faint)' }));

        svg.appendChild(el('line', {
            x1: O.x, y1: O.y, x2: tip.x, y2: tip.y,
            stroke: 'var(--diag-you)', 'stroke-width': 3, 'marker-end': 'url(#cdm-you)'
        }));
        var xLbl = el('text', {
            x: tip.x + 12, y: tip.y - 4, 'font-size': 12.5, 'font-weight': 700, fill: 'var(--diag-you)'
        });
        xLbl.textContent = 'x̂ₖ = the direction your segment gets pushed';
        svg.appendChild(xLbl);

        var arcR = 64;
        svg.appendChild(el('path', {
            d: 'M ' + (O.x + arcR) + ' ' + O.y +
                ' A ' + arcR + ' ' + arcR + ' 0 0 0 ' +
                (O.x + arcR * u.x) + ' ' + (O.y + arcR * u.y),
            fill: 'none', stroke: 'var(--text-faint)', 'stroke-width': 1.25
        }));
        var thetaLbl = el('text', {
            x: O.x + 80, y: O.y - 10, 'font-size': 13, 'font-style': 'italic', fill: 'var(--text-faint)'
        });
        thetaLbl.textContent = 'θ';
        svg.appendChild(thetaLbl);

        svg.appendChild(el('line', {
            x1: tip.x, y1: tip.y, x2: tip.x, y2: O.y,
            stroke: 'var(--diag-neg)', 'stroke-width': 1.5, 'stroke-dasharray': '4,3'
        }));
        svg.appendChild(el('circle', { cx: tip.x, cy: O.y, r: 3.5, fill: 'var(--diag-you)' }));
        svg.appendChild(el('path', {
            d: 'M ' + (tip.x - 9) + ' ' + O.y + ' L ' + (tip.x - 9) + ' ' + (O.y - 9) + ' L ' + tip.x + ' ' + (O.y - 9),
            fill: 'none', stroke: 'var(--text-faint2)', 'stroke-width': 1
        }));
        var residLbl = el('text', {
            x: tip.x + 12, y: (tip.y + O.y) / 2 + 4, 'font-size': 12, fill: 'var(--diag-neg)'
        });
        residLbl.textContent = 'the part that misses you';
        svg.appendChild(residLbl);

        var by = O.y + 28;
        svg.appendChild(el('path', {
            d: 'M ' + O.x + ' ' + (by - 6) + ' L ' + O.x + ' ' + by +
                ' L ' + tip.x + ' ' + by + ' L ' + tip.x + ' ' + (by - 6),
            fill: 'none', stroke: 'var(--diag-you)', 'stroke-width': 1.25
        }));
        var cLbl = el('text', {
            x: (O.x + tip.x) / 2, y: by + 18, 'font-size': 12.5, 'font-weight': 700,
            fill: 'var(--diag-you)', 'text-anchor': 'middle'
        });
        cLbl.textContent = 'cₖ = the part that actually lands on you';
        svg.appendChild(cLbl);
    }

    // shared "highlight subset, dim the rest" renderer for D and A stages.
    // the split is by sign, not by segment membership: D is everything landing
    // against you, A is everything landing with you.
    function renderHighlight(svg, wantAgainst, readoutLabel, readoutValue) {
        addDefs(svg);
        drawOrigin(svg);
        drawAxis(svg);
        SEGMENTS.concat([K]).forEach(function (seg) {
            var isK = seg === K;
            var c = Math.cos(toRad(seg.angle));
            var positive = c >= 0;
            var include = wantAgainst ? !positive : positive;
            drawSegVector(svg, seg, {
                color: isK ? 'var(--diag-you)' : (positive ? 'var(--diag-pos)' : 'var(--diag-neg)'),
                marker: isK ? 'cdm-you' : (positive ? 'cdm-pos' : 'cdm-neg'),
                drop: true, dim: !include, bold: isK
            });
        });
        var lbl = el('text', {
            x: VORIGIN.x, y: 288, 'font-size': 15, 'font-weight': 700,
            fill: 'var(--text-strong)', 'text-anchor': 'middle'
        });
        lbl.textContent = readoutLabel + ' = ' + readoutValue.toFixed(1);
        svg.appendChild(lbl);
    }

    function signedSum(keepNegative) {
        return SEGMENTS.concat([K]).reduce(function (s, seg) {
            var v = seg.p * N * Math.cos(toRad(seg.angle));
            var isNeg = v < 0;
            return isNeg === keepNegative ? s + v : s;
        }, 0);
    }

    function computeD() { return Math.abs(signedSum(true)); }
    function computeA() { return signedSum(false); }

    var RENDERERS = {
        'cd-population': renderPopulation,
        'cd-weights': renderWeights,
        'cd-vectors': renderVectors,
        'cd-axis': renderAxis,
        'cd-projection': renderProjection,
        'cd-approx': renderApprox,
        'cd-d': function (svg) { renderHighlight(svg, true, 'D', computeD()); },
        'cd-a': function (svg) { renderHighlight(svg, false, 'A', computeA()); }
    };

    Object.keys(RENDERERS).forEach(function (id) {
        var svg = document.getElementById(id);
        if (svg) RENDERERS[id](svg);
    });

    startDrift();
})();
