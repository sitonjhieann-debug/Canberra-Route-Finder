
/* ============================================================
   CANBERRA ROUTE FINDER
   INTERACTIVE MAP - CLEAN ANIMATED VERSION

   Features:
   - No V1-V32 text labels on map
   - Larger clickable vertex circles
   - Animated exploration
   - Bold animated final route
   - Start = Green
   - Destination = Red
   - Explored = Blue
   - Final Route = Pink
============================================================ */

const vertices = JSON.parse(
    document.getElementById("vertexData").textContent
);

const startSelect = document.getElementById("start");
const destinationSelect = document.getElementById("destination");
const algorithmSelect = document.getElementById("algorithm");

const findButton = document.getElementById("findRouteBtn");
const resetButton = document.getElementById("resetBtn");

const overlay = document.getElementById("routeOverlay");
const instructions = document.getElementById("mapInstructions");
const mapImage = document.getElementById("canberraMap");

const SVG_NS = "http://www.w3.org/2000/svg";

/* ============================================================
   ANIMATION SPEED SETTINGS

   Higher number = slower animation
   Lower number = faster animation
============================================================ */

const EXPLORE_DELAY = 170;
const ROUTE_DELAY = 280;

/* ============================================================
   STATE
============================================================ */

let start = "";
let destination = "";

let exploredNames = new Set();
let routeNames = new Set();

let routeData = [];

let animationToken = 0;

/* ============================================================
   SVG HELPER
============================================================ */

function svgElement(tag, attributes = {}) {

    const element = document.createElementNS(SVG_NS, tag);

    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }

    return element;
}

/* ============================================================
   DELAY HELPER
============================================================ */

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/* ============================================================
   UPDATE MAP INSTRUCTIONS
============================================================ */

function updateInstructions() {

    if (!start) {

        instructions.textContent =
            "Step 1: Click a circle to select your starting point.";

    } else if (!destination) {

        instructions.textContent =
            `Starting point: ${start}. Click another circle for your destination.`;

    } else {

        instructions.textContent =
            `${start} → ${destination}. Select an algorithm and click Find Route.`;
    }
}

/* ============================================================
   UPDATE SELECTED POINTS
============================================================ */

function updateSelectionDisplay() {

    document.getElementById("startResult").textContent =
        start || "—";

    document.getElementById("destinationResult").textContent =
        destination || "—";
}

/* ============================================================
   CLEAR PREVIOUS RESULTS
============================================================ */

function clearSearchResults() {

    // Cancel any previous animation
    animationToken++;

    exploredNames.clear();
    routeNames.clear();

    routeData = [];

    document.getElementById("searchStatus").textContent =
        "Ready to Search";

    document.getElementById("statusMessage").textContent =
        "Select your route and click Find Route.";

    const resultIDs = [
        "algorithmResult",
        "costResult",
        "visitedResult",
        "routeResult",
        "explorationResult"
    ];

    resultIDs.forEach(id => {
        document.getElementById(id).textContent = "—";
    });
}

/* ============================================================
   SELECT VERTEX FROM MAP
============================================================ */

function selectVertex(name) {

    if (!start) {

        start = name;

    } else if (!destination) {

        if (name === start) {
            instructions.textContent =
                "Please select a different destination.";
            return;
        }

        destination = name;

    } else {

        // Third click begins a new route selection
        start = name;
        destination = "";
    }

    startSelect.value = start;
    destinationSelect.value = destination;

    clearSearchResults();

    updateSelectionDisplay();
    updateInstructions();
    drawMap();
}

/* ============================================================
   DRAW THE MAP
============================================================ */

function drawMap() {

    overlay.replaceChildren();

    /* --------------------------------------
       DRAW FINAL ROUTE FIRST
       So circles appear on top of the line
    -------------------------------------- */

    if (routeData.length > 1) {

        const points = routeData
            .map(vertex => `${vertex.x},${vertex.y}`)
            .join(" ");

        // White outline underneath the pink route
        const routeOutline = svgElement("polyline", {
            points: points,
            fill: "none",
            stroke: "#ffffff",
            "stroke-width": 17,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "pointer-events": "none"
        });

        // Bold pink route
        const routeLine = svgElement("polyline", {
            points: points,
            fill: "none",
            stroke: "#df176c",
            "stroke-width": 11,
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "pointer-events": "none"
        });

        overlay.appendChild(routeOutline);
        overlay.appendChild(routeLine);
    }

    /* --------------------------------------
       DRAW ALL VERTICES
       NO TEXT LABELS
    -------------------------------------- */

    vertices.forEach(vertex => {

        let color = "#ffffff";
        let border = "#344054";

        // Explored vertex
        if (exploredNames.has(vertex.name)) {
            color = "#3988f5";
            border = "#ffffff";
        }

        // Vertex included in final route
        if (routeNames.has(vertex.name)) {
            color = "#df176c";
            border = "#ffffff";
        }

        // Starting point takes priority
        if (vertex.name === start) {
            color = "#16b86b";
            border = "#ffffff";
        }

        // Destination takes priority
        if (vertex.name === destination) {
            color = "#ef4444";
            border = "#ffffff";
        }

        const group = svgElement("g");

        /* Larger invisible clicking area */

        const hit = svgElement("circle", {
            cx: vertex.x,
            cy: vertex.y,
            r: 23,
            fill: "transparent",
            class: "vertex-hit"
        });

        hit.addEventListener("click", () => {
            selectVertex(vertex.name);
        });

        /* Visible larger circle */

        const dot = svgElement("circle", {
            cx: vertex.x,
            cy: vertex.y,
            r: 11,
            fill: color,
            stroke: border,
            "stroke-width": 3,
            class: "vertex-dot"
        });

        /* Tooltip appears when hovering */

        const tooltip = svgElement("title");

        tooltip.textContent =
            `${vertex.name} - Click to select this intersection`;

        group.appendChild(hit);
        group.appendChild(dot);
        group.appendChild(tooltip);

        overlay.appendChild(group);
    });
}

/* ============================================================
   DROPDOWN EVENTS
============================================================ */

startSelect.addEventListener("change", () => {

    start = startSelect.value;

    clearSearchResults();

    updateSelectionDisplay();
    updateInstructions();
    drawMap();
});

destinationSelect.addEventListener("change", () => {

    destination = destinationSelect.value;

    clearSearchResults();

    updateSelectionDisplay();
    updateInstructions();
    drawMap();
});

algorithmSelect.addEventListener("change", () => {

    clearSearchResults();

    updateSelectionDisplay();
    updateInstructions();
    drawMap();
});

/* ============================================================
   FIND ROUTE
============================================================ */

findButton.addEventListener("click", async () => {

    if (!start || !destination) {

        document.getElementById("searchStatus").textContent =
            "Incomplete Selection";

        document.getElementById("statusMessage").textContent =
            "Please select a starting point and destination.";

        return;
    }

    if (start === destination) {

        document.getElementById("searchStatus").textContent =
            "Invalid Selection";

        document.getElementById("statusMessage").textContent =
            "Starting point and destination must be different.";

        return;
    }

    clearSearchResults();

    const currentToken = animationToken;

    findButton.disabled = true;
    findButton.textContent = "Searching...";

    document.getElementById("searchStatus").textContent =
        "Searching...";

    try {

        /* --------------------------------------
           REQUEST SEARCH RESULT FROM FLASK
        -------------------------------------- */

        const response = await fetch("/find-route", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                start: start,
                destination: destination,
                algorithm: algorithmSelect.value
            })
        });

        const data = await response.json();

        if (currentToken !== animationToken) return;

        if (!response.ok || !data.success) {
            throw new Error(data.message || "No route found.");
        }

        /* --------------------------------------
           DISPLAY SEARCH INFORMATION
        -------------------------------------- */

        document.getElementById("algorithmResult").textContent =
            data.algorithm;

        document.getElementById("startResult").textContent =
            data.start;

        document.getElementById("destinationResult").textContent =
            data.destination;

        document.getElementById("costResult").textContent =
            Number(data.route_cost).toFixed(2);

        document.getElementById("visitedResult").textContent =
            data.visited_intersections;

        document.getElementById("routeResult").textContent =
            data.route.join(" → ");

        document.getElementById("explorationResult").textContent =
            data.exploration_order.join(" → ");

        /* --------------------------------------
           ANIMATE EXPLORED VERTICES
        -------------------------------------- */

        document.getElementById("searchStatus").textContent =
            "Exploring Vertices...";

        for (const name of data.exploration_order) {

            if (currentToken !== animationToken) return;

            exploredNames.add(name);

            drawMap();

            await sleep(EXPLORE_DELAY);
        }

        if (currentToken !== animationToken) return;

        /* --------------------------------------
           ANIMATE FINAL ROUTE STEP BY STEP
        -------------------------------------- */

        document.getElementById("searchStatus").textContent =
            "Drawing Final Route...";

        routeData = [];
        routeNames.clear();

        for (const vertex of data.route_coordinates) {

            if (currentToken !== animationToken) return;

            routeData.push(vertex);
            routeNames.add(vertex.name);

            drawMap();

            await sleep(ROUTE_DELAY);
        }

        if (currentToken !== animationToken) return;

        /* --------------------------------------
           FINISHED
        -------------------------------------- */

        document.getElementById("searchStatus").textContent =
            "Route Found!";

        document.getElementById("statusMessage").textContent =
            "The exploration and final route are now displayed.";

        instructions.textContent =
            `Final Route: ${data.route.join(" → ")}`;

    } catch (error) {

        if (currentToken !== animationToken) return;

        document.getElementById("searchStatus").textContent =
            "Search Failed";

        document.getElementById("statusMessage").textContent =
            error.message;

    } finally {

        if (currentToken === animationToken) {

            findButton.disabled = false;
            findButton.textContent = "Find Route";
        }
    }
});

/* ============================================================
   RESET MAP
============================================================ */

resetButton.addEventListener("click", () => {

    clearSearchResults();

    start = "";
    destination = "";

    startSelect.value = "";
    destinationSelect.value = "";

    algorithmSelect.selectedIndex = 0;

    findButton.disabled = false;
    findButton.textContent = "Find Route";

    document.getElementById("statusMessage").textContent =
        "Click a circle on the map or use the dropdowns.";

    updateSelectionDisplay();
    updateInstructions();
    drawMap();
});

/* ============================================================
   INITIALIZE MAP
============================================================ */

function setMapDimensions() {

    if (mapImage.naturalWidth && mapImage.naturalHeight) {

        overlay.setAttribute(
            "viewBox",
            `0 0 ${mapImage.naturalWidth} ${mapImage.naturalHeight}`
        );
    }
}

mapImage.addEventListener("load", setMapDimensions);

if (mapImage.complete) {
    setMapDimensions();
}

updateSelectionDisplay();
updateInstructions();
drawMap();


/* ==========================================================
   CANBERRA MAP - ZOOM CONTROLS
   Zooms the map image and SVG route overlay together.
   ========================================================== */

(function initializeMapZoom() {

    const viewport = document.getElementById("mapViewport");
    const wrapper = document.getElementById("mapWrapper");

    if (!viewport || !wrapper) {
        console.error("Map zoom: Map elements were not found.");
        return;
    }

    // Zoom configuration
    let zoomLevel = 1;

    const MIN_ZOOM = 1;
    const MAX_ZOOM = 3;
    const ZOOM_STEP = 0.25;

    // Create the toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "map-zoom-toolbar";

    toolbar.innerHTML = `
        <span class="zoom-title">Map Controls</span>

        <div class="zoom-buttons">
            <button type="button" id="zoomInBtn" title="Zoom In">
                +
            </button>

            <button type="button" id="zoomOutBtn" title="Zoom Out">
                −
            </button>

            <button type="button" id="resetZoomBtn" title="Reset Zoom">
                Reset Zoom
            </button>
        </div>

        <span id="zoomPercentage">100%</span>
    `;

    // Place the controls immediately above the map
    viewport.parentNode.insertBefore(toolbar, viewport);

    const zoomInBtn = document.getElementById("zoomInBtn");
    const zoomOutBtn = document.getElementById("zoomOutBtn");
    const resetZoomBtn = document.getElementById("resetZoomBtn");
    const zoomPercentage = document.getElementById("zoomPercentage");

    function updateZoom() {

        // Scale the map and its route overlay as one unit.
        wrapper.style.transform = `scale(${zoomLevel})`;
        wrapper.style.transformOrigin = "center center";

        zoomPercentage.textContent =
            `${Math.round(zoomLevel * 100)}%`;

        zoomInBtn.disabled = zoomLevel >= MAX_ZOOM;
        zoomOutBtn.disabled = zoomLevel <= MIN_ZOOM;
        resetZoomBtn.disabled = zoomLevel === 1;
    }

    // Zoom In
    zoomInBtn.addEventListener("click", function () {
        zoomLevel = Math.min(
            MAX_ZOOM,
            zoomLevel + ZOOM_STEP
        );

        updateZoom();
    });

    // Zoom Out
    zoomOutBtn.addEventListener("click", function () {
        zoomLevel = Math.max(
            MIN_ZOOM,
            zoomLevel - ZOOM_STEP
        );

        updateZoom();
    });

    // Reset Zoom
    resetZoomBtn.addEventListener("click", function () {
        zoomLevel = 1;
        updateZoom();
    });

    // Initialize at 100%
    updateZoom();

})();
