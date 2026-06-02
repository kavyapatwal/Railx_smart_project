#pragma once
#include "graph.h"
#include <fstream>

string escJson(const string& s) {
    string out;
    for (char c : s) {
        if      (c == '"')  out += "\\\"";
        else if (c == '\\') out += "\\\\";
        else                out += c;
    }
    return out;
}

void exportJSON(const vector<Train>& trains, const RailwayGraph& g,const vector<Conflict>& conflicts,const vector<Platform>& platforms,const string& filepath) {
    ofstream f(filepath);
    if (!f.is_open()) { cerr << "Error: cant open " << filepath << "\n"; return; }
    f << fixed << setprecision(2) << "{\n";
    f << "  \"metadata\":{\"project\":\"RailFlow\",\"version\":\"1.0\","
      << "\"trains\":" << trains.size() << ",\"platforms\":" << platforms.size()
      << ",\"conflicts_detected\":" << conflicts.size() << "},\n";
    f << "  \"stations\":[\n";
    for (int i = 0; i < g.num_nodes; i++) {
        auto& s = g.stations[i];
        f << "    {\"id\":" << s.id << ",\"name\":\"" << escJson(s.name)
          << "\",\"x\":" << s.x << ",\"y\":" << s.y << "}";
        if (i + 1 < g.num_nodes) f << ","; f << "\n";
    }
    f << "  ],\n  \"edges\":[\n";
    set<string> seen; bool fe = true;
    for (int u = 0; u < g.num_nodes; u++) {
        for (auto& e : g.adj[u]) {
            string key = to_string(min(u,e.to)) + "-" + to_string(max(u,e.to));
            if (seen.count(key)) continue; seen.insert(key);
            if (!fe) f << ",\n";
            f << "    {\"from\":" << u << ",\"to\":" << e.to
              << ",\"weight\":" << e.weight << ",\"track_id\":\"" << escJson(e.track_id) << "\"}";
            fe = false;
        }
    }
    f << "\n  ],\n  \"trains\":[\n";
    for (int i = 0; i < (int)trains.size(); i++) {
        auto& t = trains[i];
        f << "    {\n"
          << "      \"id\":"                << t.id                                 << ",\n"
          << "      \"name\":\""            << escJson(t.name)                      << "\",\n"
          << "      \"speed\":"             << t.speed                              << ",\n"
          << "      \"distance\":"          << t.distance                           << ",\n"
          << "      \"priority\":\""        << priorityToStr(t.priority)            << "\",\n"
          << "      \"source_node\":"       << t.source_node                        << ",\n"
          << "      \"eta_mins\":"          << t.eta                                << ",\n"
          << "      \"arrival_mins\":"      << t.arrival_time                       << ",\n"
          << "      \"departure_mins\":"    << t.departure_time                     << ",\n"
          << "      \"arrival_time\":\""    << escJson(toClockStr(t.arrival_time))  << "\",\n"
          << "      \"departure_time\":\"" << escJson(toClockStr(t.departure_time)) << "\",\n"
          << "      \"stop_duration\":"     << t.stop_duration                      << ",\n"
          << "      \"platform_assigned\":" << t.platform_assigned                  << ",\n"
          << "      \"has_conflict\":"      << (t.has_conflict?"true":"false")      << ",\n"
          << "      \"rerouted\":"          << (t.rerouted?"true":"false")          << ",\n"
          << "      \"conflict_info\":\""   << escJson(t.conflict_info)             << "\",\n"
          << "      \"original_route\":\"" << escJson(t.original_route_str)         << "\",\n"
          << "      \"route\":[";
        for (int j = 0; j < (int)t.route.size(); j++) { if (j) f << ","; f << t.route[j]; }
        f << "]\n    }"; if (i+1<(int)trains.size()) f << ","; f << "\n";
    }
    f << "  ],\n  \"conflicts\":[\n";
    for (int i = 0; i < (int)conflicts.size(); i++) {
        auto& c = conflicts[i];
        f << "    {\n"
          << "      \"train_a\":"            << c.train_a                            << ",\n"
          << "      \"train_b\":"            << c.train_b                            << ",\n"
          << "      \"track_id\":\""         << escJson(c.track_id)                  << "\",\n"
          << "      \"overlap_start_mins\":" << c.overlap_start                      << ",\n"
          << "      \"overlap_end_mins\":"   << c.overlap_end                        << ",\n"
          << "      \"overlap_start\":\""    << escJson(toClockStr(c.overlap_start)) << "\",\n"
          << "      \"overlap_end\":\""      << escJson(toClockStr(c.overlap_end))   << "\",\n"
          << "      \"description\":\""      << escJson(c.description)               << "\"\n"
          << "    }"; if (i+1<(int)conflicts.size()) f << ","; f << "\n";
    }
    f << "  ],\n  \"platforms\":[\n";
    for (int i = 0; i < (int)platforms.size(); i++) {
        auto& p = platforms[i];
        f << "    {\"id\":" << p.id << ",\"name\":\"" << escJson(p.name) << "\",\"reservations\":[";
        for (int j = 0; j < (int)p.reservations.size(); j++) {
            if (j) f << ",";
            auto& r = p.reservations[j];
            f << "{\"train_id\":" << r.train_id
              << ",\"arrive_mins\":" << r.arrive << ",\"depart_mins\":" << r.depart
              << ",\"arrive\":\"" << escJson(toClockStr(r.arrive))
              << "\",\"depart\":\"" << escJson(toClockStr(r.depart)) << "\"}";
        }
        f << "]}"; if (i+1<(int)platforms.size()) f << ","; f << "\n";
    }
    f << "  ]\n}\n";
    f.close();
    cout << "\nExported to: " << filepath << "\n";
}
