#pragma once
#include "graph.h"
vector<int> dijkstra(const RailwayGraph& g, int src, int dst,vector<double>& dist_out) {
    const double INF = numeric_limits<double>::infinity();
    dist_out.assign(g.num_nodes, INF);
    vector<int> prev(g.num_nodes, -1);
    using P = pair<double, int>;
    priority_queue<P, vector<P>, greater<P>> pq;
    dist_out[src] = 0.0;
    pq.push(make_pair(0.0, src));
    while (!pq.empty()) {
        P top = pq.top(); pq.pop();
        double d = top.first;
        int u    = top.second;
        if (d > dist_out[u]) continue;
        if (u == dst) break;
        for (const auto& e : g.adj[u]) {
            double nd = dist_out[u] + e.weight;
            if (nd < dist_out[e.to]) {
                dist_out[e.to] = nd;
                prev[e.to] = u;
                pq.push(make_pair(nd, e.to));
            }
        }
    }
    vector<int> path;
    if (dist_out[dst] == numeric_limits<double>::infinity()) return path;
    for (int v = dst; v != -1; v = prev[v]) path.push_back(v);
    reverse(path.begin(), path.end());
    return path;
}
vector<int> dijkstraExclude(const RailwayGraph& g, int src, int dst,
    const vector<pair<int,int>>& blocked, vector<double>& dist_out) {
    const double INF = numeric_limits<double>::infinity();
    dist_out.assign(g.num_nodes, INF);
    vector<int> prev(g.num_nodes, -1);
    using P = pair<double, int>;
    priority_queue<P, vector<P>, greater<P>> pq;
    dist_out[src] = 0.0;
    pq.push(make_pair(0.0, src));
    while (!pq.empty()) {
        P top = pq.top(); pq.pop();
        double d = top.first;
        int u    = top.second;
        if (d > dist_out[u]) continue;
        if (u == dst) break;
        for (const auto& e : g.adj[u]) {
            bool blk = false;
            for (const auto& b : blocked)
                if ((u==b.first&&e.to==b.second)||(u==b.second&&e.to==b.first))
                    { blk = true; break; }
            if (blk) continue;
            double nd = dist_out[u] + e.weight;
            if (nd < dist_out[e.to]) {
                dist_out[e.to] = nd;
                prev[e.to] = u;
                pq.push(make_pair(nd, e.to));
            }
        }
    }
    vector<int> path;
    if (dist_out[dst] == INF) return path;
    for (int v = dst; v != -1; v = prev[v]) path.push_back(v);
    reverse(path.begin(), path.end());
    return path;
}
string pathStr(const vector<int>& path, const RailwayGraph& g) {
    string s;
    for (int i = 0; i < (int)path.size(); i++) {
        if (i) s += " -> ";
        s += g.stations[path[i]].name;
    }
    return s;
}
double routeCost(const vector<int>& path, const RailwayGraph& g) {
    double cost = 0;
    for (int i = 0; i + 1 < (int)path.size(); i++) {
        int u = path[i], v = path[i+1];
        for (const auto& e : g.adj[u]) if (e.to == v) { cost += e.weight; break; }
    }
    return cost;
}
void assignInitialRoutes(vector<Train>& trains, const RailwayGraph& g) {
    cout << "\n[Routing] Assigning routes via Dijkstra...\n";
    for (auto& t : trains) {
        vector<double> dist;
        t.route              = dijkstra(g, t.source_node, t.dest_node, dist);
        t.original_route_str = pathStr(t.route, g);
        cout << "  " << t.name << ": " << pathStr(t.route, g)
             << " (cost=" << routeCost(t.route, g) << ")\n";
    }
}
vector<TrackUsage> buildUsage(const Train& t, const RailwayGraph& g) {
    vector<TrackUsage> usage;
    double total = 0;
    for (int i = 0; i + 1 < (int)t.route.size(); i++) {
        int u = t.route[i], v = t.route[i+1];
        for (const auto& e : g.adj[u]) if (e.to == v) { total += e.weight; break; }
    }
    double cur = t.arrival_time - total;
    for (int i = 0; i + 1 < (int)t.route.size(); i++) {
        int u = t.route[i], v = t.route[i+1];
        double seg = 0; string tid;
        for (const auto& e : g.adj[u]) if (e.to == v) { seg = e.weight; tid = e.track_id; break; }
        usage.push_back({t.id, u, v, cur, cur + seg, tid});
        cur += seg;
    }
    return usage;
}
bool timeOverlaps(double a1, double a2, double b1, double b2, double buf = 2.0) {
    return (a1 - buf) < b2 && (b1 - buf) < a2;
}
bool sameTrack(int u1, int v1, int u2, int v2) {
    return (u1==u2&&v1==v2)||(u1==v2&&v1==u2);
}
vector<Conflict> detectConflicts(vector<Train>& trains, const RailwayGraph& g) {
    cout << "\n[ConflictDetector] Checking for conflicts...\n";
    vector<vector<TrackUsage>> all_usage;
    for (auto& t : trains) all_usage.push_back(buildUsage(t, g));
    vector<Conflict> conflicts;
    for (int i = 0; i < (int)trains.size(); i++) {
        for (int j = i + 1; j < (int)trains.size(); j++) {
            for (const auto& ua : all_usage[i]) {
                for (const auto& ub : all_usage[j]) {
                    if (sameTrack(ua.node_from, ua.node_to, ub.node_from, ub.node_to)) {
                        if (timeOverlaps(ua.time_enter, ua.time_exit, ub.time_enter, ub.time_exit)) {
                            Conflict c;
                            c.train_a = trains[i].id;
                            c.train_b       = trains[j].id;
                            c.track_id      = ua.track_id;
                            c.overlap_start = max(ua.time_enter, ub.time_enter);
                            c.overlap_end   = min(ua.time_exit,  ub.time_exit);
                            ostringstream oss;
                            oss << "Train " << trains[i].name << " & " << trains[j].name
                                << " conflict on " << ua.track_id
                                << " @ [" << toClockStr(c.overlap_start)
                                << " - "  << toClockStr(c.overlap_end) << "]";
                            c.description = oss.str();
                            conflicts.push_back(c);
                            trains[i].has_conflict = true;
                            trains[j].has_conflict = true;
                            if (trains[i].conflict_info.empty()) trains[i].conflict_info = c.description;
                            if (trains[j].conflict_info.empty()) trains[j].conflict_info = c.description;
                            cout << "  WARNING: " << c.description << "\n";
                        }
                    }
                }
            }
        }
    }
    if (conflicts.empty()) cout << "  No conflicts found.\n";
    return conflicts;
}

void resolveConflicts(vector<Train>& trains,const vector<Conflict>& conflicts,const RailwayGraph& g) {
    if (conflicts.empty()) return;
    cout << "\n[Routing] Resolving conflicts...\n";
    set<int> done;
    for (const auto& c : conflicts) {
        Train* ta = nullptr; Train* tb = nullptr;
        for (auto& t : trains) {
            if (t.id == c.train_a) ta = &t;
            if (t.id == c.train_b) tb = &t;
        }
        if (!ta || !tb) continue;
        Train* yield = nullptr;
        if ((int)ta->priority < (int)tb->priority)      yield = ta;
        else if ((int)tb->priority < (int)ta->priority) yield = tb;
        else yield = (ta->arrival_time > tb->arrival_time) ? ta : tb;
        if (done.count(yield->id)) continue;
        cout << "  " << yield->name << " must yield (priority="
             << priorityToStr(yield->priority) << ")\n";
        vector<pair<int,int>> blocked;
        for (const auto& cf : conflicts) {
            if (cf.train_a == yield->id || cf.train_b == yield->id) {
                for (int i = 0; i + 1 < (int)yield->route.size(); i++) {
                    int ru = yield->route[i], rv = yield->route[i+1];
                    for (const auto& e : g.adj[ru])
                        if (e.to == rv && e.track_id == cf.track_id)
                            blocked.push_back(make_pair(ru, rv));
                }
            }
        }
        vector<double> dist;
        auto new_route = dijkstraExclude(g, yield->source_node, yield->dest_node, blocked, dist);
        if (!new_route.empty()) {
            double delay          = routeCost(new_route, g) - routeCost(yield->route, g);
            yield->route          = new_route;
            yield->arrival_time  += delay;
            yield->departure_time = yield->arrival_time + yield->stop_duration;
            yield->rerouted = true; yield->has_conflict = false;
            cout << "  Rerouted " << yield->name << " -> " << pathStr(yield->route, g)
                 << " new arrival: " << toClockStr(yield->arrival_time) << "\n";
        } else {
            double delay = 0;
            for (const auto& cf : conflicts)
                if (cf.train_a == yield->id || cf.train_b == yield->id)
                    delay = max(delay, cf.overlap_end - cf.overlap_start + 3.0);
            yield->arrival_time  += delay;
            yield->departure_time = yield->arrival_time + yield->stop_duration;
            yield->rerouted = true; yield->has_conflict = false;
            cout << "  Delayed " << yield->name << " by " << delay
                 << " mins new arrival: " << toClockStr(yield->arrival_time) << "\n";
        }
        done.insert(yield->id);
    }
}
