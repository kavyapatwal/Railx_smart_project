# RailXFlow Smart Routing System

RailXFlow is an intelligent railway traffic management and route optimization system designed to reduce train delays, avoid track conflicts, and improve network efficiency. The system uses graph algorithms and dynamic routing techniques to determine the most efficient path for trains in real time.

# Overview

RailXFlow models the railway network as a graph where,
Stations are represented as nodes (vertices),
Railway tracks are represented as edges,
Travel time or distance acts as edge weight.
The system continuously monitors train movements and updates route costs dynamically to ensure optimal train scheduling.

# Project Structure

| File              | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `main.cpp`        | Main execution and system control                    |
| `graph.h`         | Railway graph implementation                         |
| `dijkstra.h`      | Shortest path calculation using Dijkstra's Algorithm |
| `priorityqueue.h` | Min-Heap implementation for route selection          |
| `train.h`         | Train information management                         |
| `station.h`       | Station data structure                               |
| `export.h`        | JSON export functionality                            |
| `index.html`      | Interactive dashboard visualization                  |
| `output.json`     | Generated railway network data                       |


# How It Works
# 1. Railway Network Creation

The railway system is represented as a weighted graph.
Each edge stores:
Distance
Travel Time
Track Status

# 2. Route Optimization

When a train requests a route:
Dijkstra's Algorithm calculates the shortest path.
A Min-Heap Priority Queue selects the next station with minimum cost.
The algorithm continues until the destination is reached.
Why Dijkstra?
Efficient for positive edge weights.
Time Complexity:
O((V+E)logV)
where:
V = Number of Stations
E = Number of Tracks

O((V+E)logV)

# 3. Dynamic Weight Updates

As trains move:
Track occupancy changes.
Edge weights are updated dynamically.
Congested routes receive higher costs.
Alternative routes are automatically selected.

# 4. Conflict Detection

The system detects:
Multiple trains requesting the same track.
Potential collisions.
Congestion points.

Algorithms Used:

BFS (Breadth First Search)
DFS (Depth First Search)

These help analyze network connectivity and identify conflicts before they occur.

# 5. Data Export and Visualization

Railway network data is exported into JSON format.
The JSON data is displayed through an interactive HTML dashboard for route visualization and monitoring.

# Technologies Used
C++

Data Structures

Graph Theory

Dijkstra Algorithm

BFS / DFS

Priority Queue (Min-Heap)

JSON

HTML

CSS

JavaScript

# Example Results

The system evaluates route efficiency based on:

Total distance traveled

Estimated travel time

Number of stations traversed

Route conflicts detected

Network utilization

Sample Output

# Dataset
# Sample Dataset Structure

| Source Station | Destination Station | Distance (km) |
| -------------- | ------------------- | ------------- |
| Delhi          | Kota                | 450           |
| Kota           | Vadodara            | 520           |
| Vadodara       | Mumbai              | 410           |
| Delhi          | Jaipur              | 280           |



