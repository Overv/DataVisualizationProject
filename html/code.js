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

var xScale = d3.scale.linear()
    .domain([0, FIELD_WIDTH])
    .range([24, 550]);

var yScale = d3.scale.linear()
    .domain([0, FIELD_HEIGHT])
    .range([350, 9]);

var x3DScale = d3.scale.linear()
    .domain([0, FIELD_WIDTH])
    .range([-20.833/2, 20.833/2]);

var y3DScale = d3.scale.linear()
    .domain([0, FIELD_HEIGHT])
    .range([13.922/2, -13.922/2]);

var currentFrame = 0;
var firstFrame, lastFrame;
var draggingSlider = false;
var paused = false;

var playerDetails = {"1":{"name":"Zeki","sur":"Fryers","db":"9 Sep 1992 (Age 23)","nation":"England","height":"-","weight":"-","pos":"Left Back","shirtno":"35"},
                     "2":{"name":"Kyle","sur":"Naughton","db":"11 Nov 1988 (Age 27)","nation":"England","height":"181 cm.","weight":"73 Kg.","pos":"Right Back","shirtno":"25"},
                     "4":{"name":"Michael","sur":"Dawson","db":"18 Nov 1983 (Age 32)","nation":"England","height":"188 cm.","weight":"79 kg.","pos":"Center Back","shirtno":"5"},
                     "5":{"name":"Roberto","sur":"Soldado","db":"27 May 1985 (Age 30)","nation":"Spain","height":"176 cm.","weight":"73 kg.","pos":"Forward/Striker","shirtno":"9"},
                     "6":{"name":"Andros","sur":"Townsend","db":"16 Jul 1990 (Age 25)","nation":"England","height":"183 cm.","weight":"77 kg.","pos":"Right Winger","shirtno":"17"},
                     "8":{"name":"Gylfi","sur":"Sigurdsson","db":"9 Sep 1989 (Age 26)","nation":"Iceland","height":"186 cm.","weight":"75 kg.","pos":"Left Winger","shirtno":"-"},
                     "11":{"name":"Mousa","sur":"Dembele","db":"17 Jul 1987 (Age 29)","nation":"Belgium","height":"183 cm.","weight":"78 Kg.","pos":"Midfielder","shirtno":"19"},
                     "12":{"name":"Naser","sur":"Chadli","db":"2 Sep 1989 (Age 26)","nation":"Belgium","height":"188 cm.","weight":"85 kg.","pos":"Attacking Midfielder","shirtno":"21"},
                     "14":{"name":"Vlad lulian","sur":"Chiriches","db":"15 Nov 1989 (age 26)","nation":"Romania","height":"183 cm.","weight":"75 kg.","pos":"Center Back","shirtno":"6"},
                    };


function updatePositions(data, instanttransition) {
    // Update data
    var playerGroups = vis
        .selectAll('.player')
        .data(data);

    // Update existing players
    playerGroups
        .transition()
        .ease('linear')
        .duration(instanttransition ? 33 : (2000 / $('#playback-speed').val()))
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
            showPlayerStats(i);
            updateCard(i);
        });

    newPlayerGroups.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 10)
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

function showPlayerStats(tagid) {
    // TODO
    //d3.select("svg.parent").selectAll("*").remove();
    d3.select("#stats").remove();
    d3.select("body")
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


    
    //console.log(playerIdData.length);

    //console.log(playerIdData);
    //the option of the user in the selection box
    changeGraph(tagid);

    //console.log(playerData.length);
    //console.log(playerData);

    // the player's timestamp is in seconds from the start of the game
}

// a function to update the player's details in the card
function updateCard(tagid){
    d3.select("#details").style("display","block");
    d3.select("#playerName").text(playerDetails[tagid].name+" "+playerDetails[tagid].sur);
    d3.select("#playerBirth").text(playerDetails[tagid].db);
    d3.select("#playerNation").text(playerDetails[tagid].nation);
    d3.select("#playerHeight").text(playerDetails[tagid].height);
    d3.select("#playerWeight").text(playerDetails[tagid].weight);
    d3.select("#playerPos").text(playerDetails[tagid].pos);
    d3.select("#playerNumber").text(playerDetails[tagid].shirtno);

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
        //console.log(previousMin)
        playerData.push([previousMin,playerIdData[0][COL_TOTALDISTANCE]]);
        //console.log("This is the previousMin" + previousMin);

        for (var i=0 ; i<playerIdData.length; i++){
            var curMin = Math.floor(playerIdData[i][COL_TIMESTAMP] / 60);
            if(!(curMin==previousMin)){
                playerData.push([curMin,playerIdData[i][COL_TOTALDISTANCE]]);
                previousMin=curMin;
            }
        }
    }
    else if (option=="Speed"){
        
        var previousMin = Math.floor(playerIdData[0][COL_TIMESTAMP] / 60);
        //console.log(previousMin)
        playerData.push([previousMin,playerIdData[0][COL_SPEED]]);
        //console.log("This is the previousMin" + previousMin);

        for (var i=0 ; i<playerIdData.length; i++){
            var curMin = Math.floor(playerIdData[i][COL_TIMESTAMP] / 60);
            if(!(curMin==previousMin)){
                playerData.push([curMin,playerIdData[i][COL_SPEED]]);
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
            .text("Total_Distance");

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
           .on("mousemove", mousemove);


     function mousemove() {                     
        var x0 = xStatScale.invert(d3.mouse(this)[0]),
            i = bisectMinute(playerData, x0, 1),
            d0 = playerData[i - 1],
            d1 = playerData[i],
            d = x0 - d0[0] > d1[0] - x0 ? d1 : d0;
        //console.log("Position of x is"+x0);
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

function updatePlaybackSlider() {
    var sliderEl = $('#playback-slider');

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

        $('#playback-button').click(function() {
            paused = !paused;

            if (paused) {
                $(this).val('Play');
            } else {
                $(this).val('Pause');
            }
        });
    }

    if (!draggingSlider && !paused) {
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
        var currentSec = Math.floor(currentFrame);
        if (currentSec != lastSec) {
            for (var i = 0; i < data.length; i++) {
                if (data[i][COL_T] == currentSec) {
                    // Ensure that players are always in the same order
                    currentData[data[i][COL_ID]] = data[i];
                }
            }

            for (var i = 0; i < currentData.length; i++) {
                if (!currentData[i]) {
                    currentData[i] = emptyData;
                }
            }

            updatePositions(currentData, draggingSlider);
            updatePlaybackSlider();
        }

        if (!draggingSlider && !paused) {
            lastSec = currentSec;
            currentFrame += $('#playback-speed').val() / 60;
            currentFrame = Math.min(currentFrame, lastFrame);
        } else if (paused) {
            updatePositions(currentData, true);
        }
    }, UPDATE_INTERVAL_MS);
}

function init3DField() {
    var canvas = $('#field3d')[0];

    var renderer = new THREE.WebGLRenderer({canvas: canvas});
    renderer.setSize(575, 360);
    renderer.shadowMap.enabled = true;

    var scene = new THREE.Scene();

    var loader = new THREE.JSONLoader();
    loader.load('https://cdn.rawgit.com/Overv/DataVisualizationProject/master/html/models/pitch.json', function(pitchGeometry) {
        loader.load('https://cdn.rawgit.com/Overv/DataVisualizationProject/master/html/models/goal_posts.json', function(postsGeometry) {
            loader.load('https://cdn.rawgit.com/Overv/DataVisualizationProject/master/html/models/goal_net.json', function(netGeometry) {
                THREE.TextureLoader.prototype.crossOrigin = '';
                
                var loader = new THREE.TextureLoader();
                loader.load('https://cdn.rawgit.com/Overv/DataVisualizationProject/master/html/textures/pitch_texture.jpg', function(pitchTexture) {
                    pitchTexture.wrapS = THREE.RepeatWrapping;
                    pitchTexture.wrapT = THREE.RepeatWrapping;
                    pitchTexture.repeat.set(1, 1);

                    loader.load('https://cdn.rawgit.com/Overv/DataVisualizationProject/master/html/textures/net_texture.png', function(netTexture) {
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

                        var light = new THREE.DirectionalLight(0xffffff, 2);
                        light.position.set(0, 1, 0);
                        scene.add(light);

                        var camera = new THREE.PerspectiveCamera(75, 575/360, 0.1, 1000);
                        camera.position.set(0, 10.5, 10.5);
                        camera.lookAt(new THREE.Vector3(0, -4, 0));

                        var controls = new THREE.OrbitControls(camera, renderer.domElement);
                        controls.enableDamping = true;
                        controls.dampingFactor = 0.25;
                        controls.rotateSpeed = 0.5;

                        (function render() {
                            playersPreRender(scene);
                            renderer.render(scene, camera);
                            playersPostRender(scene);

                            controls.update();

                            requestAnimationFrame(render);
                        })();
                    });
                });
            });
        });
    });
}

function playersPreRender(scene) {
    var playerGeometry = new THREE.BoxGeometry(0.5, 1, 0.2);

    $('g.player').each(function() {
        var x = x3DScale(+$(this).attr('data-x'));
        var y = y3DScale(+$(this).attr('data-y'));
        var dir = +$(this).attr('data-direction');
        var id = +$(this).attr('data-id');

        var color = playerPosColor(id);
        if (color === undefined) color = 'white';

        var playerMaterial = new THREE.MeshLambertMaterial({
            color: color
        });

        this.mesh = new THREE.Mesh(playerGeometry, playerMaterial);
        this.mesh.position.set(x, 0.5, y);
        this.mesh.rotation.y = dir;
        scene.add(this.mesh);
    });
}

function playersPostRender(scene) {
    $('g.player').each(function() {
        scene.remove(this.mesh);
    });
}

init3DField();