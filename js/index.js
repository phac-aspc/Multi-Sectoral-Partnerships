function displayDetails(data, x){

    document.getElementById("default").style.display = "none";
    
    var detailsElement = document.getElementById("selection");
    var detailsString = '<div class="project">';
    
    detailsString += '<div id="title-container">';
        
    detailsString += '<h3 id="title">' + data["Project Name"] + '</h3>';
    detailsString += '</div>';
            
    detailsString += '<div class="amount"></div>';
            
    detailsString += '<p id="description">' + data['Description'] + "</p>";

    detailsString += '</div>';
    
    detailsElement.innerHTML += detailsString;
    
    var amounts = document.getElementsByClassName("amount");
    
    drawBar(amounts[0], x, +data["Funding Amount"].replace("$", "").replace(",", "").replace(",", ""));
}

function reduceCollisions(target, max){
    // REMINDER: add cx and cy values to the transform to get the real position
    
    var circles = target.selectAll('circle');
    d3.selectAll('.group').remove();
    // NEW optimized D3 code
    // var groups = [];
    // circles.each(function(d){
    //     var firstNode = this;

    //     var transformVal = d3.select(firstNode).attr("transform");
        
    //     var transValues_1 = transformVal.substring(10, transformVal.length-1).split(',');
    //     var radius_1 = +d3.select(firstNode).attr("r");
        
    //     var x1 = +transValues_1[0];
    //     var y1 = +transValues_1[1];

    //     circles.each(function(n){
    //         var secondNode = this;
            
    //         transformVal = d3.select(secondNode).attr("transform");
    //         var transValues_2 = transformVal.substring(10, transformVal.length-1).split(',');
    //         var radius_2 = +d3.select(secondNode).attr("r");
            
    //         var x2 = +transValues_2[0];
    //         var y2 = +transValues_2[1];
            
    //         var dx = x1-x2;
    //         var dy = y1-y2;
            
    //         var distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
            
    //         // if there's a collision
    //         if (radius_1 + radius_2 >= distance){
    //             var addToGroup = false;
    //             var groupIndex = null;

    //             for (var g=0;g<groups.length;g++){
    //                 if (groups[g].includes(firstNode)){
    //                     addToGroup = true;
    //                     groupIndex = g;
    //                 }
    //             }
    //             if (addToGroup){
    //                 if (!groups[groupIndex].includes(secondNode))
    //                     groups[groupIndex].push(secondNode);
    //             } else {
    //                 if (firstNode != secondNode)
    //                     groups.push([firstNode, secondNode]);
    //             }
    //         }
    //     });
    // });
    
    // console.log(groups);
    var nodes = circles._groups[0];
    var groups = [];
    
    // collision detection
    for (var i=0; i< nodes.length; i++){
        var transformValue = nodes[i].attributes.transform.value;
        
        var transformValues = transformValue.substring(10, transformValue.length-1).split(',');
        
        var x1 = +transformValues[0];
        var y1 = +transformValues[1];

        for (var k=0;k<nodes.length; k++){
            var group = [];
            var transformValue2 = nodes[k].attributes.transform.value;
            
            var transformValues2 = transformValue2.substring(10, transformValue.length-1).split(',');
            
            var x2 = +transformValues2[0];
            var y2 = +transformValues2[1];
            
            // check the distance to each other
            var dx = Math.pow(x1-x2, 2);
            var dy = Math.pow(y1-y2, 2);
            
            var distance = Math.sqrt(dx + dy);
            
            // debugging
            // if (i==0 && k==1){
            //     console.log("x1: " + x1);
            //     console.log("x2: " + x2);
            //     console.log("y1: " + y1);
            //     console.log("y2: " + y2);
            //     console.log(x1-x2);
            //     console.log(dx);
            //     console.log(dy);
            //     console.log(nodes[i], nodes[k]);
            //     console.log("Distance: " + distance);
            // }
            
            if (20 >= distance){
                // console.log(distance);
                var addToGroup = false;
                var groupIndex = 0;
                
                for (var g=0;g<groups.length;g++){
                    // console.log(groups[g]);
                    if (groups[g].includes(nodes[i])){
                        addToGroup = true;
                        groupIndex = g;
                        // groups[g].push(nodes[k]);
                    }  
                } 
                
                if (addToGroup){
                    if (!groups[groupIndex].includes(nodes[k])){
                        groups[groupIndex].push(nodes[k]);
                    }
                } else {
                    if (nodes[k] != nodes[i]){
                        group[0] = nodes[i];
                        group[1] = nodes[k];
                        groups.push(group);
                    }
                }
            }
        }
    }
    
    // console.log(groups);
    
    console.log(groups);
    
    // drawing the new circles
    for (var i=0;i<groups.length;i++){
        var xsum = 0;
        var ysum = 0;
        
        for (var g=0;g<groups[i].length;g++){
            var transformValue = groups[i][g].attributes.transform.value;
            var values = transformValue.substring(10, transformValue.length-1).split(',');
            
            xsum += parseInt(values[0]);
            ysum += parseInt(values[1]);
        }

        var ax = Math.floor(xsum/groups[i].length);
        var ay = Math.floor(ysum/groups[i].length);
        
        var data = [];
        
        for (var g=0;g<groups[i].length;g++){
            d3.select(groups[i][g]).attr("display", "none").each(function(d){
                data[data.length] = d;
            });
            // groups[i][g].attributes.transform.value = "translate(" + ax + "," + ay + ")";
        }
        
        
        
        var grouping = d3.select('svg')
            .datum(data)
            .append('g')
            .attr("transform", "translate(" + ax + "," + ay + ")")
            .attr('class', 'group')
            .on('mouseover', function(d){
                document.getElementById('selection').innerHTML = "";
                for (var i=0;i<d.length;i++){
                    console.table(d[i]);
                    
                    var xScale = d3.scaleLinear()
                            .range([0, $(".amount").width() - 150])
                            .domain([0, max]);
                    displayDetails(d[i], xScale);
                }
            });
        
        grouping
            .append('circle')
            .attr("r", 10)
            .style("fill", "#e74c3c")
            .attr("pointer-events", "visible")
        
        grouping.append("text")
            .attr("text-anchor", "middle")
            .attr("y", 3)
            .style("fill", "#fff")
            .text(function(d){
                return d.length;
            });
    }
}

d3.csv("./data/partnerships.csv", function(csv) {
    var data = csv;

    // rendering the map
    var map = L.map('funding-map', {
        center: [56.1304, -106.34],
        zoom: 4,
        minZoom: 3
    });

    // my server is using Slava's domain because my own IP is blacklisted for phishing :(
    L.tileLayer('http://test.knyazev.io/styles/klokantech-basic/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
    }).addTo(map);

    // create the SVG layer on top of the map
    L.svg().addTo(map);
    
    // this array will hold the coordinates for every point
    var coords = [];

    // calculating the max value in order to properly scale the bar chart
    // (the /g modifer means to replace all occurances)
    var max = d3.max(data, function(d) {
        var amount = +d["Funding Amount"].replace("$", "").replace(/,/g, "");
        return amount;
    });
    
    var target = d3.select("#funding-map")
        .select("svg")
        .select("g");
    
    // initializing the selected project
    var selectedProject = null;
    
    for (var i = 0; i < data.length; i++) {
        findLocation(data[i]["Headquarters"], function(coordinates) {
            // adds the coordinates to draw
            coords.push(new L.LatLng(coordinates[1] + Math.random() / 10, coordinates[0] + Math.random() / 10));
            
            target.selectAll('.headquarter').attr("display", "inline");
            
            // only execute at the last data point
            if (coords.length == data.length) {
                var circles = target.selectAll("circle")
                    .data(data)
                    .enter()
                    .append("circle")
                    .attr("id", function(d, i) {
                        return "H" + i;
                    })
                    .attr("class", "headquarter")
                    .style("fill", "#e74c3c")
                    .attr("r", 10)
                    .attr("opacity", 0)
                    .attr("transform", function(d, k) {
                        var point = map.latLngToLayerPoint(coords[k]);
                        return "translate(" + point.x + "," + point.y + ")";
                    })
                    .attr("opacity", 1)
                    .attr("pointer-events", "visible");
                
                reduceCollisions(target, max);
                
                // create the bar chart svg
                d3.select("#amount")
                    .append('svg')
                    .attr('id', 'bar-chart')
                    .attr('width', $("#amount").width())
                    .attr("height", 50);

                circles.on("mouseover", function(d) {
                    document.getElementById("default").style.display = "none";
                    
                    document.getElementById('selection').innerHTML = '';
                    
                    var xScale = d3.scaleLinear()
                            .range([0, $("#amount").width() - 150])
                            .domain([0, max]);
                    
                    displayDetails(d, xScale);
                    
                    // d3.select(this)
                    //     .style("fill", "#2980b9");
                    
                    // if (selectedProject == null) {
                    //     document.getElementById("title").textContent = d["Project Name"];
                    //     document.getElementById("description").textContent = d["Description"];

                    //     var xScale = d3.scaleLinear()
                    //         .range([0, $("#amount").width() - 150])
                    //         .domain([0, max]);

                    //     drawBar("#bar-chart", xScale, +d["Funding Amount"].replace("$", "").replace(",", "").replace(",", ""));

                    //     // adding partners
                    //     var partners = d["Partners"].split(/,|;/);

                    //     var partnersDiv = document.getElementById("partners");
                        
                    //     partnersDiv.innerHTML = '<h4>Match Funding Partners</h4>';
                        
                    //     for (var i = 0; i < partners.length; i++) {
                    //         partnersDiv.innerHTML += '<div class="partner" id="P' + i + '">' + partners[i].trim() + "</div>";
                    //     }
                    // }

                });

                circles.on("mouseout", function(d, i) {
                    if (selectedProject != i)
                        d3.select(this).style("fill", "#e74c3c");
                });
                
                circles.on("click", function(d, i) {
                    if (selectedProject == i) {
                        selectedProject = null;
                        d3.select(this).style("fill", "#e74c3c");
                    } 
                    else {
                        d3.select("#H" + selectedProject).style("fill", "#2980b9");
                        selectedProject = i;

                        // adding partners
                        var partners = d["Partners"].split(/,|;/);

                        var partnersDiv = document.getElementById("partners");
                        partnersDiv.innerHTML = '<h4>Match Funding Partners</h4>';
                        
                        for (var i = 0; i < partners.length; i++) {
                            partnersDiv.innerHTML += '<div class="partner" id="P' + i + '">' + partners[i].trim() + "</div>";
                        }
                        
                        d3.select(this).style("fill", "#2980b9");
                        document.getElementById("title").textContent = d["Project Name"];
                        document.getElementById("description").textContent = d["Description"];

                        var xScale = d3.scaleLinear()
                            .range([0, $("#amount").width() - 150])
                            .domain([0, max]);

                        // drawBar("#bar-chart", xScale, +d["Funding Amount"].replace("$", "").replace(",", "").replace(",", ""));
                    }
                });
                
                map.on("zoomend", function() {
                    circles
                        .attr("display", "inline")
                        .attr("transform", function(d, k) {
                        var point = map.latLngToLayerPoint(coords[k]);
                        // console.log('doing');
                        return "translate(" + point.x + "," + point.y + ")";
                    });
                    reduceCollisions(target);
                });
            }
        });
    }
});



// Getting the data from google sheets (NOT PROVIDED FOR NOW)
// var request = new XMLHttpRequest();
// var API_KEY = "AIzaSyD0w5ErZNuAyG0yWLfUaJwxpKR-3SXPJq8";
// var MAJOR_DIMENSION = "ROWS";
// var RANGE = "A:Z";
// var params = "?key=" + API_KEY;

// params += "&majorDimension=" + MAJOR_DIMENSION;

// request.onreadystatechange = function() {
//     if (this.readyState == 4 && this.status == 200) {
//         var rawData = JSON.parse(request.responseText).values;
//         var data = rawData.toJSON();
//         console.log(data);
//     }
// };

// request.open("GET", "https://sheets.googleapis.com/v4/spreadsheets/1sGz4xKVpIXwByMDQkDCkn04ZRe0TvRU3ycQE5qkT2Es/values/" + RANGE + params, true);
// request.send();