let countryData = [];
let selectedYear;
let selectedMapYear;
let selectedCountryElement = null;
let selectedCountryName = null;

const colors = d3.scaleOrdinal(d3.schemeTableau10); // Korištenje moderne palete boja

function updateCharts(year, product, flow) {
    const filteredData = countryData.filter(d => d.year == year && d.product == product && d.flow == flow);

    const margin = { top: 20, right: 30, bottom: 60, left: 110 };
    const width = 540 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select("#chart-container svg");
    svg.selectAll("*").remove();

    if (filteredData.length === 0) {
        svg.append("text")
            .attr("class", "no-data")
            .attr("x", width / 2 + margin.left)
            .attr("y", height / 2 + margin.top)
            .text("No data");
        return;
    }

    filteredData.sort((a, b) => b.value - a.value);
    const top5Data = filteredData.slice(0, 5);

    const chart = svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(top5Data.map(d => d.country_name))
        .range([0, width / 1.5])
        .padding(0.5);

    const y = d3.scaleLinear()
        .domain([0, d3.max(top5Data, d => d.value)]).nice()
        .range([height, 0]);

    chart.append("g")
        .selectAll(".bar")
        .data(top5Data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.country_name))
        .attr("y", height)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("fill", (d, i) => colors(i)) // Koristimo proširenu paletu boja
        .transition()
        .duration(1000)
        .attr("y", d => y(d.value))
        .attr("height", d => height - y(d.value));

    chart.append("g")
        .selectAll(".label")
        .data(top5Data)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => x(d.country_name) + x.bandwidth() / 2)
        .attr("y", d => y(d.value) - 5)
        .text(d => d.value.toFixed(2))
        .style("opacity", 0)
        .transition()
        .delay(1000)
        .duration(500)
        .style("opacity", 1);

    chart.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -margin.left)
        .attr("y", -60)
        .attr("dy", "0.01em")
        .attr("fill", "#000")
        .text("Vrijednost");

    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
}

function updatePieChart(year, country) {
    const crudeOilData = countryData.filter(d => d.year == year && d.product == "Crude oil" && d.country_name == country);
    const gasolineDieselData = countryData.filter(d => d.year == year && d.product == "Gasoline and diesel" && d.country_name == country);
    const totalOilProductsData = countryData.filter(d => d.year == year && d.product == "Total oil products production" && d.country_name == country);
    const residualFuelOilData = countryData.filter(d => d.year == year && d.product == "Residual fuel oil" && d.country_name == country);

    const countryTitleElement = document.getElementById('country-data-title');
    countryTitleElement.textContent = `Country: ${country}`;
    countryTitleElement.classList.remove('hidden-title');

    updateIndividualPieChart("#crude-oil-piechart", crudeOilData, "flow", "crude-oil-title");
    updateIndividualPieChart("#gasoline-diesel-piechart", gasolineDieselData, "flow", "gasoline-diesel-title");
    updateIndividualPieChart("#total-oil-products-piechart", totalOilProductsData, "flow", "total-oil-products-title");
    updateIndividualPieChart("#residual-fuel-oil-piechart", residualFuelOilData, "flow", "residual-fuel-oil-title");
}

function updateIndividualPieChart(svgId, data, key, titleId) {
    const svg = d3.select(svgId);
    svg.selectAll("*").remove();

    if (data.length === 0) {
        svg.append("text")
            .attr("class", "no-data")
            .attr("x", 50)
            .attr("y", 50)
            .text("No data");
        document.getElementById(titleId).classList.add('hidden-title');
    } else {
        const flowData = d3.rollups(data, v => d3.sum(v, d => d.value), d => d[key])
            .map(([key, value]) => ({ key: key, value: value }));

            const width = 200;
            const height = 250;
            const radius = Math.min(width, height) / 2;
    
            const g = svg.append("g")
                .attr("transform", `translate(${width / 2},${height / 2})`);
    
            const color = d3.scaleOrdinal(d3.schemeTableau10); // Korištenje moderne palete boja
    
            const pie = d3.pie()
                .sort(null)
                .value(d => d.value);
    
            const path = d3.arc()
                .outerRadius(radius - 10)
                .innerRadius(radius - 40);
    
            const label = d3.arc()
                .outerRadius(radius - 20)
                .innerRadius(radius - 20);
    
            const arc = g.selectAll(".arc")
                .data(pie(flowData))
                .enter().append("g")
                .attr("class", "arc");
    
            arc.append("path")
                .attr("d", path)
                .attr("fill", d => color(d.data.key))
                .transition()
                .duration(1000)
                .attrTween("d", function(d) {
                    const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
                    return function(t) {
                        return path(interpolate(t));
                    };
                });
    
            arc.append("text")
                .attr("transform", function(d) {
                    const [x, y] = label.centroid(d);
                    return `translate(${x}, ${y})`;
                })
                .attr("dy", "0.35em")
                .style("opacity", 0)
                .text(d => d.data.key)
                .transition()
                .delay(1000)
                .duration(500)
                .style("opacity", 1)
                .attr("transform", function(d) {
                    const [x, y] = label.centroid(d);
                    return `translate(${x}, ${y})`;
                })
                .style("pointer-events", "none");
    
            document.getElementById(titleId).classList.remove('hidden-title');
        }
    }
    
    d3.csv("oil_production.csv").then(data => {
        countryData = data;
    
        data.forEach(d => {
            d.value = +d.value;
        });
    
        const years = [...new Set(data.map(d => d.year))].sort((a, b) => a - b);
        const products = [...new Set(data.map(d => d.product))].sort();
    
        const yearSelect = d3.select("#yearSelect");
        yearSelect.selectAll("option")
            .data(years)
            .enter().append("option")
            .attr("value", d => d)
            .text(d => d);
    
        const productSelect = d3.select("#productSelect");
        productSelect.selectAll("option")
            .data(products)
            .enter().append("option")
            .attr("value", d => d)
            .text(d => d);
    
        const flows = [...new Set(data.map(d => d.flow))].sort();
    
        const flowSelect = d3.select("#flowSelect");
        flowSelect.selectAll("option")
            .data(flows)
            .enter().append("option")
            .attr("value", d => d)
            .text(d => d);
    
        const mapYearSlider = d3.select("#mapYearSlider");
        const mapYearValue = d3.select("#mapYearValue");
        mapYearSlider.attr("min", d3.min(years))
            .attr("max", d3.max(years))
            .attr("value", d3.min(years));
    
        mapYearValue.text(d3.min(years));
    
        selectedYear = yearSelect.property("value");
        selectedProduct = productSelect.property("value");
        selectedFlow = flowSelect.property("value");
        selectedMapYear = mapYearSlider.property("value");
    
        updateCharts(selectedYear, selectedProduct, selectedFlow);
    
        yearSelect.on("change", function() {
            selectedYear = this.value;
            updateCharts(selectedYear, selectedProduct, selectedFlow);
        });
    
        productSelect.on("change", function() {
            selectedProduct = this.value;
            updateCharts(selectedYear, selectedProduct, selectedFlow);
        });
    
        flowSelect.on("change", function() {
            selectedFlow = this.value;
            updateCharts(selectedYear, selectedProduct, selectedFlow);
        });
    
        mapYearSlider.on("input", function() {
            selectedMapYear = this.value;
            mapYearValue.text(this.value);
            updateMap(selectedMapYear);
            if (selectedCountryName) {
                updatePieChart(selectedMapYear, selectedCountryName);
            }
        });
    
    }).catch(error => {
        console.error('Error loading or parsing data:', error);
    });
    
    function updateMap(x_selectedYear) {
        console.log("Map updated for year:", x_selectedYear);
    }
    
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(worldData => {
        const width = 600; 
        const height = 400; 
    
        const projection = d3.geoMercator()
            .scale(130)
            .translate([width / 2, height / 1.5]);
    
        const path = d3.geoPath().projection(projection);
    
        const svg = d3.select("#world-map").append("svg")
            .attr("width", width)
            .attr("height", height);
    
        const g = svg.append("g");
    
        g.selectAll("path")
            .data(worldData.features)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "country")
            .on("mouseover", function(event, d) {
                if (this !== selectedCountryElement) {
                    d3.select(this).style("fill", getComputedStyle(document.documentElement).getPropertyValue('--hover-color'));
                }
            })
            .on("mouseout", function(event, d) {
                if (this !== selectedCountryElement) {
                    d3.select(this).style("fill", getComputedStyle(document.documentElement).getPropertyValue('--map-fill-color'));
                }
            })
            .on("click", function(event, d) {
                const countryName = d.properties.name || d.properties.admin || "Nepoznato";
                console.log(countryName);
                console.log("Odabrana godina unutar funkcije klika: " + selectedMapYear);
    
                if (selectedCountryElement) {
                    d3.select(selectedCountryElement).style("fill", getComputedStyle(document.documentElement).getPropertyValue('--map-fill-color'));
                }
    
                selectedCountryElement = this;
                selectedCountryName = countryName;
                d3.select(this).style("fill", getComputedStyle(document.documentElement).getPropertyValue('--selected-country-color'));
    
                const matchedCountry = countryData.find(c => c.country_name === countryName && c.year == selectedMapYear);
    
                if (!matchedCountry) {
                    console.log("No data");
                    updatePieChart(selectedMapYear, countryName);
                } else {
                    const { country_name } = matchedCountry;
                    updatePieChart(selectedMapYear, country_name);
                }
            });
    
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });
    
        svg.call(zoom);
    });
    