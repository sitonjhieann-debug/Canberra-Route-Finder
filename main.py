
from flask import Flask, render_template, request, jsonify
from graph import create_canberra_graph

app = Flask(__name__)
graph = create_canberra_graph()

ALGORITHMS = {
    "Uniform Cost Search": graph.ucs,
    "Greedy Best-First": graph.greedy,
    "A* Search": graph.astar
}


@app.route("/")
def home():
    vertices = [v.value for v in graph.vertices]

    vertex_data = [
        {
            "name": v.value,
            "x": v.X,
            "y": v.Y
        }
        for v in graph.vertices
    ]

    return render_template(
        "index.html",
        vertices=vertices,
        vertex_data=vertex_data,
        algorithms=list(ALGORITHMS.keys())
    )


@app.route("/find-route", methods=["POST"])
def find_route():
    data = request.get_json(silent=True) or {}

    start_name = data.get("start")
    goal_name = data.get("destination")
    algorithm = data.get("algorithm")

    lookup = {v.value: v for v in graph.vertices}

    if start_name not in lookup:
        return jsonify(success=False, message="Select a valid starting point."), 400

    if goal_name not in lookup:
        return jsonify(success=False, message="Select a valid destination."), 400

    if start_name == goal_name:
        return jsonify(success=False, message="Choose two different vertices."), 400

    if algorithm not in ALGORITHMS:
        return jsonify(success=False, message="Select a valid algorithm."), 400

    path, cost, explored = ALGORITHMS[algorithm](
        lookup[start_name],
        lookup[goal_name]
    )

    if path is None:
        return jsonify(
            success=False,
            message="No available route was found."
        )

    def coordinate(index):
        vertex = graph.vertices[index]
        return {
            "name": vertex.value,
            "x": vertex.X,
            "y": vertex.Y
        }

    route = [graph.vertices[i].value for i in path]
    exploration = [graph.vertices[i].value for i in explored]

    return jsonify(
        success=True,
        algorithm=algorithm,
        start=start_name,
        destination=goal_name,
        route=route,
        route_text=" → ".join(route),
        intersections_in_route=len(route),
        visited_intersections=len(explored),
        route_cost=round(cost, 2),
        exploration_order=exploration,
        route_coordinates=[coordinate(i) for i in path],
        explored_coordinates=[coordinate(i) for i in explored],
        message="Route found successfully!"
    )


if __name__ == "__main__":
    app.run(debug=True)
