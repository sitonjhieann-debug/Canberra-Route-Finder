
# ============================================================
# CITY / STREET GRAPH IMPLEMENTATION
# Data Structures and Algorithms
#
# Members:
# JHIE ANN N. SITON
# CHARMELE P. RICABLANCA
#
# Country: AUSTRALIA
# City: CANBERRA
# ============================================================

import heapq

class Vertex:

    def __init__(self, value, x, y):

        self.value = value
        self.x = x
        self.y = y

        # Compatibility with main.py
        self.X = x
        self.Y = y

class Graph:

    def __init__(self, size):

        self.size = size
        self.matrix = [[0] * size for i in range(size)]
        self.vertices = []


    def addVertex(self, v):

        if len(self.vertices) < self.size:
            self.vertices.append(v)


    def addEdge(self, v1, v2):

        b1 = self.vertices.index(v1)
        b2 = self.vertices.index(v2)

        self.matrix[b1][b2] = 1
        self.matrix[b2][b1] = 1


    # EUCLIDEAN DISTANCE

    def distance(self, v1, v2):

        return (
            (v2.x - v1.x) ** 2 +
            (v2.y - v1.y) ** 2
        ) ** 0.5


    # HEURISTIC

    def heuristic(self, current, goal):

        return self.distance(current, goal)

  
    # GET CONNECTED NEIGHBORS
   

    def neighbors(self, current):

        for neighbor in range(self.size):

            if self.matrix[current][neighbor] == 1:
                yield neighbor

   
    # UNIFORM COST SEARCH

    def ucs(self, start, goal):

        start_index = self.vertices.index(start)
        goal_index = self.vertices.index(goal)

        queue = [(0, start_index, [start_index])]

        visited = set()
        explored = []

        while queue:

            cost, current, path = heapq.heappop(queue)

            if current in visited:
                continue

            visited.add(current)
            explored.append(current)

            if current == goal_index:
                return path, cost, explored

            for neighbor in self.neighbors(current):

                if neighbor not in visited:

                    edge_cost = self.distance(
                        self.vertices[current],
                        self.vertices[neighbor]
                    )

                    new_cost = cost + edge_cost

                    heapq.heappush(
                        queue,
                        (
                            new_cost,
                            neighbor,
                            path + [neighbor]
                        )
                    )

        return None, float("inf"), explored

   
    # GREEDY BEST-FIRST SEARCH
  
    def greedy(self, start, goal):

        start_index = self.vertices.index(start)
        goal_index = self.vertices.index(goal)

        queue = [
            (
                self.heuristic(start, goal),
                start_index,
                [start_index],
                0
            )
        ]

        visited = set()
        explored = []

        while queue:

            h, current, path, cost = heapq.heappop(queue)

            if current in visited:
                continue

            visited.add(current)
            explored.append(current)

            if current == goal_index:
                return path, cost, explored

            for neighbor in self.neighbors(current):

                if neighbor not in visited:

                    neighbor_vertex = self.vertices[neighbor]

                    edge_cost = self.distance(
                        self.vertices[current],
                        neighbor_vertex
                    )

                    new_cost = cost + edge_cost

                    heuristic_value = self.heuristic(
                        neighbor_vertex,
                        goal
                    )

                    heapq.heappush(
                        queue,
                        (
                            heuristic_value,
                            neighbor,
                            path + [neighbor],
                            new_cost
                        )
                    )

        return None, float("inf"), explored

   
    # A* SEARCH
   

    def astar(self, start, goal):

        start_index = self.vertices.index(start)
        goal_index = self.vertices.index(goal)

        queue = [
            (
                self.heuristic(start, goal),
                0,
                start_index,
                [start_index]
            )
        ]

        best_g = {start_index: 0}
        explored = []

        while queue:

            f, g, current, path = heapq.heappop(queue)

            if g > best_g.get(current, float("inf")):
                continue

            explored.append(current)

            if current == goal_index:
                return path, g, explored

            for neighbor in self.neighbors(current):

                neighbor_vertex = self.vertices[neighbor]

                edge_cost = self.distance(
                    self.vertices[current],
                    neighbor_vertex
                )

                new_g = g + edge_cost

                if new_g < best_g.get(
                    neighbor, float("inf")
                ):

                    best_g[neighbor] = new_g

                    h = self.heuristic(
                        neighbor_vertex,
                        goal
                    )

                    new_f = new_g + h

                    heapq.heappush(
                        queue,
                        (
                            new_f,
                            new_g,
                            neighbor,
                            path + [neighbor]
                        )
                    )

        return None, float("inf"), explored


    # PRINT ADJACENCY MATRIX
    # OPTIONAL METHOD
    

    def print(self):

        print("     ", end="")

        for v in self.vertices:
            print(f"{v.value:>4}", end="")

        print()

        for i in range(self.size):

            print(
                f"{self.vertices[i].value:>4} ",
                end=""
            )

            for value in self.matrix[i]:
                print(f"{value:4}", end="")

            print()


# ==========================================
# CREATE CANBERRA GRAPH
# ==========================================

def create_canberra_graph():

    # ======================================
    # CREATE VERTICES
    # SITON & RICABLANCA COORDINATES
    # ======================================

    v1 = Vertex("V1", 323, 304)
    v2 = Vertex("V2", 379, 341)
    v3 = Vertex("V3", 434, 370)
    v4 = Vertex("V4", 490, 419)

    v5 = Vertex("V5", 401, 549)
    v6 = Vertex("V6", 337, 515)
    v7 = Vertex("V7", 274, 479)
    v8 = Vertex("V8", 220, 437)

    v9 = Vertex("V9", 118, 582)
    v10 = Vertex("V10", 61, 660)
    v11 = Vertex("V11", 111, 702)
    v12 = Vertex("V12", 174, 622)

    v13 = Vertex("V13", 232, 668)
    v14 = Vertex("V14", 327, 678)
    v15 = Vertex("V15", 416, 679)

    v16 = Vertex("V16", 411, 821)
    v17 = Vertex("V17", 324, 818)
    v18 = Vertex("V18", 232, 813)
    v19 = Vertex("V19", 131, 811)

    v20 = Vertex("V20", 120, 954)
    v21 = Vertex("V21", 115, 1026)
    v22 = Vertex("V22", 226, 952)

    v23 = Vertex("V23", 232, 877)
    v24 = Vertex("V24", 322, 877)
    v25 = Vertex("V25", 410, 879)

    v26 = Vertex("V26", 408, 965)
    v27 = Vertex("V27", 323, 965)

    v28 = Vertex("V28", 316, 1033)
    v29 = Vertex("V29", 276, 1033)
    v30 = Vertex("V30", 226, 1034)
    v31 = Vertex("V31", 407, 1035)
    v32 = Vertex("V32", 215, 1127)

    # ======================================
    # ADD VERTICES
    # ======================================

    graph = Graph(32)

    for v in [
        v1, v2, v3, v4, v5, v6, v7, v8,
        v9, v10, v11, v12, v13, v14, v15, v16,
        v17, v18, v19, v20, v21, v22, v23, v24,
        v25, v26, v27, v28, v29, v30, v31, v32
    ]:
        graph.addVertex(v)

    # ======================================
    # ADD EDGES
    # SITON & RICABLANCA CONNECTIONS
    # ======================================

    graph.addEdge(v1, v2)
    graph.addEdge(v1, v8)
    graph.addEdge(v2, v3)
    graph.addEdge(v2, v7)
    graph.addEdge(v3, v4)
    graph.addEdge(v3, v6)
    graph.addEdge(v4, v5)

    graph.addEdge(v5, v6)
    graph.addEdge(v5, v15)
    graph.addEdge(v6, v7)
    graph.addEdge(v6, v13)
    graph.addEdge(v7, v8)
    graph.addEdge(v7, v12)

    graph.addEdge(v8, v9)
    graph.addEdge(v9, v10)
    graph.addEdge(v9, v12)
    graph.addEdge(v10, v11)
    graph.addEdge(v11, v12)
    graph.addEdge(v11, v19)

    graph.addEdge(v12, v13)
    graph.addEdge(v13, v14)
    graph.addEdge(v13, v18)
    graph.addEdge(v14, v15)
    graph.addEdge(v14, v17)
    graph.addEdge(v15, v16)

    graph.addEdge(v16, v17)
    graph.addEdge(v17, v18)
    graph.addEdge(v18, v19)

    graph.addEdge(v18, v23)
    graph.addEdge(v17, v24)
    graph.addEdge(v16, v25)

    graph.addEdge(v19, v20)
    graph.addEdge(v20, v21)
    graph.addEdge(v20, v22)

    graph.addEdge(v22, v23)
    graph.addEdge(v22, v30)
    graph.addEdge(v23, v24)
    graph.addEdge(v24, v25)
    graph.addEdge(v25, v26)

    graph.addEdge(v26, v27)
    graph.addEdge(v26, v31)
    graph.addEdge(v27, v28)
    graph.addEdge(v28, v29)
    graph.addEdge(v29, v30)

    graph.addEdge(v30, v32)
    graph.addEdge(v31, v32)

    return graph


# ==========================================
# OPTIONAL TEST
# ==========================================

if __name__ == "__main__":

    graph = create_canberra_graph()

    print("CANBERRA STREET GRAPH")
    print("Total Vertices:", len(graph.vertices))

    total_edges = sum(
        sum(row) for row in graph.matrix
    ) // 2

    print("Total Edges:", total_edges)

    start = graph.vertices[0]   # V1
    goal = graph.vertices[31]   # V32

    algorithms = [
        ("Uniform Cost Search", graph.ucs),
        ("Greedy Best-First", graph.greedy),
        ("A* Search", graph.astar)
    ]

    for name, method in algorithms:

        path, cost, explored = method(start, goal)

        print("\n" + "=" * 40)
        print(name)
        print("=" * 40)

        if path:

            route = [
                graph.vertices[i].value
                for i in path
            ]

            exploration = [
                graph.vertices[i].value
                for i in explored
            ]

            print("Path:", " -> ".join(route))
            print("Total Cost:", round(cost, 2))
            print("Explored:", len(explored))
            print(
                "Exploration Order:",
                " -> ".join(exploration)
            )

        else:
            print("No available route.")