"use strict";

var FIELD_WIDTH = 105;
var FIELD_HEIGHT = 68;

var data;

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
        .duration(1000)
        .attr('transform', function(d) { return 'translate(' + xScale(d[0]) + ', ' + yScale(d[1]) + ')'; });

    // Add new players
    var newPlayerGroups = playerGroups
        .enter()
        .append('g')
        .attr('class', 'player')
        .attr('transform', function(d) { return 'translate(' + xScale(d[0]) + ', ' + yScale(d[1]) + ')'; })
        .on('click', function(d) {
            showPlayerStats(d[2]);
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
        .text(function(d) { return d[2]; });

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

$.get('data.csv', function(csv) {
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
});

/*var data = [];

setInterval(function() {
    for (var i = 0; i < 11; i++) {
        if (!data[i]) {
            data[i] = [
                Math.random() * FIELD_WIDTH / 2,
                Math.random() * FIELD_HEIGHT,
                i + 1
            ];
        } else {
            data[i][0] += Math.random() * 10 - 5;
            data[i][1] += Math.random() * 10 - 5;

            if (data[i][0] < 0) data[i][0] = -data[i][0];
            if (data[i][1] < 0) data[i][1] = -data[i][1];
            if (data[i][0] > FIELD_WIDTH) data[i][0] = 2*FIELD_WIDTH - data[i][0];
            if (data[i][1] > FIELD_HEIGHT) data[i][1] = 2*FIELD_HEIGHT - data[i][1];
        }
    }

    updatePositions(data);
}, 1000);*/