document.addEventListener('DOMContentLoaded', function() {
    const url = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';

    // Fetch the data
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const dataset = data.monthlyVariance;
            const baseTemperature = data.baseTemperature;

            // Set up chart dimensions and margins
            const margin = { top: 60, right: 30, bottom: 60, left: 60 };
            const width = 1200 - margin.left - margin.right;
            const height = 500 - margin.top - margin.bottom;

            // Create SVG container
            const svg = d3.select('#heat-map')
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            // Set up scales
            const xScale = d3.scaleBand()
                .domain(dataset.map(d => d.year))
                .range([0, width]);

            const yScale = d3.scaleBand()
                .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
                .range([0, height]);

            const colorScale = d3.scaleQuantize()
                .domain([d3.min(dataset, d => baseTemperature + d.variance), d3.max(dataset, d => baseTemperature + d.variance)])
                .range(["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]);

            // Create axes
            const xAxis = d3.axisBottom(xScale)
                .tickValues(xScale.domain().filter(year => year % 10 === 0))
                .tickFormat(d3.format('d'));

            const yAxis = d3.axisLeft(yScale)
                .tickFormat(month => {
                    const date = new Date(0);
                    date.setUTCMonth(month);
                    return d3.timeFormat("%B")(date);
                });

            svg.append('g')
                .attr('id', 'x-axis')
                .attr('transform', `translate(0,${height})`)
                .call(xAxis)
                .selectAll("text")
                .style("fill", "#00ffcc")
                .style("font-family", "Orbitron, sans-serif");

            svg.append('g')
                .attr('id', 'y-axis')
                .call(yAxis)
                .selectAll("text")
                .style("fill", "#00ffcc")
                .style("font-family", "Orbitron, sans-serif");

            // Create cells
            svg.selectAll('.cell')
                .data(dataset)
                .enter()
                .append('rect')
                .attr('class', 'cell')
                .attr('data-month', d => d.month - 1)
                .attr('data-year', d => d.year)
                .attr('data-temp', d => baseTemperature + d.variance)
                .attr('x', d => xScale(d.year))
                .attr('y', d => yScale(d.month - 1))
                .attr('width', xScale.bandwidth())
                .attr('height', yScale.bandwidth())
                .attr('fill', d => colorScale(baseTemperature + d.variance))
                .on('mouseover', function(event, d) {
                    const tooltip = d3.select('#tooltip');
                    tooltip.transition().duration(200).style('opacity', 0.9);
                    tooltip.html(`
                        Year: ${d.year}<br>
                        Month: ${new Date(0, d.month - 1).toLocaleString('default', { month: 'long' })}<br>
                        Temp: ${(baseTemperature + d.variance).toFixed(2)}℃<br>
                        Variance: ${d.variance.toFixed(2)}℃
                    `)
                    .attr('data-year', d.year)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 28}px`);
                })
                .on('mouseout', function() {
                    d3.select('#tooltip').transition().duration(500).style('opacity', 0);
                });

            // Create legend
            const legendWidth = 300;
            const legendHeight = 20;

            const legend = d3.select('#legend')
                .append('svg')
                .attr('width', legendWidth)
                .attr('height', legendHeight + 30);

            const legendScale = d3.scaleLinear()
                .domain(colorScale.domain())
                .range([0, legendWidth]);

            const legendAxis = d3.axisBottom(legendScale)
                .ticks(5)
                .tickFormat(d3.format(".1f"));

            legend.append('g')
                .attr('transform', `translate(0,${legendHeight})`)
                .call(legendAxis)
                .selectAll("text")
                .style("fill", "#00ffcc")
                .style("font-family", "Orbitron, sans-serif");

            legend.selectAll('rect')
                .data(colorScale.range().map(color => {
                    const d = colorScale.invertExtent(color);
                    if (d[0] === null) d[0] = legendScale.domain()[0];
                    if (d[1] === null) d[1] = legendScale.domain()[1];
                    return d;
                }))
                .enter()
                .append('rect')
                .attr('x', d => legendScale(d[0]))
                .attr('y', 0)
                .attr('width', d => legendScale(d[1]) - legendScale(d[0]))
                .attr('height', legendHeight)
                .attr('fill', d => colorScale(d[0]));
        });
});