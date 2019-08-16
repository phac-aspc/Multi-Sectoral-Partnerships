function drawBar(target, xScale, value) {
    var svg = target.append('svg').attr('height', 40).attr("width", $("#information").width());
    var formatter = d3.format(",");
    
    svg.append('g')
        .attr('class', 'bar')
        .append('rect');
    
    svg.select('.bar')
        .append('text')
        .attr('dy', '1.2em')
        .attr('text-anchor', 'right');
    
    svg.selectAll('.bar')
        .select('rect')
        .style('fill', '#ffa502')
        .transition()
            .duration(1000)
            .attr("x", 0)
            .attr("y", 0)
            .attr('width', function(d){ return xScale(d["Funding Amount"].replace(/[,$]/g, "")); })
            .attr('height', 40);
    
    svg.select('.bar')
            .select('text')
            .transition()
            .duration(1000)
            .tween("text", function(d){
                var el = d3.select(this);
                var interpolator = d3.interpolate(el.text().replace(/[,$]/g, ""), +d["Funding Amount"].replace(/[,$]/g, ""));
                return function(t){
                    el.text("$" + formatter(interpolator(t).toFixed(0)));
                };
            })
            .attr("x", function(d){
                return xScale(d["Funding Amount"].replace(/[,$]/g, "")) + 10;
            });
}

function selectProject(data, xScale) {
    var selectionDiv = d3.select('#mainSelection').datum(data).html("");
    
    selectionDiv.append('h3').html(function(d) {
        return d["Project"];    
    });
    
    var amount = selectionDiv.append('div').attr('class', 'amount');
    drawBar(amount, xScale, +data["Funding Amount"].replace(/[,$]/g, ""));
    
    selectionDiv.append('p')
        .html(function(d) {
            return d["Purpose of Project"];
        });
    
    var affectedAreas = data["Delivery Location"].replace(/[" "]/g, "").split(",");
    if (affectedAreas[0].toLowerCase() != "all") {
        for (var i=0;i<affectedAreas.length;i++){
            d3.select("#" + affectedAreas[i]).style("opacity", 0.5);
        }
    } else {
       d3.selectAll(".province").style("opacity", 0.5); 
    }
    
    // partners div
    var partners = data["Partners"].split(/[,;]/);
        
    if (!(partners.length == 1 && partners[0] == "")) {
        selectionDiv
            .append('div')
            .selectAll(".partner")
            .data(partners)
            .enter()
            .append('div')
            .attr('class', 'partner')
            .html(function(d) {
                return d;
            });
    }
       
        selectionDiv.append("a")
            .attr("href", function(d) {
                return d['Website'];
            })
            .attr("target", "_blank")
            .html("visit website");
    

}

function template(data, colors, xScale) {
    var list = d3.select('#project-list').html("");

    for (var d=0;d<data.length; d++) {
        var item = list
            .datum(data[d])
            .append('li')
            .attr("id", "projectResult" + d)
            .attr("class", "project")
            .style("border-left", "5px solid " + colors[d])
            .style("padding-left", "10px");
        
        // adding the project title to the list item
        item.append('h3')
            .html(function(k) {
                return k["Project"];
            });

        var amount = item.append('div')
            .attr('class', 'amount');
            
        drawBar(amount, xScale, +data[d]["Funding Amount"].replace(/[,$]/g, ""));
        
        item.append('p')
            .html(
                function(d) {
                    var monthNames = [
                        "January", "February", "March",
                        "April", "May", "June", "July",
                        "August", "September", "October",
                        "November", "December"
                    ];
                    var startDate = new Date(d['Project Start Date']);
                    var endDate = new Date(d['Project End Date']);
                    
                    return monthNames[startDate.getMonth()] + " " + startDate.getFullYear() + " to " + monthNames[endDate.getMonth()] + " " + endDate.getFullYear();
                }
            );
        
        item.append('p')
            .html(function(d) {
                return 'Gender: ' + d['Gender'];  
            });
        
        // adding the project purpose
        item.append('p')
            .html(function(k) {
                return k['Purpose of Project']; 
            });
        
        // partners div
        var partners = data[d]["Partners"].split(/[,;]/);
        
        if (!(partners.length == 1 && partners[0] == "")) {
            var details = item.append("details")
                .attr("class", "acc-group off wb-lbx");
        
            details.append("summary")
                .html('Match Funding Partners')
                .attr("class", "tgl-tab wb-init wb-toggle-inited");
    
            details.selectAll(".partner")
                .data(partners)
                .enter()
                .append('div')
                .attr('class', 'partner')
                .html(function(d) {
                    return d;
                });
        }
       
        item.append("a")
            .attr("href", function(d) {
                return d['Website'];
            })
            .attr("target", "_blank")
            .html("visit website");
        
        item.on("mouseover", function(d) {
            

            var affectedAreas = d["Delivery Location"].replace(/[" "]/g, "").split(",");
            if (affectedAreas[0].toLowerCase() != "all") {
                for (var i=0;i<affectedAreas.length;i++){
                    d3.select("#" + affectedAreas[i]).style("opacity", 0.5);
                }
            } else {
               d3.selectAll(".province").style("opacity", 0.5); 
            }  
        });
        
        item.on("mouseout", function(d) {
            d3.selectAll(".province").style("opacity", 0);
        });
    }
}

function addCoordinates(pointsToProcess, callback){
    var pointsProcessed = [];
    function process(point, callback) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var data = JSON.parse(request.responseText);
                if (data[0] == undefined) {
                    console.log(point);
                }
                var coordinates = data[0].geometry.coordinates;
                point.coordinates = new L.LatLng(coordinates[1], coordinates[0]);
                callback(point);
            }
        };
        request.open("GET", "https://www.geogratis.gc.ca/services/geolocation/en/locate?q=" + point["Address"], true);
        request.send();
    }
    
    pointsToProcess.forEach(function(el){
       process(el, function(newPoint){
            pointsProcessed.push(newPoint);
           
            if (pointsProcessed.length == pointsToProcess.length) {
                callback(pointsProcessed);
            }
       }); 
    });
}

function renderData(data, colors, xScale, map) {
    $("#information").pagination({
            dataSource: data,
            pageSize: 4,
            pageRange: 9999,
            prevText: "Previous",
            nextText: "Next",
            className: "paginationHeight",
            ulClassName: "pagination",
            callback: function(data, pagination) {
                template(data, colors, xScale);
            },
            afterPaging: function() {
                d3.select('.paginationjs-next').select('a').attr('rel', 'next');
                d3.select('.paginationjs-prev').select('a').attr('rel', 'prev');
                
                
            }
        }); 
    d3.select('.paginationjs-next').select('a').attr('rel', 'next');
    d3.select('.paginationjs-prev').select('a').attr('rel', 'prv');
    $("#results-count").text(data.length);
}

function age(lowerBound, upperBound) {
    lowerBound = lowerBound == "All" ? 0 : +lowerBound;
    upperBound = upperBound == "All" ? 300 : +upperBound;
    
    let ageGroups = {
        "infants": {
            "lower": 0,
            "higher": 4
        },
        "children": {
            "lower": 5,
            "higher": 11
        },
        "youth": {
            "lower": 11,
            "higher": 17
        },
        "adult": {
            "lower": 18,
            "higher": 64
        },
        "olderAdults": {
            "lower": 65,
            "higher": 300
        }
    };
    
    var results = [];
    var keys = Object.keys(ageGroups);
    
    for (var i=0;i<keys.length;i++) {
        var ageGroup = keys[i];
        var group = ageGroups[ageGroup];
        
        if (lowerBound >= group["lower"] && lowerBound <= group["higher"])
            results.push(ageGroup);
        else if (upperBound <= group["higher"] && upperBound >= group["lower"]) 
            results.push(ageGroup);
        else if (lowerBound <= group["lower"] && upperBound >= group["higher"])
            results.push(ageGroup);
    }
    return results;
}

function filterByAge(data, age) {
    let filteredData = data.filter(function(el) {
        return el["ageGroups"].includes(age) || age.toLowerCase() == "all";
    });
    
    return filteredData;
}

function filterByGender(data, gender) {
    let filteredData = data.filter(function(el) {
        if (gender == "all")
            return true;
        return el["Gender"].toLowerCase() == gender;
    });
    
    return filteredData;
}

function filterByIntervention(data, type) {
    let filteredData = data.filter(function(el) {
        if (type == "all")
            return true;
        return el["Intervention Type"].toLowerCase() == type;
    });
    return filteredData;
}

d3.csv("./data/partnerships_v10.csv", function(csv) {
    var provinceLookup = {
        "Quebec": "QC",
        "Newfoundland and Labrador": "NL",
        "British Colombia": "BC",
        "Nunavut": "NU",
        "Northwest Territories": "NT",
        "New Brunswick": "NB",
        "Nova Scotia": "NS",
        "Saskatchewan": "SK",
        "Alberta": "AB",
        "Prince Edward Island": "PE",
        "Yukon Territory": "YT",
        "Manitoba": "MB",
        "Ontario": "ON"
    };
    
    var colors = [
        "#4285F4", // blue
        "#EA4335", // red
        "#FBBC05", // yellow
        "#34A853",  // green
    ];
    var interventionTypes = [];
    
    csv.forEach(function(el) {
       if (!interventionTypes.includes(el["Intervention Type"])) {
           interventionTypes.push(el["Intervention Type"]);
       } 
    });
    
    interventionTypes.forEach(function(type) {
        d3.select('#interventionType')
            .append('option')
            .attr('value', type.toLowerCase())
            .html(type);
    });
    
    csv.forEach(function(el) {
       el["ageGroups"] = age(el["Lower Age"], el["Upper Age"]); 
    });

    // rendering the map
    var map = L.map('funding-map', {
        center: [54.9641601681754, -90.4160163302575],
        zoom: 4,
        minZoom: 3,
        zoomControl: false
    });
    
    var selectedGender = "all";
    var selectedAge = "all";
    var selectedIntervention = "all";

    // my server is using Slava's domain because my own IP is blacklisted for phishing :(
    L.tileLayer('https://test.knyazev.io/styles/klokantech-basic/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
    }).addTo(map);
    
    //add zoom control with your options
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // create the SVG layer on top of the map
    L.svg().addTo(map);
    
    d3.select("svg")
        .append("g")
        .attr("id","provinceGroup");

    function projectPoint(x, y){
        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
    }
    
    // projecting the map
    var transform = d3.geoTransform({point: projectPoint});
    var path = d3.geoPath().projection(transform);
    
    d3.json("./data/canada.v2.json", function(geoJson) {
        var provincePaths = d3.select("#provinceGroup")
        .selectAll(".province")
        .data(geoJson.features)
        .enter()
        .append("g")
        .attr("class", "province")
        .attr("id", function(d) {
            return provinceLookup[d.properties["name"]];
        })
        .style("fill", "#c51b8a")
        .style("opacity", 0)
        .append("path")
        .attr("d", path);
        
        //update path after user done dragging or zooming
        map.on("moveend", function() {
            provincePaths.attr("d", path);
        });
    });
    
    document.getElementById("gender").value = "all";
    
    // calculating the max value in order to properly scale the bar chart
    // (the /g modifer replaces all occurances)
    var max = d3.max(csv, function(d) {
        var amount = +d["Funding Amount"].replace("$", "").replace(/,/g, "");
        return amount;
    });
    
    var xScale = d3.scaleLinear().domain([0, max]).range([0, $("#information").width()-200]);
    var sortBy = "alphabet";

    function drawGroups(target, data) {
        d3.selectAll(".intersection").remove();
        
        var intersection = d3.select(target)
                .selectAll(".intersection")
                .data(data)
                .enter()
                .append("g")
                .attr("class", "intersection")
                .attr("transform", function(d){
                   return "translate(" + d.coordinates.x + "," + d.coordinates.y + ")"; 
                });

        intersection.append('circle')
            .attr("pointer-events", "visible")
            .style("fill", "#e74c3c")
            .attr("r", 10)
            .style("stroke-width", 0.5)
            .style("stroke", "black");

        intersection.append('text')
            .attr("text-anchor", "middle")
            .attr("y", 3)
            .style("fill", "#fff")
            .text(function(d){
                return d.data.length;
            });
    }
    
    var headquarters = d3.select("#funding-map")
                    .select("svg")
                    .append("g")
                    .attr("id", "headquarters");
    // summary stats
    var formatter = d3.format(",");

    // count up for number of projects
    $("#projectCount").text(0);
    var interval = setInterval(function() {
    $("#projectCount").text(+($("#projectCount").text())+1);
    
    if ( $("#projectCount").text() == csv.length)
        clearInterval(interval);
    }, 15);

    var average = d3.mean(csv, function(d) {
        return +d["Funding Amount"].replace(/[,$]/g, ""); 
    });

    $("#average").text("$" + formatter(Math.floor(average)));
    
    var sum = d3.sum(csv, function(d) {
       return +d["Funding Amount"].replace(/[,$]/g, ""); 
    });
    
    $("#totalAmount").text("$" + formatter(sum));
    
    // preprocess the data by adding the coordinates
    addCoordinates(csv, function(data){
        function positionCircles(d) {
            var point = map.latLngToLayerPoint(d["coordinates"]);
            return "translate(" + point.x + "," + point.y + ")";
        }

        function drawCircles(cleanData) {
            return headquarters.selectAll("circle")
                            .data(cleanData)
                            .enter()
                            .append("circle")
                            .attr("id", function(d, i) {
                                return "H" + i;
                            })
                            .attr("class", "headquarter")
                            .attr("r", 10)
                            .attr("cx", 0)
                            .attr("cy", 0)
                            .style("stroke-width", 0.5)
                            .style("stroke", "black")
                            .style("display", "inline")
                            .attr("transform", positionCircles)
                            .attr("pointer-events", "visible")
                            .style("fill", "#e74c3c")
                            .on("mouseover", function(d) {
                                selectProject(d, xScale);
                                
                            }).on("mouseout", function(d) {
                                d3.selectAll(".province").style("opacity", 0);
                            });
        }
        
        var circles = drawCircles(data);
        var pageData = data;
        
        // sorting stuff
        pageData =  pageData.sort(function(a, b) {
            return d3.ascending(a["Project"], b["Project"]);
        });
        
        renderData(pageData, colors, xScale);
        
        // groups circles together
        drawGroups("svg", d3.circleCollision(circles, true));
        
        // repositioning the circles on zoom
        map.on("zoom", function(){
            d3.selectAll(".intersection").remove();

            circles = d3.selectAll('.headquarter')
                        .attr("transform", positionCircles)
                        .style("display", "inline");
            
            drawGroups("svg", d3.circleCollision(circles, true));
        });
        
        // filters
        $("#gender").on("change", function(){
           selectedGender = this.value;
           pageData = filterByGender(data, selectedGender);
           pageData = filterByAge(pageData, selectedAge);
           pageData = filterByIntervention(pageData, selectedIntervention);
           // redrawing the circles
           d3.selectAll('.intersection').remove();
           circles.remove();
           circles = drawCircles(pageData);
            drawGroups("svg", d3.circleCollision(circles, true));
            
            // I'll fix the formatting later :P
              if (sortBy == "alphabet") {
                pageData =  pageData.sort(function(a, b) {
                   return d3.ascending(a["Project"], b["Project"]);
                });
              } else if (sortBy == "amount") {
                pageData =  pageData.sort(function(a, b) {
                   return d3.descending(+a["Funding Amount"].replace(/[,$]/g, ""), +b["Funding Amount"].replace(/[,$]/g, ""));
                });
              }
          
            // displays how many results
            $("#results-count").text(pageData.length);
            $('#results-plural').text(pageData.length == 1 ? "" : "s");
            
            // rendering the data
            renderData(pageData, colors, xScale);
        });
        
        $("#age").on("change", function() {
            selectedAge = this.value;
            pageData = filterByAge(data, selectedAge);
            pageData = filterByGender(pageData, selectedGender);
            pageData = filterByIntervention(pageData, selectedIntervention);
           // redrawing the circles
           d3.selectAll('.intersection').remove();
           circles.remove();
           circles = drawCircles(pageData);
            drawGroups("svg", d3.circleCollision(circles, true));
            
            // I'll fix the formatting later :P
              if (sortBy == "alphabet") {
                pageData =  pageData.sort(function(a, b) {
                   return d3.ascending(a["Project"], b["Project"]);
                });
              } else if (sortBy == "amount") {
                pageData =  pageData.sort(function(a, b) {
                   return d3.descending(+a["Funding Amount"].replace(/[,$]/g, ""), +b["Funding Amount"].replace(/[,$]/g, ""));
                });
              }
          
            // displays how many results
            $("#results-count").text(pageData.length);
            $('#results-plural').text(pageData.length == 1 ? "" : "s");
            
            // rendering the data
            renderData(pageData, colors, xScale);
        });
        
        $("#interventionType").on("change", function() {
            selectedIntervention = this.value;
            
            pageData = filterByIntervention(data, selectedIntervention);
            pageData = filterByAge(pageData, selectedAge);
            pageData = filterByGender(pageData, selectedGender);
    
           // redrawing the circles
           d3.selectAll('.intersection').remove();
           circles.remove();
           circles = drawCircles(pageData);
            drawGroups("svg", d3.circleCollision(circles, true));
            
            // I'll fix the formatting later :P
              if (sortBy == "alphabet") {
                pageData =  pageData.sort(function(a, b) {
                   return d3.ascending(a["Project"], b["Project"]);
                });
              } else if (sortBy == "amount") {
                pageData =  pageData.sort(function(a, b) {
                   return d3.descending(+a["Funding Amount"].replace(/[,$]/g, ""), +b["Funding Amount"].replace(/[,$]/g, ""));
                });
              }
          
            // displays how many results
            $("#results-count").text(pageData.length);
            $('#results-plural').text(pageData.length == 1 ? "" : "s");
            
            // rendering the data
            renderData(pageData, colors, xScale);
        });
        
        $("#alphabeticalSort").on("click", function() {
           sortBy = "alphabet";
           pageData =  pageData.sort(function(a, b) {
               return d3.ascending(a["Project"], b["Project"]);
           });
           
           renderData(pageData, colors, xScale);
           
           $(".sort").removeClass("active");
           $(this).addClass("active");
        });
        
        $("#amountSort").on("click", function() {
            sortBy = "amount";
            pageData =  pageData.sort(function(a, b) {
               return d3.descending(+a["Funding Amount"].replace(/[,$]/g, ""), +b["Funding Amount"].replace(/[,$]/g, ""));
            });

            renderData(pageData, colors, xScale);
            $(".sort").removeClass("active");
            $(this).addClass("active");
        });
    });
});

// Getting the data from google sheets (NOT PROVIDED FOR NOW) will add once the API is setup
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
