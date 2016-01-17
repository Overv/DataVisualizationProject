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

var UPDATE_INTERVAL_MS = 16;
var DATA_URL = 'https://raw.githubusercontent.com/Overv/DataVisualizationProject/master/html/data.csv';

var vis = d3.select('#field');

var w = vis[0][0].offsetWidth;
var h = vis[0][0].offsetHeight;

var xScale = d3.scale.linear()
    .domain([0, FIELD_WIDTH])
    .range([w * 0.0426, w * 0.9565]);

var yScale = d3.scale.linear()
    .domain([0, FIELD_HEIGHT])
    .range([h * 0.9722, h * 0.0264]);

var x3DScale = d3.scale.linear()
    .domain([0, FIELD_WIDTH])
    .range([-20.833/2, 20.833/2]);

var y3DScale = d3.scale.linear()
    .domain([0, FIELD_HEIGHT])
    .range([13.922/2, -13.922/2]);

var colorScale = d3.scale.linear()
    .domain([0, 0.6, 1])
    .range(['blue', 'yellow', 'red']);

var currentFrame = 0;
var firstFrame, lastFrame;
var draggingSlider = false;
var paused = false;

var hidden = false;

//noone is selected at the beginning
var selectedPlayer;

// 3D meshes representing the different heatmaps
var heatmapMeshes = {};

var playerDetails = {"1":{"name":"Zeki","sur":"Fryers","db":"9 Sep 1992 (Age 23)","nation":"England","height":"183 cm.","weight":"77 Kg.","pos":"Left Back","shirtno":"35"},
                     "2":{"name":"Kyle","sur":"Naughton","db":"11 Nov 1988 (Age 27)","nation":"England","height":"181 cm.","weight":"73 Kg.","pos":"Right Back","shirtno":"25"},
                     "4":{"name":"Michael","sur":"Dawson","db":"18 Nov 1983 (Age 32)","nation":"England","height":"188 cm.","weight":"79 kg.","pos":"Center Back","shirtno":"5"},
                     "5":{"name":"Roberto","sur":"Soldado","db":"27 May 1985 (Age 30)","nation":"Spain","height":"176 cm.","weight":"73 kg.","pos":"Forward/Striker","shirtno":"9"},
                     "6":{"name":"Andros","sur":"Townsend","db":"16 Jul 1990 (Age 25)","nation":"England","height":"183 cm.","weight":"77 kg.","pos":"Right Winger","shirtno":"17"},
                     "8":{"name":"Gylfi","sur":"Sigurdsson","db":"9 Sep 1989 (Age 26)","nation":"Iceland","height":"186 cm.","weight":"75 kg.","pos":"Left Winger","shirtno":"-"},
                     "11":{"name":"Mousa","sur":"Dembele","db":"17 Jul 1987 (Age 29)","nation":"Belgium","height":"183 cm.","weight":"78 Kg.","pos":"Midfielder","shirtno":"19"},
                     "12":{"name":"Naser","sur":"Chadli","db":"2 Sep 1989 (Age 26)","nation":"Belgium","height":"188 cm.","weight":"85 kg.","pos":"Attacking Midfielder","shirtno":"21"},
                     "14":{"name":"Vlad lulian","sur":"Chiriches","db":"15 Nov 1989 (age 26)","nation":"Romania","height":"183 cm.","weight":"75 kg.","pos":"Center Back","shirtno":"6"},
                    };

//the values are percentages
var radarData={
    labels: ["Pass Accuracy","Shot Accuracy","Cross Accuracy","Successful take ons","Tackle Accuracy"],
    datasets: [
        {
            label: "Tottenham",
            fillColor: "rgba(220,220,220,0.2)",
            strokeColor: "rgba(220,220,220,1)",
            pointColor: "rgba(220,220,220,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(220,220,220,1)",
            data: [87,14,16,58,75]
        },
        {
            label: "Tromso",
            fillColor: "rgba(123, 220, 162, 0.2)",
            strokeColor: "rgba(123, 220, 162, 1)",
            pointColor: "rgba(123, 220, 162, 1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(123, 220, 162, 1);",
            data: [68,42,25,25,75]
        }
    ]
};

var barData = {
    labels: ["pl1", "pl2", "pl3", "pl4", "pl5", "pl6", "pl7","pl8"],
    datasets: [
        {
            label: "Player Names",
            fillColor: "rgba(245, 112, 139, 0.6)",
            strokeColor: "rgba(245, 112, 139, 0.9)",
            highlightFill: "rgba(220,220,220,0.75)",
            highlightStroke: "rgba(220,220,220,1)",
            data: [0, 0, 0, 0, 0, 0, 0, 0]
        }
    ]
};

//Radar Code Chart.js
var options={
  legendTemplate :  "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"back,ground-color:<%=datasets[i].fillColor%>\"><%if(datasets[i].label){%><%=datasets[i].label%></span><%}%></li><%}%></ul>",
  scaleOverride: true,
    scaleSteps: 10,
    scaleStepWidth: 10,
    scaleStartValue: 0,
    animation: false,
    angleLineColor : "rgba(255, 255, 255, 0.3)",
    pointLabelFontColor : "rgba(255, 255, 255, 0.8)",
    scaleLineColor: "rgba(255, 255, 255, 0.3)"
  };


// display the the radar chart
var radarCanvas =document.getElementById("radarChart");
var ctxr=radarCanvas.getContext("2d");
var newChart = new Chart(ctxr);
var radarChart = newChart.Radar(radarData,options);

//display the bar chart 
var barCanvas = document.getElementById("barChart");
var ctxb = barCanvas.getContext("2d");
var newChart1 = new Chart(ctxb);
var barChart = newChart1.Bar(barData, {animationSteps: 5});

function updatePositions(data, instanttransition) {
    // Update data
    var playerGroups = vis
        .selectAll('.player')
        .data(data);

    // Update existing players
    playerGroups
        .transition()
        .ease('linear')
        .duration(instanttransition ? 33 : (2000 / $('#control-speed').val()))
        .attr('transform', function(d) { return 'translate(' + xScale(d[COL_XPOS]) + ', ' + yScale(d[COL_YPOS]) + ')'; })
        .attr('data-x', function(d) { return d[COL_XPOS]; })
        .attr('data-y', function(d) { return d[COL_YPOS]; })
        .attrTween('data-direction', function(d, i, a) {
            a = +a;

            var angDiffDeg = (d[COL_DIRECTION] - a) / Math.PI * 180;
            var shortestAngle = (((angDiffDeg % 360) + 540) % 360) - 180;
            var shortestAngleRad = shortestAngle / 180 * Math.PI;

            return d3.interpolate(a, a + shortestAngleRad);
        });

    // Add new players
    var newPlayerGroups = playerGroups
        .enter()
        .append('g')
        .attr('class', 'player')
        .attr('transform', function(d) { return 'translate(' + xScale(d[COL_XPOS]) + ', ' + yScale(d[COL_YPOS]) + ')'; })
        .attr('data-x', function(d) { return d[COL_XPOS]; })
        .attr('data-y', function(d) { return d[COL_YPOS]; })
        .attr('data-direction', function(d) { return d[COL_DIRECTION]; })
        .attr('data-id', function(d) { return d[COL_ID]; })
        .on('click', function(d, i) {
            if (selectedPlayer == i || !playerDetails[i]) {
                i = null;
            }

            updateCard(i);
            showPlayerStats(i);
        });

    newPlayerGroups.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 10)
        .attr('stroke', 'white')
        .attr('stroke-width', '0')
        .style("fill",function(d,i){return playerPosColor(i);});

    newPlayerGroups.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .style('font-family', 'sans-serif')
        .style('font-size', '12px')
        .style('fill', "black")
        .text(function(d, i) { return playerPosText(i); });
    // Remove old data
    playerGroups
        .exit()
        .remove();
}

function disableSelection(){
	showPlayerStats(null);
}

function hideGraphs(){
	d3.select("#barContainer").style("display","none");
	d3.select("#playerStatsContainer").style("display","none");

}

function showGraphs(){
	d3.select("#barContainer").style("display","block");
	d3.select("#playerStatsContainer").style("display","block");
}

function playerPosText(noPlayer){
        switch(noPlayer){
            case 12:
            case 5:
                return "FW";
            case 11:
                return "MF";

            case 6:
            case 8:
                return "WG";
            case 2:
                return "RB";
            case 1:
                return "LB";
            case 14:
            case 4:
                return "CB";
            default:
                return noPlayer;
        }
}

function playerPosColor(noPlayer){
        switch(noPlayer){
            case 12:
            case 5:
                return "#FE2E2E";
            case 11:
                return "#2E64FE";

            case 6:
            case 8:
                return "red";
            case 2:
                return "#D7DF01";
            case 1:
                return "#D7DF01";
            case 14:
            case 4:
                return "#D7DF01";
            default:
                return "black";
        }
}

function distanceToOthers(tagid){
    //make it show the data at first
    //depending on the the player selected we want for that 
    //time frame the positions of this player to all other players
    //Get the second from the field visualization
    var curSec = Math.floor(currentFrame);
    var AllPlayersPositions = data.filter(function (row) {return row[COL_TIMESTAMP]==curSec});
    var playingPlayersPos = []
    for (var index=0 ; index<AllPlayersPositions.length; index++){
        // get the id of the player from the 2d array
        var chosenPlayer;
        var id = AllPlayersPositions[index][1];
        if (playerDetails[id]){
            
            var x_pos = AllPlayersPositions[index][2];
            var y_pos = AllPlayersPositions[index][3];
            if (id==tagid){
                chosenPlayer=[tagid,x_pos,y_pos];
            }
            //the positions should be sorted to the playing players ids 
            playingPlayersPos.push([id,x_pos,y_pos]);
        }
    }
    var distanceData=[]
    for (var i=0 ; i<playingPlayersPos.length ; i++){
        if (playingPlayersPos[i][0] == tagid){
            continue;
        }
        else{
            var dx= playingPlayersPos[i][1] - chosenPlayer[1];
            var dy= playingPlayersPos[i][2] - chosenPlayer[2];
            var distance = Math.sqrt( dx*dx + dy*dy);
            distanceData.push([playingPlayersPos[i][0],distance]);
        }
    }
    var xLabels = [];


    for (var i = 0 ; i<distanceData.length; i++){
        xLabels.push(playerDetails[distanceData[i][0]].sur);
        barChart.datasets[0].bars[i].value = distanceData[i][1];
    }
    barChart.scale.xLabels=xLabels;
    barChart.update();


}

function showPlayerStats(tagid) {
    if (tagid) {
        showGraphs();
    } else {
        hideGraphs();
    }

    selectedPlayer=tagid;

    // Update selection circle
    $('.player').each(function() {
        var id = +this.getAttribute('data-id');

        if (id == tagid) {
            $(this).find('circle').attr('stroke-width', '3px');
        } else {
            $(this).find('circle').attr('stroke-width', '0');
        }
    });

    if (tagid) {
        distanceToOthers(tagid);
    }

    if (tagid) {
        // TODO
        //d3.select("svg.parent").selectAll("*").remove();
        d3.select("#stats").remove();
        d3.select("#playerStatsContainer")
           .append("div")
           .attr("id","stats");

        //Append a selection box to change between total distance 
        // and speed of the player per minute
        //d3.select("#selList").node().value == "Total_Distance"
        var stats = d3.select("#stats")
        stats.append("select")
             .attr("id","selList")
             .on("click",function(){changeGraph(tagid);});
        
        var list = d3.select("#selList");

        list.append("option")
            .attr("value","Total_Distance")
            .text("Total_Distance");

        list.append("option")
            .attr("value","Speed")
            .text("Speed");

        list.append("option")
            .attr("value","Energy_Consumed")
            .text("Energy_Consumed");


        

        //the option of the user in the selection box
        changeGraph(tagid);


        // the player's timestamp is in seconds from the start of the game
    }

    updateHeatmapSelection();

    // Update 3D player selection
    $('g.player').each(function() {
        var id = +this.getAttribute('data-id');

        if (id == tagid) {
            this.selectMesh.visible = true;
        } else {
            this.selectMesh.visible = false;
        }
    });
}

// a function to update the player's details in the card
function updateCard(tagid){
    if (tagid) {
        d3.select("#playerTable").style("display","block");
        d3.select("#playerName").text(playerDetails[tagid].name+" "+playerDetails[tagid].sur);
        d3.select("#playerBirth").text(playerDetails[tagid].db);
        d3.select("#playerNation").text(playerDetails[tagid].nation);
        d3.select("#playerHeight").text(playerDetails[tagid].height);
        d3.select("#playerWeight").text(playerDetails[tagid].weight);
        d3.select("#playerPos").text(playerDetails[tagid].pos);
        d3.select("#playerNumber").text(playerDetails[tagid].shirtno);
    }
}


function changeGraph(tagid){

    d3.select("#statsGraph").remove();
    

    var margin = {top:20, right:20, bottom:30, left:50},
        width=600 - margin.left-margin.right,
        height=300 - margin.top - margin.bottom;
    var option = d3.select("#selList").node().value;
    
    var playerIdData = data.filter(function (row) {return row[COL_ID]==tagid});
    
    var playerData=[];
    if (option =="Total_Distance"){
        
        var previousMin = Math.floor(playerIdData[0][COL_TIMESTAMP] / 60);
        playerData.push([previousMin,playerIdData[0][COL_TOTALDISTANCE]]);

        for (var i=0 ; i<playerIdData.length; i++){
            var curMin = Math.floor(playerIdData[i][COL_TIMESTAMP] / 60);
            if(!(curMin==previousMin)){
                playerData.push([curMin,playerIdData[i][COL_TOTALDISTANCE]]);
                previousMin=curMin;
            }
        }
    }
    else if (option=="Speed"){
        var points = [];
        var quantity = [];

        for (var i = 0; i < playerIdData.length; i++) {
            var curMin = Math.floor(playerIdData[i][COL_TIMESTAMP] / 60);

            if (!points[curMin]) {
                points[curMin] = 0;
                quantity[curMin] = 0;
            }

            points[curMin] += playerIdData[i][COL_SPEED];
            quantity[curMin]++;
        }

        // Average and add to graph
        var playerData = [];

        for (var i = 0; i < points.length; i++) {
            if (!points[i]) {
                points[i] = 0;
            }

            if (quantity[i]) {
                points[i] = points[i] / quantity[i];
                playerData.push([i, points[i]]);
            }
        }
    }
    else if (option=="Energy_Consumed"){
        
        var previousMin = Math.floor(playerIdData[0][COL_TIMESTAMP] / 60);
        playerData.push([previousMin,playerIdData[0][COL_ENERGY]]);

        for (var i=0 ; i<playerIdData.length; i++){
            var curMin = Math.floor(playerIdData[i][COL_TIMESTAMP] / 60);
            if(!(curMin==previousMin)){
                playerData.push([curMin,playerIdData[i][COL_ENERGY]]);
                previousMin=curMin;
            }
        }
    }


    var xStatScale = d3.scale.linear()
                        .range([0,width]);
    var yStatScale = d3.scale.linear()
                        .range([height,0]);

    var xAxis = d3.svg.axis()
                   .scale(xStatScale)
                   .orient("bottom").ticks(20);
    var yAxis = d3.svg.axis()
                  .scale(yStatScale)
                  .orient("left");
    //select the data that are going to be shown here
    var line = d3.svg.line()
                 .x(function(d) {return xStatScale(d[0])})
                 .y(function(d) {return yStatScale(d[1])});

    var lineSvg = d3.select("#stats")
                    .append("svg")
                    .attr("id","statsGraph")
                    .attr("width", width+margin.left+margin.right)
                    .attr("height", height+margin.top+margin.bottom)
                    .append("g")
                    .attr("transform","translate("+margin.left+","+margin.top+")");

    xStatScale.domain(d3.extent(playerData,function(d) {return d[0]}));
    yStatScale.domain(d3.extent(playerData,function(d) {return d[1]}));

    var focus = lineSvg.append("g")
                      .style("display","none");

    var bisectMinute = d3.bisector(function(d) { return d[0];}).left

    lineSvg.append("g")
            .attr("class","x axis")
            .attr("transform","translate(0,"+height+")")
            .call(xAxis)
            .append("text")
            .attr("x",510)
            .attr("dy","-8px")
            .style("text-anchor","end")
            .text("Minute");

    lineSvg.append("g")
            .attr("class","y axis")
            .call(yAxis)
            .append("text")
            .attr("transform","rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor","end")
            //.text("Total_Distance");
            .text(option);

    lineSvg.append("path")
           .datum(playerData)
           .attr("class","line")
           .attr("d",line);

    focus.append("circle")
         .attr("class","y")
         .style("fill","none")
         .style("stroke","blue")
         .attr("r",4);

    lineSvg.append("rect")
           .attr("width",width)
           .attr("height", height)
           .style("fill", "none")
           .style("pointer-events", "all") 
           .on("mouseover", function() { focus.style("display", null); })
           .on("mouseout", function() { focus.style("display", "none"); })
           .on("mousemove", mousemove)
           .on("mousedown", function() { draggingSlider = true; })
           .on("mouseup", function() { draggingSlider = false; })
           .on("click", function() {
                var x0 = xStatScale.invert(d3.mouse(this)[0]);

                currentFrame = x0 * 60;
                updatePlaybackSlider(true);
           });

     function mousemove() {                     
        var x0 = xStatScale.invert(d3.mouse(this)[0]),
            i = bisectMinute(playerData, x0, 1),
            d0 = playerData[i - 1],
            d1 = playerData[i],
            d = x0 - d0[0] > d1[0] - x0 ? d1 : d0;
        focus.select("circle.y")
            .attr("transform",
                  "translate(" + xStatScale(d[0]) + "," + 
                                 yStatScale(d[1]) + ")");
         // Focus dashed lines added
    //append the x dashed line
    focus.append("line")
        .attr("class", "xdashed")
        .style("stroke", "blue")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("y1", 0)
        .attr("y2", height);

    // append the y dashed line
    focus.append("line")
        .attr("class", "ydashed")
        .style("stroke", "blue")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("x1", width)
        .attr("x2", width);

    // place the x value at the intersection
    focus.append("text")
        .attr("class", "y1")
        .style("stroke", "white")
        .style("stroke-width", "3.5px")
        .style("opacity", 0.8)
        .attr("dx", 8)
        .attr("dy", "-.3em");
    
    focus.append("text")
        .attr("class", "y2")
        .attr("dx", 8)
        .attr("dy", "-.3em");

    // place the y value at the intersection
    focus.append("text")
        .attr("class", "y3")
        .style("stroke", "white")
        .style("stroke-width", "3.5px")
        .style("opacity", 0.8)
        .attr("dx", 8)
        .attr("dy", "1em");

    focus.append("text")
        .attr("class", "y4")
        .attr("dx", 8)
        .attr("dy", "1em");

    
    //place the text for the y values
    focus.select("text.y1")
         .attr("transform",
            "translate(" + xStatScale(d[0]) + "," +
                           yStatScale(d[1]) + ")")
          .text(d[0]);

    focus.select("text.y2")
         .attr("transform",
            "translate(" + xStatScale(d[0]) + "," +
                           yStatScale(d[1]) + ")")
         .text(d[0]);

    //place the text for the x values
    focus.select("text.y3")
         .attr("transform",
          "translate(" + xStatScale(d[0]) + "," +
                           yStatScale(d[1]) + ")")
         .text(d[1]);

    focus.select("text.y4")
         .attr("transform",
            "translate(" + xStatScale(d[0]) + "," +
                           yStatScale(d[1]) + ")")
         .text(d[1]);

    //place the dashed lines at the intersection of the mouse
    focus.select(".xdashed")
         .attr("transform",
            "translate(" + xStatScale(d[0]) + "," +
                           yStatScale(d[1]) + ")")
         .attr("y2", height - yStatScale(d[1]));

    focus.select(".ydashed")
         .attr("transform",
            "translate(" + width * -1 + "," +
                           yStatScale(d[1]) + ")")
         .attr("x2", width + width);


            // Move to selected time
            if (draggingSlider) {
                currentFrame = x0 * 60;
                updatePlaybackSlider(true);
            }
        }//end of function mousemove

   

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
    
    // First row is header, last row is empty
    lines.shift();
    lines.pop();

    data = lines;

    updatePlaybackSlider();
    playPositions();
});

function updatePlaybackSlider(otherSlider) {
    var sliderEl = $('#control-time');

    if (lastFrame === undefined) {
        firstFrame = data[0][COL_T];
        lastFrame = data[data.length - 1][COL_T];

        sliderEl.attr('min', firstFrame);
        sliderEl.attr('max', lastFrame);

        sliderEl.mousedown(function() {
            draggingSlider = true;
        });

        sliderEl.mouseup(function() {
            draggingSlider = false;
        });

        sliderEl.on('input change', function() {
            currentFrame = +$(this).val();
            updatePlaybackTime();
        });

        $('label[for="control-play"]').click(function() {
            paused = $('#control-play').prop('checked');
        });
    }

    if ((!draggingSlider && !paused) || otherSlider) {
        sliderEl.val(currentFrame);
        updatePlaybackTime();
    }
}

function updatePlaybackTime() {
    var d = new Date(currentFrame * 1000);

    var mins = '0' + d.getMinutes();
    var secs = '0' + d.getSeconds();

    var t = mins.substr(-2) + ':' + secs.substr(-2);

    var el = $('#playback-time');
    el.text(t);
}

function playPositions() {
    var emptyData = data[0].map(function() { return 0; });
    emptyData[COL_XPOS] = -1000;
    emptyData[COL_YPOS] = -1000;

    var currentData = [];
    var lastSec = -1;
    currentFrame = firstFrame;
    


    setInterval(function() {
        // Load next second
        // get the current second
        var currentSec = Math.floor(currentFrame);
        if (currentSec != lastSec) {
            for (var i = 0; i < data.length; i++) {
                if (data[i][COL_T] == currentSec && playerDetails[data[i][COL_ID]]) {
                    // Ensure that players are always in the same order
                    currentData[data[i][COL_ID]] = data[i];
                }
            }

            for (var i = 0; i < currentData.length; i++) {
                if (!currentData[i]) {
                    currentData[i] = emptyData;
                }
            }

            if (selectedPlayer!=null) {
                distanceToOthers(selectedPlayer);
            }

            updatePositions(currentData, draggingSlider);
            updatePlaybackSlider();
        }

        if (!draggingSlider && !paused) {
            lastSec = currentSec;
            currentFrame += $('#control-speed').val() / 60;
            currentFrame = Math.min(currentFrame, lastFrame);
        } else if (paused) {
            updatePositions(currentData, true);
        }
    }, UPDATE_INTERVAL_MS);
}

function init3DField() {
    var canvas = $('#field-3d')[0];

    var renderer = new THREE.WebGLRenderer({canvas: canvas});
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.shadowMap.enabled = true;

    var scene = new THREE.Scene();

    var loader = new THREE.JSONLoader();
    loader.load('models/pitch.json', function(pitchGeometry) {
        loader.load('models/goal_posts.json', function(postsGeometry) {
            loader.load('models/goal_net.json', function(netGeometry) {
                THREE.TextureLoader.prototype.crossOrigin = '';
                
                var loader = new THREE.TextureLoader();
                loader.load('textures/pitch_texture.jpg', function(pitchTexture) {
                    pitchTexture.wrapS = THREE.RepeatWrapping;
                    pitchTexture.wrapT = THREE.RepeatWrapping;
                    pitchTexture.repeat.set(1, 1);

                    loader.load('textures/net_texture.png', function(netTexture) {
                        netTexture.wrapS = THREE.RepeatWrapping;
                        netTexture.wrapT = THREE.RepeatWrapping;
                        netTexture.repeat.set(15, 15);

                        var pitchMaterial = new THREE.MeshLambertMaterial({
                            color: 0xffffff,
                            map: pitchTexture
                        });
                        var pitchMesh = new THREE.Mesh(pitchGeometry, pitchMaterial);
                        pitchMesh.receiveShadow = true;
                        pitchMesh.castShadow = true;
                        scene.add(pitchMesh);

                        var postsMaterial = new THREE.MeshLambertMaterial({
                            color: 0xffffff
                        });
                        var postsMesh = new THREE.Mesh(postsGeometry, postsMaterial);
                        postsMesh.castShadow = true;
                        postsMesh.receiveShadow = false;
                        scene.add(postsMesh);
                        var postsMesh2 = new THREE.Mesh(postsGeometry, postsMaterial);
                        postsMesh2.rotation.y = Math.PI;
                        postsMesh2.castShadow = true;
                        postsMesh2.receiveShadow = false;
                        scene.add(postsMesh2);

                        var netMaterial = new THREE.MeshLambertMaterial({
                            color: 0xffffff,
                            map: netTexture,
                            side: THREE.DoubleSide,
                            transparent: true
                        });
                        var netMesh = new THREE.Mesh(netGeometry, netMaterial);
                        netMesh.castShadow = true;
                        netMesh.receiveShadow = false;
                        scene.add(netMesh);
                        var netMesh2 = new THREE.Mesh(netGeometry, netMaterial);
                        netMesh2.rotation.y = Math.PI;
                        netMesh2.castShadow = true;
                        netMesh2.receiveShadow = false;
                        scene.add(netMesh2);

                        // Create heatmap grids
                        $.getJSON('heatmaps/energy.json', function(grids) {
                            create3DHeatmaps(scene, 'energy', grids);
                        });

                        $.getJSON('heatmaps/position.json', function(grids) {
                            create3DHeatmaps(scene, 'position', grids);
                        });

                        $.getJSON('heatmaps/speed.json', function(grids) {
                            create3DHeatmaps(scene, 'speed', grids);
                        });

                        var light = new THREE.DirectionalLight(0xffffff, 2);
                        light.position.set(0, 1, 0);
                        scene.add(light);

                        var camera = new THREE.PerspectiveCamera(75, 575/360, 0.1, 1000);
                        camera.position.set(0, 10.5, 10.5);
                        camera.lookAt(new THREE.Vector3(0, -4, 0));

                        var controls = new THREE.OrbitControls(camera, renderer.domElement);
                        controls.minPolarAngle = 0;
                        controls.maxPolarAngle = Math.PI / 2;
                        controls.enableDamping = true;
                        controls.dampingFactor = 0.25;
                        controls.rotateSpeed = 0.5;

                        (function render() {
                            playersPreRender(scene);
                            renderer.render(scene, camera);
                            updateSelected3DPlayer(camera, renderer);

                            controls.update();

                            requestAnimationFrame(render);
                        })();

                        $(canvas).mousemove(function(event) {
                            renderer.mouseX = event.pageX - $(this).offset().left;
                            renderer.mouseY = event.pageY - $(this).offset().top;
                        });

                        $(canvas).click(function() {
                            if (renderer.hoverPlayer.length > 0) {
                                var i = renderer.hoverPlayer[0].object.playerId;

                                if (selectedPlayer == i || !playerDetails[i]) {
                                    i = null;
                                }

                                updateCard(i);
                                showPlayerStats(i);
                            }
                        });
                    });
                });
            });
        });
    });
}

function create3DHeatmaps(scene, name, grids) {
    for (var i = 0; i < 16; i++) {
        var m = create3DHeatmap(scene, name, grids[i]);
        heatmapMeshes[i + ':' + name] = m;
    }
}

function create3DHeatmap(scene, name, grid) {
    var geometry = new THREE.PlaneGeometry(20.833, 13.922, grid.length - 1, grid[0].length - 1);

    var vertexColors = [];

    for (var x = 0; x < grid.length; x++) {
        for (var y = 0; y < grid[0].length; y++) {
            var i = y * grid.length + x;
            var val = Math.sqrt(grid[x][grid[0].length - 1 - y]);
            geometry.vertices[i].z = val * 3;
            vertexColors[i] = new THREE.Color(colorScale(val));
        }
    }

    for (var i = 0; i < geometry.faces.length; i++) {
        var face = geometry.faces[i];

        face.vertexColors[0] = vertexColors[face.a];
        face.vertexColors[1] = vertexColors[face.b];
        face.vertexColors[2] = vertexColors[face.c];
    }

    geometry.computeFaceNormals();

    var material = new THREE.MeshBasicMaterial({
        vertexColors: THREE.VertexColors,
        opacity: 0.5,
        transparent: true
    });

    var mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.set(-Math.PI / 2, 0, 0);
    mesh.visible = false;
    scene.add(mesh);

    return mesh;
}

function updateSelected3DPlayer(camera, renderer) {
    // Player picking
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2(
        (renderer.mouseX / renderer.domElement.offsetWidth) * 2 - 1,
        -(renderer.mouseY / renderer.domElement.offsetHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);

    var objects = $('g.player').toArray().map(function(el) { return el.mesh; });
    var intersects = raycaster.intersectObjects(objects, true);

    renderer.hoverPlayer = intersects;

    // Show pointer if hovering over player
    $(renderer.domElement).css('cursor', renderer.hoverPlayer.length > 0 ? 'pointer' : 'default');
}

function playersPreRender(scene) {
    var playerGeometry = new THREE.BoxGeometry(0.5, 1, 0.2);
    var selectGeometry = new THREE.RingGeometry(0.3, 0.5, 32);

    $('g.player').each(function() {
        var x = x3DScale(+this.getAttribute('data-x'));
        var y = y3DScale(+this.getAttribute('data-y'));
        var dir = +this.getAttribute('data-direction');
        var id = +this.getAttribute('data-id');

        if (!this.mesh) {
            // Main mesh
            var color = playerPosColor(id);
            if (color === undefined) color = 'white';

            var playerMaterial = new THREE.MeshLambertMaterial({
                color: color
            });

            this.mesh = new THREE.Mesh(playerGeometry, playerMaterial);
            scene.add(this.mesh);

            // Selection mesh
            var selectMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000
            });

            this.selectMesh = new THREE.Mesh(selectGeometry, selectMaterial);
            this.selectMesh.visible = false;
            scene.add(this.selectMesh);
        }

        this.mesh.position.set(x, 0.5, y);
        this.mesh.rotation.y = dir;
        this.mesh.playerId = id;

        this.selectMesh.rotation.x = -Math.PI / 2;
        this.selectMesh.position.set(x, 0.15, y);
    });
}

init3DField();

// Event handler for heatmap selection
function updateHeatmapSelection() {
    var selection = $('#heatmap-selection').val();

    if (selectedPlayer) {
        selection = selectedPlayer + ':' + selection;
    } else {
        selection = '0:' + selection;
    }

    for (var name in heatmapMeshes) {
        heatmapMeshes[name].visible = name == selection;
    }
}

$('#heatmap-selection').change(updateHeatmapSelection);