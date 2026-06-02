#include <iostream>
#include <vector>
#include <iomanip>
using namespace std;

#include "graph.h"    
#include "conflict.h"  
#include "platform.h"  
#include "export.h"     

int main() {
    cout << "=========================================\n";
    cout << " RailFlow: Smart Track & Platform Mapping\n";
    cout << " Simulation base time: 6:00 AM\n";
    cout << "=========================================\n";

    RailwayGraph g = RailwayGraph::buildDefault();
    g.printGraph();

    vector<Train> trains = {
        Train(1, "Rajdhani-12",  110, 77.0, Priority::HIGH,   5),
        Train(2, "Shatabdi-04",  90,  63.0, Priority::HIGH,   6),
        Train(3, "Express-07",   70,  56.0, Priority::NORMAL, 5),
        Train(4, "Local-19",     50,  40.0, Priority::LOW,    6),
        Train(5, "Intercity-22", 100, 60.0, Priority::HIGH,   7),
        Train(6, "Freight-31",   40,  42.0, Priority::LOW,    7),
    };

    computeETAs(trains);
    assignInitialRoutes(trains, g);
    auto conflicts = detectConflicts(trains, g);
    resolveConflicts(trains, conflicts, g);

    vector<Platform> platforms;
    for (int i = 0; i < 4; i++)
        platforms.push_back({i, "Platform-" + to_string(i+1), {}});

    allocatePlatforms(trains, platforms);
    printSchedule(platforms, trains);

    cout << "\n=========================================\n";
    cout << " FINAL SUMMARY\n";
    cout << "=========================================\n";
    cout << left
         << setw(4)  << "ID"   << setw(16) << "Name"
         << setw(8)  << "Priority" << setw(12) << "Arrives"
         << setw(12) << "Departs"  << setw(10) << "Platform"
         << setw(10) << "Status"
         << "\n" << string(72, '-') << "\n";

    for (auto& t : trains) {
        cout << setw(4)  << t.id
             << setw(16) << t.name
             << setw(8)  << priorityToStr(t.priority)
             << setw(12) << toClockStr(t.arrival_time)
             << setw(12) << toClockStr(t.departure_time)
             << setw(10) << ("P-" + to_string(t.platform_assigned + 1))
             << setw(10) << (t.rerouted ? "DELAYED" : "On Time")
             << "\n";
    }

    cout << "\nConflicts detected: " << conflicts.size() << "\n";
    exportJSON(trains, g, conflicts, platforms, "output.json");
    cout << "\nDone! Open index.html to view the dashboard.\n";
    return 0;
}

//  Compile:  g++ -std=c++17 -O2 -o railflow main.cpp
//  Run:      railflow
