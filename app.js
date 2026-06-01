(function () {
  const canvas = document.getElementById("hexmap");
  const ctx = canvas.getContext("2d");
  const menu = document.getElementById("context-menu");
  const seedLabel = document.getElementById("seed-label");
  const toggleSymbolsBtn = document.getElementById("toggle-symbols");
  const exportBtn = document.getElementById("export-png");
  const newMapBtn = document.getElementById("new-map");

  const HEX_RADIUS = 42;
  const MAP_RADIUS = 5;
  const center = { x: canvas.width / 2, y: canvas.height / 2 };

  const biomes = [
    { name: "Ruins", symbol: "🏛️" },
    { name: "Lake", symbol: "≈" },
    { name: "River", symbol: "∿" },
    { name: "Settlement (small)", symbol: "◍" },
    { name: "Settlement (big city)", symbol: "⬢" },
    { name: "Great Pillar", symbol: "ǀ" },
    { name: "Cave", symbol: "◔" },
    { name: "Monster", symbol: "☠" },
    { name: "Landmark", symbol: "✦" },
    { name: "Woods", symbol: "♣" },
    { name: "Mushroom Forest", symbol: "♨" },
    { name: "Crystal Chasm", symbol: "◇" },
    { name: "Obsidian Field", symbol: "▦" },
    { name: "Ancient Shrine", symbol: "☉" },
    { name: "Web Nest", symbol: "✣" }
  ];

  let currentSeed = "";
  let showSymbols = true;
  let hexes = [];

  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i += 1) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }

  function sfc32(a, b, c, d) {
    return function () {
      a >>>= 0;
      b >>>= 0;
      c >>>= 0;
      d >>>= 0;
      const t = (a + b) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      d = (d + 1) | 0;
      const out = (t + d) | 0;
      c = (c + out) | 0;
      return (out >>> 0) / 4294967296;
    };
  }

  function randomSeed() {
    const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
    const arr = new Uint32Array(12);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(arr);
    } else {
      for (let i = 0; i < arr.length; i += 1) {
        arr[i] = Math.floor(Math.random() * 0xffffffff);
      }
    }
    return Array.from(arr, (n) => alphabet[n % alphabet.length]).join("");
  }

  function ensureSeedInUrl() {
    const params = new URLSearchParams(window.location.search);
    const existingSeed = params.get("seed");
    if (existingSeed) {
      return existingSeed;
    }
    const generatedSeed = randomSeed();
    params.set("seed", generatedSeed);
    const query = params.toString();
    const nextUrl = `${window.location.pathname}?${query}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
    return generatedSeed;
  }

  function axialToPixel(q, r) {
    return {
      x: center.x + HEX_RADIUS * Math.sqrt(3) * (q + r / 2),
      y: center.y + HEX_RADIUS * 1.5 * r
    };
  }

  function buildMap(seed) {
    const seedMaker = xmur3(seed);
    const rnd = sfc32(seedMaker(), seedMaker(), seedMaker(), seedMaker());
    const generated = [];
    for (let q = -MAP_RADIUS; q <= MAP_RADIUS; q += 1) {
      const rMin = Math.max(-MAP_RADIUS, -q - MAP_RADIUS);
      const rMax = Math.min(MAP_RADIUS, -q + MAP_RADIUS);
      for (let r = rMin; r <= rMax; r += 1) {
        const pixel = axialToPixel(q, r);
        const isHome = q === 0 && r === 0;
        const biome = isHome
          ? { name: "Home", symbol: "⌂" }
          : biomes[Math.floor(rnd() * biomes.length)];
        generated.push({ q, r, x: pixel.x, y: pixel.y, biome });
      }
    }
    return generated;
  }

  function drawHex(x, y) {
    ctx.beginPath();
    for (let side = 0; side < 6; side += 1) {
      const angle = ((60 * side - 30) * Math.PI) / 180;
      const px = x + HEX_RADIUS * Math.cos(angle);
      const py = y + HEX_RADIUS * Math.sin(angle);
      if (side === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
  }

  function drawRuinsSymbol(x, y) {
    ctx.save();
    ctx.fillStyle = "#111";

    ctx.beginPath();
    ctx.moveTo(x - 16, y + 13);
    ctx.lineTo(x + 16, y + 13);
    ctx.lineTo(x + 12, y + 9);
    ctx.lineTo(x - 13, y + 9);
    ctx.closePath();
    ctx.fill();

    ctx.fillRect(x - 13, y - 4, 6, 14);
    ctx.fillRect(x + 7, y - 4, 6, 14);
    ctx.fillRect(x - 2, y + 2, 4, 8);

    ctx.beginPath();
    ctx.moveTo(x - 15, y - 6);
    ctx.lineTo(x - 8, y - 12);
    ctx.lineTo(x - 2, y - 8);
    ctx.lineTo(x + 3, y - 11);
    ctx.lineTo(x + 9, y - 7);
    ctx.lineTo(x + 15, y - 10);
    ctx.lineTo(x + 15, y - 4);
    ctx.lineTo(x - 15, y - 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#d8d3c4";
    ctx.fillRect(x - 5, y - 10, 6, 6);
    ctx.fillRect(x - 7, y - 2, 2, 10);
    ctx.fillRect(x + 5, y - 2, 2, 10);
    ctx.fillRect(x - 1, y + 4, 2, 6);
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#d8d3c4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const hex of hexes) {
      drawHex(hex.x, hex.y);
      ctx.strokeStyle = "#6f6962";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      if (showSymbols) {
        ctx.setLineDash([]);
        if (hex.biome.name === "Ruins") {
          drawRuinsSymbol(hex.x, hex.y);
        } else {
          ctx.fillStyle = "#111";
          ctx.font = hex.biome.name === "Home" ? "bold 22px serif" : "20px serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(hex.biome.symbol, hex.x, hex.y);
        }
      }
    }
    ctx.setLineDash([]);
  }

  function syncUi() {
    seedLabel.textContent = `Seed: ${currentSeed}`;
    toggleSymbolsBtn.textContent = showSymbols ? "Hide symbols" : "Show symbols";
  }

  function generateFromSeed(seed) {
    currentSeed = seed;
    hexes = buildMap(seed);
    syncUi();
    render();
  }

  function exportAsPng() {
    const link = document.createElement("a");
    link.download = `hexcrawl-${currentSeed}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function hideMenu() {
    menu.classList.add("hidden");
  }

  function showMenu(pageX, pageY) {
    const rect = canvas.getBoundingClientRect();
    const appLeft = rect.left + window.scrollX;
    const appTop = rect.top + window.scrollY;
    menu.style.left = `${Math.max(0, Math.min(pageX - appLeft, canvas.clientWidth - 200))}px`;
    menu.style.top = `${Math.max(0, Math.min(pageY - appTop, canvas.clientHeight - 130))}px`;
    menu.classList.remove("hidden");
  }

  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    showMenu(event.pageX, event.pageY);
  });

  document.addEventListener("click", hideMenu);
  window.addEventListener("resize", hideMenu);

  toggleSymbolsBtn.addEventListener("click", () => {
    showSymbols = !showSymbols;
    syncUi();
    render();
    hideMenu();
  });

  exportBtn.addEventListener("click", () => {
    exportAsPng();
    hideMenu();
  });

  newMapBtn.addEventListener("click", () => {
    const nextSeed = randomSeed();
    const params = new URLSearchParams(window.location.search);
    params.set("seed", nextSeed);
    const query = params.toString();
    const nextUrl = `${window.location.pathname}?${query}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
    generateFromSeed(nextSeed);
    hideMenu();
  });

  generateFromSeed(ensureSeedInUrl());
})();
