/* Decorative uncharted-water veil. Collision geometry and saves remain authoritative. */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const palettes = {
    sea: {body: '#050e18', cloud: '7,20,33', rim: '77,99,114'},
    chart: {body: '#263942', cloud: '28,45,54', rim: '163,171,153'}
  };

  function bounds(W, state) {
    const regions = window.VoyageRegions;
    return {left: 35, top: 35, bottom: W.height - 35,
      right: regions && !regions.unlocked(state) ? Math.min(W.width - 35, regions.harbour.width - 50) : W.width - 35};
  }

  function isPerimeter(a, W) {
    return (a.x === 0 && a.w === W.width && a.h <= 40 && (a.y === 0 || a.y + a.h === W.height)) ||
      (a.y === 0 && a.h === W.height && a.w <= 40 && (a.x === 0 || a.x + a.w === W.width));
  }

  function cloud(ctx, x, y, across, along, vertical, colour, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(vertical ? across : along, vertical ? along : across);
    const fog = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    fog.addColorStop(0, 'rgba(' + colour + ',' + opacity + ')');
    fog.addColorStop(.38, 'rgba(' + colour + ',' + opacity * .88 + ')');
    fog.addColorStop(.72, 'rgba(' + colour + ',' + opacity * .34 + ')');
    fog.addColorStop(1, 'rgba(' + colour + ',0)');
    ctx.fillStyle = fog;
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function contour(ctx, edge, index, from, to, depth, colour, opacity) {
    const point = (normal, tangent) => edge.vertical ? [normal, tangent] : [tangent, normal];
    const points = [];
    for (let n = Math.floor(from / 165) - 1; n <= Math.ceil(to / 165) + 1; n++) {
      const seed = n * 1.37 + index * 2.31;
      const distance = Math.max(0, depth + 35 + Math.sin(seed) * 26 + Math.cos(seed * 1.7) * 18);
      points.push(point(edge.at + distance * edge.inward, n * 165));
    }
    ctx.save(); ctx.globalAlpha = opacity; ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(...point(edge.outside, (Math.floor(from / 165) - 1) * 165));
    ctx.lineTo(...points[0]);
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    ctx.lineTo(...points[points.length - 1]);
    ctx.lineTo(...point(edge.outside, (Math.ceil(to / 165) + 1) * 165));
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function draw(ctx, scene) {
    const {W, state, camera, width, height} = scene;
    const b = bounds(W, state), p = palettes[scene.palette || 'sea'];
    const view = {left: camera.x - 4, top: camera.y - 4,
      right: camera.x + width / camera.scale + 4, bottom: camera.y + height / camera.scale + 4};
    const band = 155;
    // Cover actual forbidden water, including the preparation-gated outer coast.
    ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = p.body;
    if (view.left < b.left) ctx.fillRect(view.left, view.top, b.left - view.left + 2, view.bottom - view.top);
    if (view.right > b.right) ctx.fillRect(b.right - 2, view.top, view.right - b.right + 2, view.bottom - view.top);
    if (view.top < b.top) ctx.fillRect(view.left, view.top, view.right - view.left, b.top - view.top + 2);
    if (view.bottom > b.bottom) ctx.fillRect(view.left, b.bottom - 2, view.right - view.left, view.bottom - b.bottom + 2);
    const edges = [
      {vertical: true, at: b.left, inward: 1, from: b.top, to: b.bottom},
      {vertical: true, at: b.right, inward: -1, from: b.top, to: b.bottom},
      {vertical: false, at: b.top, inward: 1, from: b.left, to: b.right},
      {vertical: false, at: b.bottom, inward: -1, from: b.left, to: b.right}
    ];
    for (const [index, edge] of edges.entries()) {
      const normalMin = edge.vertical ? view.left : view.top, normalMax = edge.vertical ? view.right : view.bottom;
      if (edge.at + band < normalMin || edge.at - band > normalMax) continue;
      edge.outside = edge.inward > 0 ? Math.min(edge.at - 4, normalMin - 4) : Math.max(edge.at + 4, normalMax + 4);
      const tangentMin = Math.max(edge.from - 160, (edge.vertical ? view.top : view.left) - 160);
      const tangentMax = Math.min(edge.to + 160, (edge.vertical ? view.bottom : view.right) + 160);
      const end = edge.at + band * edge.inward;
      const veil = edge.vertical ? ctx.createLinearGradient(edge.at, 0, end, 0) : ctx.createLinearGradient(0, edge.at, 0, end);
      veil.addColorStop(0, p.body);
      veil.addColorStop(.18, 'rgba(' + p.cloud + ',.96)');
      veil.addColorStop(.55, 'rgba(' + p.cloud + ',.47)');
      veil.addColorStop(1, 'rgba(' + p.cloud + ',0)');
      ctx.fillStyle = veil;
      if (edge.vertical) ctx.fillRect(Math.min(edge.at, end), tangentMin, band, tangentMax - tangentMin);
      else ctx.fillRect(tangentMin, Math.min(edge.at, end), tangentMax - tangentMin, band);

      // Overlapping, unequal lobes feather the contour without blur filters or a texture download.
      for (let n = Math.floor(tangentMin / 115); n <= Math.ceil(tangentMax / 115); n++) {
        const seed = n * 1.731 + index * 2.43;
        const along = n * 115 + Math.sin(seed * 1.4) * 31;
        const normal = edge.at + (28 + Math.sin(seed) * 25) * edge.inward;
        const x = edge.vertical ? normal : along, y = edge.vertical ? along : normal;
        cloud(ctx, x, y, 78 + Math.cos(seed * 1.7) * 25, 109 + Math.sin(seed * .9) * 30, edge.vertical, p.cloud, .69);
        const rim = edge.at + (78 + Math.sin(seed * .8) * 28) * edge.inward;
        cloud(ctx, edge.vertical ? rim : along + 25, edge.vertical ? along + 25 : rim,
          28 + Math.sin(seed) * 7, 76 + Math.cos(seed) * 17, edge.vertical, p.rim, .055);
      }
      for (const [depth, opacity] of [[60, .05], [43, .07], [29, .1], [17, .15], [7, .24], [0, .84]]) {
        contour(ctx, edge, index, tangentMin, tangentMax, depth, p.body, opacity);
      }
    }
    ctx.restore();
    return b;
  }

  window.VoyageSeaBoundary = {bounds, isPerimeter, draw};
})();
