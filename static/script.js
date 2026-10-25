
/* ============================================================
   CANBERRA ROUTE FINDER
   EXPLORATION GRAPH + FINAL ROUTE ANIMATION

   Features:
   - Interactive clickable vertices
   - Animated exploration graph
   - Progressive sidebar results
   - Exploration edges disappear before final route
   - Animated pink final route
   - Zoom In / Zoom Out / Reset Zoom
   - Live zoom percentage
   - Start = Green
   - Destination = Red
   - Explored = Blue
   - Final Route = Pink
============================================================ */

/* ============================================================
   ELEMENTS
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
const mapWrapper = document.getElementById("mapWrapper");

const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const resetZoomBtn = document.getElementById("resetZoomBtn");
const zoomPercentage = document.getElementById("zoomPercentage");

const SVG_NS = "http://www.w3.org/2000/svg";

/* ============================================================
   ANIMATION SPEED
============================================================ */

const EXPLORE_DELAY = 220;
const EDGE_DELAY = 45;
const CLEAR_DELAY = 500;
const ROUTE_DELAY = 300;

/* ============================================================
   APPLICATION STATE
============================================================ */

let start = "";
let destination = "";

let exploredNames = new Set();
let routeNames = new Set();

let explorationEdges = [];
let explorationEdgeKeys = new Set();

let routeData = [];

let animationToken = 0;
let animationPhase = "idle";

/* ============================================================
   ZOOM SETTINGS
============================================================ */

let zoomLevel = 1;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

function applyZoom() {

    mapWrapper.style.transform =
        `scale(${zoomLevel})`;

    zoomInBtn.disabled = zoomLevel >= MAX_ZOOM;
    zoomOutBtn.disabled = zoomLevel <= MIN_ZOOM;

    zoomPercentage.textContent =
        `${Math.round(zoomLevel * 100)}%`;
}

zoomInBtn.addEventListener("click", () => {

    zoomLevel = Math.min(
        MAX_ZOOM,
        zoomLevel + ZOOM_STEP
    );

    applyZoom();
});

zoomOutBtn.addEventListener("click", () => {

    zoomLevel = Math.max(
        MIN_ZOOM,
        zoomLevel - ZOOM_STEP
    );

    applyZoom();
});

resetZoomBtn.addEventListener("click", () => {

    zoomLevel = 1;
    applyZoom();
});

/* ============================================================
   SVG HELPER
============================================================ */

function svgElement(tag, attributes = {}) {

    const element = document.createElementNS(
        SVG_NS,
        tag
    );

    for (const [key, value] of Object.entries(attributes)) {

        element.setAttribute(key, value);
    }

    return element;
}

/* ============================================================
   DELAY HELPER
============================================================ */

function sleep(ms) {

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
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
   CLEAR PREVIOUS SEARCH
============================================================ */

function clearSearchResults() {

    // Cancel previous animation.
    animationToken++;

    exploredNames.clear();
    routeNames.clear();

    explorationEdges = [];
    explorationEdgeKeys.clear();

    routeData = [];

    animationPhase = "idle";

    document.getElementById("searchStatus").textContent =
        "Ready to Search";

    document.getElementById("statusMessage").textContent =
        "Select your route and click Find Route.";

    [
        "algorithmResult",
        "costResult",
        "visitedResult",
        "routeResult",
        "explorationResult"
    ].forEach(id => {

        document.getElementById(id).textContent = "—";
    });

    findButton.disabled = false;
    findButton.textContent = "Find Route";
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

        // Third click starts another selection.
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
   DRAW EXPLORATION EDGE
============================================================ */

function drawExplorationEdge(edge) {

    const line = svgElement("line", {

        x1: edge.from.x,
        y1: edge.from.y,

        x2: edge.to.x,
        y2: edge.to.y,

        stroke: "#3988f5",
        "stroke-width": 5,

        "stroke-linecap": "round",

        opacity: 0.85,

        "pointer-events": "none"
    });

    return line;
}

/* ============================================================
   DRAW MAP
============================================================ */

function drawMap() {

    overlay.replaceChildren();

    /* --------------------------------------
       DRAW EXPLORATION GRAPH
    -------------------------------------- */

    if (animationPhase === "exploring") {

        explorationEdges.forEach(edge => {

            overlay.appendChild(
                drawExplorationEdge(edge)
            );
        });
    }

    /* --------------------------------------
       DRAW FINAL ROUTE
    -------------------------------------- */

    if (
        animationPhase === "route" ||
        animationPhase === "complete"
    ) {

        if (routeData.length > 1) {

            const points = routeData
                .map(v => `${v.x},${v.y}`)
                .join(" ");

            // White outline.

            const outline = svgElement("polyline", {

                points: points,

                fill: "none",
                stroke: "#ffffff",

                "stroke-width": 17,

                "stroke-linecap": "round",
                "stroke-linejoin": "round",

                "pointer-events": "none"
            });

            // Pink final route.

            const routeLine = svgElement("polyline", {

                points: points,

                fill: "none",
                stroke: "#df176c",

                "stroke-width": 11,

                "stroke-linecap": "round",
                "stroke-linejoin": "round",

                "pointer-events": "none"
            });

            overlay.appendChild(outline);
            overlay.appendChild(routeLine);
        }
    }

    /* --------------------------------------
       DRAW VERTICES
    -------------------------------------- */

    vertices.forEach(vertex => {

        let color = "#ffffff";
        let border = "#344054";

        // Explored vertex = Blue.

        if (
            animationPhase === "exploring" &&
            exploredNames.has(vertex.name)
        ) {

            color = "#3988f5";
            border = "#ffffff";
        }

        // Final route vertex = Pink.

        if (routeNames.has(vertex.name)) {

            color = "#df176c";
            border = "#ffffff";
        }

        // Starting point = Green.

        if (vertex.name === start) {

            color = "#16b86b";
            border = "#ffffff";
        }

        // Destination = Red.

        if (vertex.name === destination) {

            color = "#ef4444";
            border = "#ffffff";
        }

        const group = svgElement("g");

        /* INVISIBLE CLICKABLE AREA */

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

        /* VISIBLE VERTEX */

        const dot = svgElement("circle", {

            cx: vertex.x,
            cy: vertex.y,

            r: 11,

            fill: color,
            stroke: border,

            "stroke-width": 3,

            class: "vertex-dot"
        });

        /* TOOLTIP */

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
   ADD EXPLORATION EDGE
============================================================ */

function addExplorationEdge(edge) {

    if (
        !edge ||
        !edge.from ||
        !edge.to
    ) {
        return;
    }

    // Prevent duplicate undirected edges.

    const key = [
        edge.from.name,
        edge.to.name
    ].sort().join("-");

    if (explorationEdgeKeys.has(key)) {
        return;
    }

    explorationEdgeKeys.add(key);

    explorationEdges.push(edge);
}

/* ============================================================
   FIND ROUTE
============================================================ */

findButton.addEventListener("click", async () => {

    /* VALIDATE SELECTION */

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

        /* ======================================
           REQUEST RESULT FROM FLASK
        ====================================== */

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

        const contentType =
            response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {

            throw new Error(
                "Flask returned a non-JSON response. Check your Python server."
            );
        }

        const data = await response.json();

        if (currentToken !== animationToken) return;

        if (!response.ok || !data.success) {

            throw new Error(
                data.message || "No route found."
            );
        }

        /* ======================================
           VALIDATE RESPONSE
        ====================================== */

        if (
            !Array.isArray(data.route) ||
            !Array.isArray(data.exploration_order) ||
            !Array.isArray(data.route_coordinates) ||
            !Array.isArray(data.exploration_steps)
        ) {

            throw new Error(
                "Invalid animation data. Update main.py and restart Flask."
            );
        }

        /* ======================================
           INITIAL SIDEBAR INFORMATION

           Do not reveal final results yet.
        ====================================== */

        document.getElementById("algorithmResult").textContent =
            data.algorithm;

        document.getElementById("startResult").textContent =
            data.start;

        document.getElementById("destinationResult").textContent =
            data.destination;

        // Hide total cost until the route is finished.

        document.getElementById("costResult").textContent =
            "—";

        // Start visited counter at zero.

        document.getElementById("visitedResult").textContent =
            "0";

        // Hide final route.

        document.getElementById("routeResult").textContent =
            "—";

        // Hide exploration order until exploration ends.

        document.getElementById("explorationResult").textContent =
            "—";

        /* ======================================
           PHASE 1: EXPLORATION GRAPH
        ====================================== */

        animationPhase = "exploring";

        document.getElementById("searchStatus").textContent =
            "Exploring Graph...";

        document.getElementById("statusMessage").textContent =
            "Blue lines show graph connections around explored intersections.";

        // Store exploration order as it is animated.

        const animatedExploration = [];

        for (const step of data.exploration_steps) {

            if (currentToken !== animationToken) return;

            /* HIGHLIGHT EXPLORED VERTEX */

            exploredNames.add(step.vertex.name);

            animatedExploration.push(step.vertex.name);

            /* UPDATE LIVE VISITED COUNT */

            document.getElementById("visitedResult").textContent =
                animatedExploration.length;

            /* UPDATE EXPLORATION ORDER PROGRESSIVELY */

            document.getElementById("explorationResult").textContent =
                animatedExploration.join(" → ");

            drawMap();

            await sleep(EXPLORE_DELAY);

            if (currentToken !== animationToken) return;

            /* DRAW ADJACENT GRAPH EDGES */

            for (const edge of step.edges) {

                if (currentToken !== animationToken) return;

                addExplorationEdge(edge);

                drawMap();

                await sleep(EDGE_DELAY);
            }
        }

        if (currentToken !== animationToken) return;

        /* ======================================
           PHASE 2: EXPLORATION COMPLETED
        ====================================== */

        document.getElementById("searchStatus").textContent =
            "Exploration Complete!";

        document.getElementById("statusMessage").textContent =
            "Preparing the final route...";

        // Show the completed exploration results.

        document.getElementById("visitedResult").textContent =
            data.visited_intersections;

        document.getElementById("explorationResult").textContent =
            data.exploration_order.join(" → ");

        await sleep(CLEAR_DELAY);

        if (currentToken !== animationToken) return;

        /* REMOVE BLUE EXPLORATION GRAPH */

        explorationEdges = [];
        explorationEdgeKeys.clear();
        exploredNames.clear();

        animationPhase = "clearing";

        drawMap();

        await sleep(CLEAR_DELAY);

        if (currentToken !== animationToken) return;

        /* ======================================
           PHASE 3: ANIMATE FINAL PINK ROUTE
        ====================================== */

        animationPhase = "route";

        document.getElementById("searchStatus").textContent =
            "Drawing Final Route...";

        document.getElementById("statusMessage").textContent =
            "Highlighting the final selected route.";

        routeData = [];
        routeNames.clear();

        // Store route names as each vertex appears.

        const animatedRoute = [];

        for (const vertex of data.route_coordinates) {

            if (currentToken !== animationToken) return;

            routeData.push(vertex);

            routeNames.add(vertex.name);

            animatedRoute.push(vertex.name);

            /* UPDATE FINAL ROUTE PROGRESSIVELY */

            document.getElementById("routeResult").textContent =
                animatedRoute.join(" → ");

            drawMap();

            await sleep(ROUTE_DELAY);
        }

        if (currentToken !== animationToken) return;

        /* ======================================
           PHASE 4: SEARCH COMPLETED
        ====================================== */

        animationPhase = "complete";

        drawMap();

        // Reveal total route cost only when finished.

        document.getElementById("costResult").textContent =
            Number(data.route_cost).toFixed(2);

        // Display the complete final route.

        document.getElementById("routeResult").textContent =
            data.route.join(" → ");

        document.getElementById("searchStatus").textContent =
            "Route Found!";

        document.getElementById("statusMessage").textContent =
            "Search completed. The final route is highlighted in pink.";

        instructions.textContent =
            `Final Route: ${data.route.join(" → ")}`;

    } catch (error) {

        if (currentToken !== animationToken) return;

        document.getElementById("searchStatus").textContent =
            "Search Failed";

        document.getElementById("statusMessage").textContent =
            error.message;

        console.error("Route Finder Error:", error);

    } finally {

        if (currentToken === animationToken) {

            findButton.disabled = false;
            findButton.textContent = "Find Route";
        }
    }
});

/* ============================================================
   RESET APPLICATION
============================================================ */

resetButton.addEventListener("click", () => {

    clearSearchResults();

    start = "";
    destination = "";

    startSelect.value = "";
    destinationSelect.value = "";

    algorithmSelect.selectedIndex = 0;

    // Reset zoom to 100%.

    zoomLevel = 1;
    applyZoom();

    document.getElementById("statusMessage").textContent =
        "Click a circle on the map or use the dropdowns.";

    updateSelectionDisplay();
    updateInstructions();
    drawMap();
});

/* ============================================================
   MAP DIMENSIONS
============================================================ */

function setMapDimensions() {

    if (
        mapImage.naturalWidth &&
        mapImage.naturalHeight
    ) {

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

/* ============================================================
   INITIALIZE
============================================================ */

applyZoom();

updateSelectionDisplay();
updateInstructions();
drawMap();
