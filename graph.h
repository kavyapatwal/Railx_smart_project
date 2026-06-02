#pragma once
#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <limits>
#include <algorithm>
#include <sstream>
#include <iomanip>
#include <cmath>
#include <map>
#include <set>
using namespace std;

const int BASE_HOUR = 6, BASE_MINUTE = 0;

string toClockStr(double sim_mins) {
    int total = BASE_HOUR * 60 + BASE_MINUTE + (int)round(sim_mins);
    int h = (total / 60) % 24, m = total % 60;
    string period = (h < 12) ? "AM" : "PM";
    int dh = h % 12; if (dh == 0) dh = 12;
    ostringstream o;
    o << dh << ":" << setw(2) << setfill('0') << m << " " << period;
    return o.str();
}
enum class Priority { LOW = 1, NORMAL = 2, HIGH = 3 };
string priorityToStr(Priority p) {
    if (p == Priority::HIGH)   return "HIGH";
    if (p == Priority::NORMAL) return "NORMAL";
    return "LOW";
}
struct Train {
    int id; string name; 
    double speed, distance;
    Priority priority; 
    int source_node, dest_node;
    double eta, arrival_time, departure_time, stop_duration;
    int platform_assigned;
    vector<int> route;
    bool has_conflict, rerouted;
    string conflict_info, original_route_str;
    Train(int id, const string& name, double speed, double distance,Priority priority, int source_node)
        : id(id), name(name), speed(speed), distance(distance),
          priority(priority), source_node(source_node), dest_node(0),
          eta(0), arrival_time(0), departure_time(0), stop_duration(10),
          platform_assigned(-1), has_conflict(false), rerouted(false) {}
};

struct TrackUsage {
    int train_id, node_from, node_to;
    double time_enter, time_exit;
    string track_id;
};
struct Conflict {
    int train_a, train_b;
    string track_id;
    double overlap_start, overlap_end;
    string description;
};
struct Platform {
    int id; 
    string name;
    struct Window { 
        double arrive, depart; 
        int train_id; 
    };
    vector<Window> reservations;
};
struct Edge    { 
    int to; 
    double weight; 
    string track_id; 
};
struct Station { 
    int id; 
    string name; 
    double x, y; 
};

class RailwayGraph {
public:
    int num_nodes;
    vector<Station> stations;
    vector<vector<Edge>> adj;
    RailwayGraph() : num_nodes(0) {}
    void addStation(int id, const string& name, double x, double y) {
        if (id >= (int)stations.size()) {
            stations.resize(id + 1); adj.resize(id + 1);
            num_nodes = (int)stations.size();
        }
        stations[id] = {id, name, x, y};
    }
    void addEdge(int u, int v, double weight) {
        string tid = "T" + to_string(u) + "-" + to_string(v);
        adj[u].push_back({v, weight, tid});
        adj[v].push_back({u, weight, "T" + to_string(v) + "-" + to_string(u)});
    }
    void printGraph() const {
        cout << "\n[Graph] Station Network:\n";
        for (int i = 0; i < num_nodes; i++) {
            cout << "  [" << i << "] " << stations[i].name << " -> ";
            for (auto& e : adj[i])
                cout << stations[e.to].name << "(" << e.weight << "km) ";
            cout << "\n";
        }
    }
    static RailwayGraph buildDefault() {
        RailwayGraph g;
        g.addStation(0, "Main Station",   50, 50);
        g.addStation(1, "North Junction", 50, 25);
        g.addStation(2, "South Junction", 50, 75);
        g.addStation(3, "East Junction",  75, 50);
        g.addStation(4, "West Bypass",    25, 50);
        g.addStation(5, "North Entry",    50,  5);
        g.addStation(6, "South Entry",    50, 95);
        g.addStation(7, "East Entry",     95, 50);
        g.addEdge(5, 1,  8.0); g.addEdge(6, 2,  9.0); g.addEdge(7, 3,  6.0);
        g.addEdge(1, 0,  5.0); g.addEdge(2, 0,  6.0); g.addEdge(3, 0,  4.0);
        g.addEdge(4, 0,  7.0); g.addEdge(1, 4, 10.0); g.addEdge(2, 4, 11.0);
        g.addEdge(3, 1,  8.0);
        return g;
    }
};

