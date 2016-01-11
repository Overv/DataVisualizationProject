"use strict";

var FIELD_WIDTH = 105;
var FIELD_HEIGHT = 68;

var data;
var COL_TIMESTAMP = 0;
var COL_ID = 1;
var COL_XPOS = 2;
var COL_YPOS = 3;
var COL_HEADING = 4;
var COL_DIRECTION = 5;
var COL_ENERGY = 6;
var COL_SPEED = 7;
var COL_TOTALDISTANCE = 8;
var COL_T = 9;

var UPDATE_INTERVAL_MS = 33;
var DATA_URL = 'https://raw.githubusercontent.com/Overv/DataVisualizationProject/master/html/data.csv';

var vis = d3.select('#field');

var xScale = d3.scale.linear()
    .domain([0, FIELD_WIDTH])
    .range([24, 550]);

var yScale = d3.scale.linear()
    .domain([0, FIELD_HEIGHT])
    .range([350, 9]);

function updatePositions(data) {
    // Update data
    var playerGroups = vis
        .selectAll('.player')
        .data(data);

    // Update existing players
    playerGroups
        .transition()
        .duration(UPDATE_INTERVAL_MS)
        .attr('transform', function(d) { return 'translate(' + xScale(d[COL_XPOS]) + ', ' + yScale(d[COL_YPOS]) + ')'; });

    // Add new players
    var newPlayerGroups = playerGroups
        .enter()
        .append('g')
        .attr('class', 'player')
        .attr('transform', function(d) { return 'translate(' + xScale(d[COL_XPOS]) + ', ' + yScale(d[COL_YPOS]) + ')'; })
        .on('click', function(d, i) {
            showPlayerStats(i);
        });

    newPlayerGroups.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 10);

    newPlayerGroups.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .style('font-family', 'sans-serif')
        .style('font-size', '12px')
        .style('fill', 'white')
        .text(function(d, i) { return i; });

    // Remove old data
    playerGroups
        .exit()
        .remove();
}

function showPlayerStats(tagid) {
    // TODO
}

function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
}

$.get(DATA_URL, function(csv) {
    var lines = csv.split('\n');
    lines = lines.map(function(l) {
        return l.split(',').map(function(v) {
            if (v.indexOf(' ') == -1) {
                return parseFloat(v);
            } else {
                var d = new Date(v);
                return d.getMinutes() * 60 + d.getSeconds();
            }
        });
    });
    lines.shift();

    data = lines;

    playPositions();
});

function playPositions() {
    var off = 0;

    var emptyData = data[0].map(function() { return 0; });
    emptyData[COL_XPOS] = -1000;
    emptyData[COL_YPOS] = -1000;

    var currentData = [];

    setInterval(function() {
        if (!data[off]) return;

        // Load next second
        var sec = data[off][COL_T];

        for (var i = off; i < data.length; i++) {
            if (data[i][COL_T] == sec) {
                // Ensure that players are always in the same order
                currentData[data[i][COL_ID]] = data[i];
            } else {
                // Set offset for next second
                off = i + 1;
                break;
            }
        }

        for (var i = 0; i < currentData.length; i++) {
            if (!currentData[i]) {
                currentData[i] = emptyData;
            }
        }

        updatePositions(currentData);
    }, UPDATE_INTERVAL_MS);
}