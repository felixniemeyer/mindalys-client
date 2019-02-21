import TinyDatePicker from 'tiny-date-picker'; 
import ResultChart from './chart-generator.js';
import './style.scss';
import '../node_modules/tiny-date-picker/tiny-date-picker.min.css'

var timestamp = 0; 
var datepickFrom, datepickTo; 

function init() {
	updateTimestamp()
	document.getElementById('paper').focus();
	document.getElementById('post-button').addEventListener('click', post);
	datepickFrom = TinyDatePicker(document.getElementById('datepick-from'), { mode: 'dp-permanent' });
	datepickTo = TinyDatePicker(document.getElementById('datepick-to'), { mode: 'dp-permanent' });
	document.getElementById('analyze-button').addEventListener('click', analyze); 
	datepickTo.setState({
		selectedDate: new Date(),
		highlightedDate: new Date()
	});
	datepickFrom.setState({
		selectedDate: new Date("2017-01-01"),
		highlightedDate: new Date("2016-04-01")
	});
}

function updateTimestamp() {
	timestamp = Date.now(); 
	document.getElementById('date').textContent = Date(timestamp).toLocaleString(); 
}

function setAnalysisStatus(msg, color) {
	var statusDiv = document.getElementById('analysis-status');
	statusDiv.textContent = msg; 
	statusDiv.style.color = color || "#a00";
}

var getNumericSetting = function(setting, specialValues, factor){
	var value = document.getElementById(setting).value; 
	factor = factor || 1;
	specialValues = specialValues || [];
	if(specialValues.indexOf(value) >= 0) {
		return value; 
	} else {
		value = Number(value);
		if(isNaN(value)){
			setAnalysisStatus(`${setting} has to be a number or ${specialValues.join(', ')}`);
			return undefined; 
		} else {
			return value * factor; //days => millisecs
		}
	}
}

function analyze() {
	setAnalysisStatus('analyzing...', '#00a');
	if(datepickFrom.state.selectedDate == null || datepickTo.state.selectedDate == null) {
		setAnalysisStatus('no dates specified');
		return; 
	}
	var from = datepickFrom.state.selectedDate.getTime();
	var to = datepickTo.state.selectedDate.getTime();
	if(from >= to) {
		setAnalysisStatus('from date must be earlier than to date'); 
		return; 
	}
	var kernelRadius = getNumericSetting('kernel-radius', ['auto'], 24 * 60 * 60 * 1000);
	var stepSize = getNumericSetting('step-size', ['auto'], 24 * 60 * 60 * 1000);
	if(kernelRadius == 'auto'){
		if(stepSize == 'auto'){
			stepSize = (to - from) / 20; 
		}
		kernelRadius = 5*stepSize;
	} else if(stepSize == 'auto'){
		stepSize = kernelRadius / 5;
	}
	var user = document.getElementById('user').value;
	var book = document.getElementById('book').value;

	console.log('analyzing');
	var req = new XMLHttpRequest(); 
	req.addEventListener('load', function() {
		try {
			var results = JSON.parse(this.responseText); 
		} catch(err) {
			console.log(`Failed to parse analyze response: ${err}`); 
			return; 
		};
		displayChart(results, from, to); 
	});
	req.open('POST', '/analyze');
	req.setRequestHeader('Content-Type', 'application/json'); 
	req.send(JSON.stringify({
		user: user, 
		book: book,
		from: from, 
		to: to,
		kernelRadius: kernelRadius,
		stepSize: stepSize,
		minFrequencyPeak: getNumericSetting('min-frequency-peak'),
		minOccurences: getNumericSetting('min-occurences')
	}));
}

function displayChart(results, from, to){
  setAnalysisStatus('');
	var chartContainer = document.getElementById('chart-container');
	chartContainer.innerHTML = ""; 
	var maxFrequency = 0; 
	for(var word in results.extrema) {
		if(results.extrema[word].maxValue > maxFrequency){
			maxFrequency = results.extrema[word].maxValue;
		}
	}
	console.log(maxFrequency); 
	var chart = new ResultChart(
		results,
		from, 
		0,
		to, 
		maxFrequency,
		1024*10,
		1024*2/3*0.8);
	var svg = chart.generateSvg();
	chartContainer.appendChild(svg); 
}

function post() {
	console.log('posting'); 
	var req = new XMLHttpRequest(); 
	req.addEventListener('load', function() {
		console.log("success? " + this.responseText); 
		if(this.responseText == 'success'){
			document.getElementById('paper').textContent = '';
			updateTimestamp();
		} else {
			document.getElementById('post-button').style['background-color'] = '#ff2222'; 
		}
	});
	req.open('POST', '/post'); 
	req.setRequestHeader('Content-Type', 'application/json');
	req.send(JSON.stringify({
		user: document.getElementById('user').value,
		book: document.getElementById('book').value,
		text: document.getElementById('paper').textContent,
		timestamp: timestamp
	})); 
}

init();

if('serviceWorker' in navigator)
{
	console.log('Service worker available');
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js').then(
			registration => {
				console.log('registration successful. Scope = ' + registration.scope);
			},
			err => {
				console.log('registration failed: ' + err); 
			}
		)}	
	);
} else {
	console.log('Service worker not supported'); 
}
