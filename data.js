// ═══════════════════════════════════════════════════════════
//  data.js — All static simulation data
// ═══════════════════════════════════════════════════════════

const BASE_H = 6, BASE_M = 0;
const SIM_END = 80; // simulation ends at 80 minutes

// Station node positions in SVG (viewBox 0 0 700 480)
const NODES = [
  {id:0, name:'Main Station',   x:350, y:240},
  {id:1, name:'North Junction', x:350, y:132},
  {id:2, name:'South Junction', x:350, y:348},
  {id:3, name:'East Junction',  x:495, y:240},
  {id:4, name:'West Bypass',    x:205, y:240},
  {id:5, name:'North Entry',    x:350, y:45 },
  {id:6, name:'South Entry',    x:350, y:435},
  {id:7, name:'East Entry',     x:611, y:240},
];

const EDGES = [
  {u:5,v:1,w:8}, {u:6,v:2,w:9}, {u:7,v:3,w:6},
  {u:1,v:0,w:5}, {u:2,v:0,w:6}, {u:3,v:0,w:4}, {u:4,v:0,w:7},
  {u:1,v:4,w:10},{u:2,v:4,w:11},{u:3,v:1,w:8},
];

const COLORS = ['#f5a623','#4a9eff','#39d353','#ff6b6b','#c084fc','#34d4c3'];

const TRAINS_DATA = [
  {
    id:1, name:'Rajdhani-12', speed:110, distance:77,
    priority:'HIGH', color:COLORS[0],
    source:5, route:[5,1,0],
    eta_mins:42, arrival_mins:42, departure_mins:52,
    arrival_time:'6:42 AM', departure_time:'6:52 AM',
    platform:1, rerouted:false,
    route_cost:13,
    depart_source:29, wait_duration:0,
    conflict_info:'Conflicts with Express-07 on T5-1 @ 6:35-6:37 AM',
  },
  {
    id:2, name:'Shatabdi-04', speed:90, distance:63,
    priority:'HIGH', color:COLORS[1],
    source:6, route:[6,2,0],
    eta_mins:42, arrival_mins:42, departure_mins:52,
    arrival_time:'6:42 AM', departure_time:'6:52 AM',
    platform:2, rerouted:false,
    route_cost:15,
    depart_source:27, wait_duration:0,
    conflict_info:'Conflicts with Local-19 on T6-2 @ 6:33-6:36 AM',
  },
  {
    id:3, name:'Express-07', speed:70, distance:56,
    priority:'NORMAL', color:COLORS[2],
    source:5, route:[5,1,0],
    eta_mins:48, arrival_mins:53, departure_mins:63,
    arrival_time:'6:53 AM', departure_time:'7:03 AM',
    platform:0, rerouted:true,
    route_cost:13,
    depart_source:40, wait_duration:5, wait_start:35,
    conflict_info:'DELAYED 5 min — conflict with Rajdhani-12 on T5-1',
  },
  {
    id:4, name:'Local-19', speed:50, distance:40,
    priority:'LOW', color:COLORS[3],
    source:6, route:[6,2,0],
    eta_mins:48, arrival_mins:54, departure_mins:64,
    arrival_time:'6:54 AM', departure_time:'7:04 AM',
    platform:3, rerouted:true,
    route_cost:15,
    depart_source:39, wait_duration:6, wait_start:33,
    conflict_info:'DELAYED 6 min — conflict with Shatabdi-04 on T6-2',
  },
  {
    id:5, name:'Intercity-22', speed:100, distance:60,
    priority:'HIGH', color:COLORS[4],
    source:7, route:[7,3,0],
    eta_mins:36, arrival_mins:36, departure_mins:46,
    arrival_time:'6:36 AM', departure_time:'6:46 AM',
    platform:0, rerouted:false,
    route_cost:10,
    depart_source:26, wait_duration:0,
    conflict_info:'',
  },
  {
    id:6, name:'Freight-31', speed:40, distance:42,
    priority:'LOW', color:COLORS[5],
    source:7, route:[7,3,0],
    eta_mins:63, arrival_mins:63, departure_mins:73,
    arrival_time:'7:03 AM', departure_time:'7:13 AM',
    platform:2, rerouted:false,
    route_cost:10,
    depart_source:53, wait_duration:0,
    conflict_info:'',
  },
];

const CONFLICTS_DATA = [
  {a:1,b:3,track:'T5-1',ts:35,te:37,edge:{u:5,v:1}},
  {a:2,b:4,track:'T6-2',ts:33,te:36,edge:{u:6,v:2}},
];

const PLATFORMS_DATA = [
  {id:0,name:'Platform-1',trains:[
    {tid:5,arrive_mins:36,depart_mins:46,arrive:'6:36 AM',depart:'6:46 AM'},
    {tid:3,arrive_mins:53,depart_mins:63,arrive:'6:53 AM',depart:'7:03 AM'},
  ]},
  {id:1,name:'Platform-2',trains:[
    {tid:1,arrive_mins:42,depart_mins:52,arrive:'6:42 AM',depart:'6:52 AM'},
  ]},
  {id:2,name:'Platform-3',trains:[
    {tid:2,arrive_mins:42,depart_mins:52,arrive:'6:42 AM',depart:'6:52 AM'},
    {tid:6,arrive_mins:63,depart_mins:73,arrive:'7:03 AM',depart:'7:13 AM'},
  ]},
  {id:3,name:'Platform-4',trains:[
    {tid:4,arrive_mins:54,depart_mins:64,arrive:'6:54 AM',depart:'7:04 AM'},
  ]},
];

const TIME_SAVED = [
  {name:'Express-07',  color:COLORS[2], delay_with:5,  delay_without:18, saved:13, orig:'6:48 AM', actual:'6:53 AM'},
  {name:'Local-19',    color:COLORS[3], delay_with:6,  delay_without:21, saved:15, orig:'6:48 AM', actual:'6:54 AM'},
];
const TOTAL_SAVED = 28;
