#pragma once
#include "graph.h"
void computeETAs(vector<Train>& trains) {
    cout << "\n[ETACalc] Computing ETAs...\n";
    for (auto& t : trains) {
        t.eta            = (t.distance / t.speed) * 60.0;
        t.arrival_time   = t.eta;
        t.departure_time = t.arrival_time + t.stop_duration;
        cout << "  " << t.name
             << " | dist=" << t.distance << "km speed=" << t.speed << "km/h"
             << " ETA=" << fixed << setprecision(1) << t.eta << "min"
             << " => arrives " << toClockStr(t.arrival_time) << "\n";
    }
}
bool platformFree(const Platform& p, double arrive, double depart, double buf = 1.5) {
    for (auto& w : p.reservations)
        if ((arrive - buf) < w.depart && (w.arrive - buf) < depart) return false;
    return true;
}

void allocatePlatforms(vector<Train>& trains, vector<Platform>& platforms) {
    cout << "\n[PlatformAllocator] Assigning platforms...\n";
    vector<Train*> sorted;
    for (auto& t : trains) sorted.push_back(&t);
    sort(sorted.begin(), sorted.end(),
        [](Train* a, Train* b){ return a->arrival_time < b->arrival_time; });

    for (auto* t : sorted) {
        bool assigned = false;
        vector<int> order;
        for (int i = 0; i < (int)platforms.size(); i++) order.push_back(i);
        if (t->priority == Priority::LOW) reverse(order.begin(), order.end());
        for (int pi : order) {
            if (platformFree(platforms[pi], t->arrival_time, t->departure_time)) {
                platforms[pi].reservations.push_back({t->arrival_time, t->departure_time, t->id});
                t->platform_assigned = platforms[pi].id;
                cout << "  " << t->name << " -> " << platforms[pi].name
                     << " [" << toClockStr(t->arrival_time)
                     << " - " << toClockStr(t->departure_time) << "]\n";
                assigned = true; break;
            }
        }
        if (!assigned) {
            auto& p = platforms[0];
            double last_end = 0;
            for (auto& w : p.reservations) last_end = max(last_end, w.depart);
            double wait = last_end - t->arrival_time + 1.5;
            t->arrival_time  += wait;
            t->departure_time = t->arrival_time + t->stop_duration;
            p.reservations.push_back({t->arrival_time, t->departure_time, t->id});
            t->platform_assigned = p.id;
            cout << "  " << t->name << " delayed -> Platform-1"
                 << " new arrival: " << toClockStr(t->arrival_time) << "\n";
        }
    }
}

void printSchedule(const vector<Platform>& platforms, const vector<Train>& trains) {
    map<int, string> nm;
    for (auto& t : trains) nm[t.id] = t.name;
    cout << "\n[Schedule] Final Platform Schedule:\n";
    for (auto& p : platforms) {
        cout << "  " << p.name << ":\n";
        auto res = p.reservations;
        sort(res.begin(), res.end(), [](auto& a, auto& b){ return a.arrive < b.arrive; });
        for (auto& w : res)
            cout << "    [" << toClockStr(w.arrive) << " to "
                 << toClockStr(w.depart) << "]  " << nm[w.train_id] << "\n";
        if (p.reservations.empty()) cout << "    (empty)\n";
    }
}
