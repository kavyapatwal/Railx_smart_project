📌 Project Overview

RailX is a smart railway management system designed to reduce short train delays (5–10 minutes) caused by inefficient real-time routing and platform allocation during peak hours.
The system models the entire railway network as a graph structure, where:
*Stations are treated as nodes.
*Tracks are edges.
*Trains are dynamic objects moving through the network.
Using graph algorithms and optimization techniques (DAA concepts), the system:
*Calculates estimated arrival times.
*Detects track and platform conflicts in advance.
*Dynamically assigns optimal tracks and platforms.
*Continuously updates routes in real-time.

Our project is RailX – Smart Track and Platform Mapping.
Railways often face short delays of 5 to 10 minutes during peak hours due to inefficient real-time routing and platform allocation. These small delays can accumulate and cause major disruptions.
To solve this, we designed a system that models the railway network using graph data structures, where stations are nodes and tracks are edges. Using graph algorithms and shortest path techniques, the system calculates optimal routes for trains in real time.
It continuously updates train positions, detects track or platform conflicts in advance, and dynamically assigns the best available platform. This helps prevent micro-delays and improves overall network efficiency.
Our system is built using C++ with STL components like vectors and priority queues, along with file handling for data storage and a frontend interface for user interaction.
RailX aims to reduce cascading delays, optimize resource utilization, and enhance passenger experience.
