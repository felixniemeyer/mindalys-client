function ResultChart(results,
	timeFrom, 
	frequencyFrom, 
	timeTo, 
	frequencyTo,
	width, 
	height)
{
	this.results = results; 
	this.timeFrom = timeFrom; 
	this.frequencyFrom = frequencyFrom; 
	this.timeTo = timeTo; 
	this.frequencyTo = frequencyTo; 
	this.width = width; 
	this.height = height; 

	this.coordSysWidth = width - 50; 
	this.coordSysHeight = height - 20 - 20; //unten 20 oben für die labels

	this.pixelPerTime = this.coordSysWidth / (timeTo - timeFrom); 
	this.pixelPerFrequency = this.coordSysHeight / (frequencyTo - frequencyFrom); 
	
	this.xOffset = - this.timeFrom * this.pixelPerTime + 50; 
	this.yOffset = 20; 
}

ResultChart.prototype.generateSvg = function() {
	var svg = createSVGElement('svg');
	svg.setAttribute('width', this.width);
	svg.setAttribute('height', this.height);
	this.appendPaths(svg);
	this.appendLabels(svg); 
	this.appendAxes(svg); 
	return svg; 
};

ResultChart.prototype.appendPaths = function(svg) {
	var step; 
	var pathCoordinates = {}; 
	for(var word in this.results.book.wordCounts){
		pathCoordinates[word] = [];
	}
	for(var time in this.results.steps){
		step = this.results.steps[time]; 
		for(var word in this.results.book.wordCounts){
			pathCoordinates[word].push(
				(time * this.pixelPerTime + this.xOffset).toFixed(2)
				 + " "
				 + (this.coordSysHeight - (step.normalizedWordFrequencies[word] || 0) * this.pixelPerFrequency + this.yOffset).toFixed(2)
			);
		}
	}	
	var path;
	for(var word in this.results.book.wordCounts){
		path = createSVGElement('path');
		path.setAttribute('d', 'M' + pathCoordinates[word].join(" L "));
		path.setAttribute('stroke', stringToColor(word)); 
		path.setAttribute('stroke-width', '4'); 
		path.setAttribute('fill', 'none');
		svg.appendChild(path); 
	}
};

ResultChart.prototype.appendLabels = function(svg) {
	var extrema, label;
	for(var word in this.results.extrema){
		extrema = this.results.extrema[word]; 
		label = createSVGElement('text');
		label.setAttribute('x', (extrema.maxValueTime * this.pixelPerTime + this.xOffset).toFixed(2));
		label.setAttribute('y', (this.coordSysHeight - extrema.maxValue * this.pixelPerFrequency + this.yOffset - 12).toFixed(2)); 
		label.setAttribute('fill', stringToColor(word));
		label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '24');
		label.textContent = word; 
		svg.appendChild(label); 
	}
};

ResultChart.prototype.appendAxes = function(svg) {
	console.log("HEAOIF"); 
	var labelDistanceInTime = 200 / this.pixelPerTime; 
	for(var i = this.timeFrom; i < this.timeTo; i += labelDistanceInTime){
		label = createSVGElement('text'); 
		label.setAttribute('x', (i * this.pixelPerTime + this.xOffset).toFixed(2));
		label.setAttribute('y', this.height - 5); 
		label.setAttribute('fill', '#111');
		label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '10');
		label.textContent = (new Date(i)).toLocaleDateString();
		svg.appendChild(label); 
	}
};

function createSVGElement(elementType){
	return document.createElementNS("http://www.w3.org/2000/svg", elementType);

}

var stringToColor = function(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var color = '#';
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

module.exports = ResultChart;
