// ===== CONFIGURACIÓN INICIAL =====
const simulation = {
    running: false,
    speedMultiplier: 1,
    digoxinaLevel: 0,
    time: 0,
    frameCount: 0
};

const physiologyState = {
    naInternal: 50,
    naExternal: 145,
    kInternal: 140,
    kExternal: 5,
    caInternal: 100,
    atpaseActive: 10,
    atpaseBlocked: 0,
    ncxSpeed: 100
};

const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
const graphCanvas = document.getElementById('graphCanvas');
const graphCtx = graphCanvas.getContext('2d');

// Configurar canvas
function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width - 40;
    canvas.height = rect.height - 40;
    
    const graphRect = graphCanvas.parentElement.getBoundingClientRect();
    graphCanvas.width = graphRect.width - 40;
    graphCanvas.height = 200;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ===== ESTRUCTURA DE PROTEÍNAS =====
class ATPase {
    constructor(x, y, blocked = false) {
        this.x = x;
        this.y = y;
        this.blocked = blocked;
        this.naOut = 0;
        this.kIn = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update(digoxinaLevel, speed) {
        if (digoxinaLevel > 0) {
            const blockChance = (digoxinaLevel / 100) * 0.3;
            if (Math.random() < blockChance) {
                this.blocked = true;
            }
        }
        
        if (!this.blocked && Math.random() < 0.1 * speed) {
            this.blocked = false;
        }

        if (!this.blocked) {
            this.pulsePhase += 0.1 * speed;
        }
    }

    draw(ctx) {
        const size = 20;
        
        if (this.blocked) {
            // ATPasa bloqueada - Gris oscuro
            ctx.fillStyle = '#404040';
            ctx.beginPath();
            ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // X roja encima
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x - 8, this.y - 8);
            ctx.lineTo(this.x + 8, this.y + 8);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x + 8, this.y - 8);
            ctx.lineTo(this.x - 8, this.y + 8);
            ctx.stroke();
        } else {
            // ATPasa activa - Celeste
            const pulse = Math.sin(this.pulsePhase) * 0.2 + 0.8;
            ctx.fillStyle = `rgba(34, 211, 238, ${pulse})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, size * pulse, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#0891b2';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

class NCXExchanger {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.phase = Math.random() * Math.PI * 2;
    }

    update(speed, ncxActivityLevel) {
        this.phase += 0.08 * speed * (ncxActivityLevel / 100);
    }

    draw(ctx) {
        const size = 18;
        const pulse = Math.sin(this.phase) * 0.3 + 0.7;
        
        ctx.fillStyle = `rgba(251, 146, 60, ${pulse})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class Ion {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'na', 'k', 'ca'
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.lifetime = 0;
    }

    update(speed, containerHeight) {
        this.x += this.vx * speed;
        this.y += this.vy * speed;
        this.lifetime += 0.02 * speed;

        // Rebotar en bordes
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > containerHeight) this.vy *= -1;

        this.x = Math.max(0, Math.min(canvas.width, this.x));
        this.y = Math.max(0, Math.min(containerHeight, this.y));
    }

    draw(ctx) {
        const size = 8;
        const alpha = Math.max(0, 1 - this.lifetime / 3);
        
        let color;
        if (this.type === 'na') {
            ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
        } else if (this.type === 'k') {
            ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
        } else if (this.type === 'ca') {
            ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ===== INICIALIZAR ELEMENTOS =====
const proteins = [];
const ions = [];
const historyData = {
    time: [],
    naInternal: [],
    kInternal: [],
    caInternal: [],
    ncxSpeed: []
};

function initializeProteins() {
    proteins.length = 0;
    const spacing = canvas.width / 11;
    
    for (let i = 1; i <= 10; i++) {
        const x = i * spacing;
        proteins.push(new ATPase(x, canvas.height / 2, false));
        proteins.push(new NCXExchanger(x * 1.05, canvas.height / 2));
    }
}

initializeProteins();

// ===== LÓGICA DE SIMULACIÓN =====
function updatePhysiology() {
    const digoxinaEffect = simulation.digoxinaLevel / 100;
    
    // Actualizar ATPasas
    let activeCount = 0;
    let blockedCount = 0;
    
    proteins.forEach(protein => {
        if (protein instanceof ATPase) {
            protein.update(simulation.digoxinaLevel, simulation.speedMultiplier);
            if (protein.blocked) {
                blockedCount++;
            } else {
                activeCount++;
            }
        }
    });
    
    physiologyState.atpaseActive = activeCount;
    physiologyState.atpaseBlocked = blockedCount;
    
    // Efecto en Na⁺
    const naTransport = (1 - digoxinaEffect * 0.8) * 0.1;
    physiologyState.naInternal += naTransport;
    physiologyState.naExternal -= naTransport;
    
    // Efecto en K⁺
    const kTransport = (1 - digoxinaEffect * 0.7) * 0.15;
    physiologyState.kInternal -= kTransport;
    physiologyState.kExternal += kTransport;
    
    // Efecto en Ca²⁺
    const caIncrease = digoxinaEffect * 2;
    physiologyState.caInternal += caIncrease;
    
    // Velocidad NCX
    physiologyState.ncxSpeed = Math.max(20, 100 - digoxinaEffect * 50);
    
    // Valores límites fisiológicos
    physiologyState.naInternal = Math.min(120, Math.max(10, physiologyState.naInternal));
    physiologyState.naExternal = Math.min(160, Math.max(100, physiologyState.naExternal));
    physiologyState.kInternal = Math.min(160, Math.max(80, physiologyState.kInternal));
    physiologyState.kExternal = Math.min(40, Math.max(2, physiologyState.kExternal));
    physiologyState.caInternal = Math.min(500, Math.max(50, physiologyState.caInternal));
    
    // Generar iones
    if (simulation.running && ions.length < 50) {
        if (Math.random() < 0.3) {
            const ionType = Math.random() < 0.4 ? 'na' : (Math.random() < 0.5 ? 'k' : 'ca');
            ions.push(new Ion(Math.random() * canvas.width, Math.random() * canvas.height, ionType));
        }
    }
    
    // Actualizar iones
    ions.forEach((ion, index) => {
        ion.update(simulation.speedMultiplier, canvas.height);
        if (ion.lifetime > 3) {
            ions.splice(index, 1);
        }
    });
}

// ===== DIBUJAR SIMULACIÓN =====
function draw() {
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const membraneY = canvas.height / 2;
    const membraneHeight = 40;
    
    // Dibujar membrana plasmática
    ctx.fillStyle = '#d3d3d3';
    ctx.fillRect(0, membraneY - membraneHeight / 2, canvas.width, membraneHeight);
    
    // Labels de espacios
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.fillText('ESPACIO EXTRACELULAR', 20, 30);
    ctx.fillText('CITOPLASMA', 20, canvas.height - 15);
    
    // Dibujar proteínas
    proteins.forEach(protein => {
        protein.draw(ctx);
    });
    
    // Dibujar iones
    ions.forEach(ion => {
        ion.draw(ctx);
    });
    
    // Leyenda
    drawLegend();
}

function drawLegend() {
    const legendY = 100;
    const legendX = canvas.width - 150;
    const itemHeight = 20;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(legendX - 10, legendY - 20, 140, 130);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX - 10, legendY - 20, 140, 130);
    
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('LEYENDA', legendX, legendY);
    
    ctx.font = '11px Arial';
    const items = [
        { color: '#3b82f6', label: 'Na⁺ (Sodio)' },
        { color: '#8b5cf6', label: 'K⁺ (Potasio)' },
        { color: '#ef4444', label: 'Ca²⁺ (Calcio)' },
        { color: '#22d3ee', label: 'ATPasa Activa' },
        { color: '#fb923c', label: 'NCX Activo' }
    ];
    
    items.forEach((item, i) => {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(legendX, legendY + 20 + i * itemHeight, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.fillText(item.label, legendX + 15, legendY + 24 + i * itemHeight);
    });
}

// ===== GRÁFICO DE DATOS =====
function drawGraph() {
    const padding = 30;
    const width = graphCanvas.width - 2 * padding;
    const height = graphCanvas.height - 2 * padding;
    
    graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    
    // Grid
    graphCtx.strokeStyle = '#e5e7eb';
    graphCtx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (height / 5) * i;
        graphCtx.beginPath();
        graphCtx.moveTo(padding, y);
        graphCtx.lineTo(graphCanvas.width - padding, y);
        graphCtx.stroke();
    }
    
    if (historyData.time.length > 1) {
        // Datos normalizados para visualización
        const maxTime = historyData.time[historyData.time.length - 1];
        
        const datasets = [
            { data: historyData.naInternal, color: '#3b82f6', label: 'Na⁺ Int' },
            { data: historyData.kInternal, color: '#8b5cf6', label: 'K⁺ Int' },
            { data: historyData.caInternal, color: '#ef4444', label: 'Ca²⁺ Int' },
        ];
        
        datasets.forEach(dataset => {
            graphCtx.strokeStyle = dataset.color;
            graphCtx.lineWidth = 2;
            graphCtx.beginPath();
            
            dataset.data.forEach((value, idx) => {
                const x = padding + (width * idx) / Math.max(1, dataset.data.length - 1);
                const y = graphCanvas.height - padding - (value / 200) * height;
                
                if (idx === 0) graphCtx.moveTo(x, y);
                else graphCtx.lineTo(x, y);
            });
            
            graphCtx.stroke();
        });
    }
    
    // Etiquetas
    graphCtx.fillStyle = '#666';
    graphCtx.font = '11px Arial';
    graphCtx.fillText('Time', graphCanvas.width - 40, graphCanvas.height - 5);
    graphCtx.fillText('mM', 5, 15);
}

// ===== ACTUALIZAR MÉTRICAS =====
function updateMetrics() {
    document.getElementById('naInternal').textContent = physiologyState.naInternal.toFixed(1) + ' mM';
    document.getElementById('naExternal').textContent = physiologyState.naExternal.toFixed(1) + ' mM';
    document.getElementById('kInternal').textContent = physiologyState.kInternal.toFixed(1) + ' mM';
    document.getElementById('kExternal').textContent = physiologyState.kExternal.toFixed(1) + ' mM';
    document.getElementById('caInternal').textContent = physiologyState.caInternal.toFixed(1) + ' nM';
    document.getElementById('atpaseActive').textContent = physiologyState.atpaseActive;
    document.getElementById('atpaseBlocked').textContent = physiologyState.atpaseBlocked;
    document.getElementById('ncxSpeed').textContent = physiologyState.ncxSpeed.toFixed(0) + '%';
    
    // Guardar datos para gráfico
    if (simulation.frameCount % 10 === 0) {
        historyData.time.push(simulation.time);
        historyData.naInternal.push(physiologyState.naInternal);
        historyData.kInternal.push(physiologyState.kInternal);
        historyData.caInternal.push(physiologyState.caInternal);
        historyData.ncxSpeed.push(physiologyState.ncxSpeed);
        
        // Limitar historial a últimos 100 puntos
        if (historyData.time.length > 100) {
            historyData.time.shift();
            historyData.naInternal.shift();
            historyData.kInternal.shift();
            historyData.caInternal.shift();
            historyData.ncxSpeed.shift();
        }
    }
}

// ===== LOOP DE ANIMACIÓN =====
function animate() {
    if (simulation.running) {
        updatePhysiology();
        simulation.time += 0.016 * simulation.speedMultiplier;
        simulation.frameCount++;
        
        proteins.forEach(protein => {
            if (protein instanceof NCXExchanger) {
                protein.update(simulation.speedMultiplier, physiologyState.ncxSpeed);
            }
        });
    }
    
    updateMetrics();
    draw();
    drawGraph();
    
    requestAnimationFrame(animate);
}

animate();

// ===== CONTROLES DE INTERFAZ =====
document.getElementById('startBtn').addEventListener('click', () => {
    simulation.running = true;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    simulation.running = false;
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
});

document.getElementById('resetBtn').addEventListener('click', () => {
    simulation.running = false;
    simulation.time = 0;
    simulation.frameCount = 0;
    simulation.speedMultiplier = 1;
    simulation.digoxinaLevel = 0;
    
    physiologyState.naInternal = 50;
    physiologyState.naExternal = 145;
    physiologyState.kInternal = 140;
    physiologyState.kExternal = 5;
    physiologyState.caInternal = 100;
    
    ions.length = 0;
    historyData.time = [];
    historyData.naInternal = [];
    historyData.kInternal = [];
    historyData.caInternal = [];
    historyData.ncxSpeed = [];
    
    initializeProteins();
    document.getElementById('digoxinaSlider').value = 0;
    document.getElementById('speedToggle').textContent = '×1';
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
});

document.getElementById('speedToggle').addEventListener('click', () => {
    simulation.speedMultiplier = simulation.speedMultiplier === 1 ? 2 : 1;
    document.getElementById('speedToggle').textContent = `×${simulation.speedMultiplier}`;
});

document.getElementById('digoxinaSlider').addEventListener('input', (e) => {
    simulation.digoxinaLevel = parseFloat(e.target.value);
    document.getElementById('digoxinaValue').textContent = simulation.digoxinaLevel;
});

// Estado inicial
document.getElementById('pauseBtn').disabled = true;