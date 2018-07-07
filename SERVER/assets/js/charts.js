
var dateFormat = 'EE\nd/M', fontName = 'Linotte-Regular';
var loadingIndicator = '<div class="loading-graph"><div class="rect1"></div><div class="rect2"></div><div class="rect3"></div><div class="rect4"></div></div>';//'<div class="loading"></div>';
//var employeesShortlistBkp = [];
var verticalRanges = {
	areaBelow: [0, 29, 'rgba(255, 140, 140, 0.1)'],
	below: [29, 30, 'rgba(240, 50, 50, 0.4)'],
	//average: [50, 80, 'rgba(100, 100, 100, 0.2)'],
	above: [70, 71, 'rgba(50, 140, 240, 0.4)']
}
var redrawCallbackIndex = {objects: [], functions: []};

// ==============================================================================================
// ==============================================================================================
//													Arc.JS Charts
// ==============================================================================================

function ArcChart(context, data, colors, options, callback){
	var _self = this;
	this.data = data;
	//	Default options to use when not provided by programmer
	var defaultOptions = {
		chartArea:{left:40, right:10, bottom:60, top:5},
		//backgroundColor: '#FFFFFF',
		grayDays: 'rgba(160, 160, 160, 0.2)',
		fontColor: '#303030',
		tooltipPosition: 'above',
		points: false,
		curve: 0,
		fillColors: ['none'],
	};
	for (var key in defaultOptions)
		if (typeof options[key] == 'object'){
			for (var skey in defaultOptions[key])
				if (typeof options[key][skey] == 'undefined')
					options[key][skey] = defaultOptions[key][skey];
		}
		else if (typeof options[key] == 'undefined')
			options[key] = defaultOptions[key];
	if (typeof colors == 'undefined'){// || colors.length < _self.data[0].length-1
		colors = ['skyblue', 'yellow', 'lightgreen', 'red', 'purple', 'blue', 'orange', 'green'];
		/*for (var i = 0; i < _self.data[0].length-1; i++)
			colors.push();*/
	}
	//
	//	Create a division to display tooltip
	var tooltip = arc.elem('div', null, {class: 'chartTooltip', style: 'opacity:0;'});
	//
	//	Calculate minimum and maximum values so we can contain the chart withing these bounds - scaling
	var colMax = 0, rowMin = Math.min(), rowMax = 0;
	for (var i = 1; i < _self.data.length; i++){
		if (getVal(_self.data[i][0]) > rowMax)
			rowMax = getVal(_self.data[i][0]);
		if (getVal(_self.data[i][0]) < rowMin)
			rowMin = getVal(_self.data[i][0]);
		for (var j = 1; j < _self.data[i].length; j++)
			if (_self.data[i][j]-colMax > 0)
				colMax = _self.data[i][j];
	}
	//	Default step in X axis - Microseconds per day
	//var xGap = 24*3600000;
	//if (_self.data.length > 1 && !(_self.data[1][0] instanceof Date) && _self.data[1][0].indexOf(':') > -1){
	xGap = 60;
		//rowMin += 280;
		//rowMax -= 280;
	//}
	var graph = elemSVG('svg');
	this.chartType = false;
	//
	this.draw = function(chartType, isRedraw){
		_self.chartType = chartType;
		//	Wait till chart draw area is render-ready
		if (context.offsetWidth == 0 || context.offsetHeight == 0){
			setTimeout(function(){_self.draw(chartType);}, 250);
			return;
		}
		if (colMax == 0){
			context.innerHTML = '<i class="no-chart">No data to display on the chart.</i>';
			return {error: 'No data to display on the chart.'};
		}
		//	Create chart SVG element
		graph = elemSVG('svg', null, {
				width: context.offsetWidth,
				height: context.offsetHeight,
				'font-family': options.fontFamily,
				//'shape-rendering': (chartType=='line'?'':'crispEdges'),
				style: 'background-color:'+options.backgroundColor+';'});
		var chartGrid = elemSVG('g', null, {id: 'grid'});
		var chartArea = elemSVG('g', null, {id: 'chart', transform: 'translate('+options.chartArea.left+', '+options.chartArea.top+')'});
		var chartBG = elemSVG('g', null, {id: 'background', transform: 'translate('+options.chartArea.left+', '+options.chartArea.top+')'});
		//
		//	Calculate chart bounding rectangle
		var areaHeight = context.offsetHeight - options.chartArea.top - options.chartArea.bottom;
		var areaWidth = context.offsetWidth - options.chartArea.left - options.chartArea.right;
		var setWidth = (xGap * areaWidth) / (xGap + rowMax - rowMin);
		var colWidth = (setWidth / (_self.data[0].length))-2, colOffset = 0;
		if (_self.data[0].length == 2)
			colWidth = (setWidth / 1.45)-1;
		if (colWidth > 50){
			/*if (_self.data[0].length == 2)
				colOffset = (setWidth - (colWidth - 51) * (_self.data[0].length-1.75)) / 2;
			else*/
			//colOffset = (setWidth - (colWidth - 51) * (_self.data[0].length-1)) / 2;
			colOffset = (setWidth - (colWidth - 51) * (_self.data[0].length-(_self.data[0].length == 2 ? 1.75 : 2))) / 2;
			colWidth = 48;
		}
		//
		//	Draw horizontal scale lines in the background
		drawHorizontalLine(chartGrid, context, options, topForVal(context, options, areaHeight, colMax, 0), '', '#808080');
		//
		/*{
			var segments = colMax.toString();
			segments = ((segments.substring(0, 1) * 1) + 1) + '0'.repeat(segments.length-1);
		}*/
		if (colMax < 25)
			var segments = Math.ceil(colMax / 20) * 20;
		else
			var segments = Math.ceil(colMax / 50) * 50;
		for (var i = 3; i > 0; i--){
			drawHorizontalLine(chartGrid, context, options, topForVal(context, options, areaHeight, colMax, i*(segments/4)), i*(segments/4), '#D0D0D0');
		}
		//
		//	Draw vertical ranges if specified
		if (typeof options.verticalRanges != 'undefined')
			for (range in options.verticalRanges)
				chartBG.appendChild(elemSVG('rect', null, {
									id: 'range-'+range,
									x: -5,
									y: 10 + (areaHeight * (1 - (options.verticalRanges[range][1] / colMax))),
									width: areaWidth+5,
									height: areaHeight * (options.verticalRanges[range][1]-options.verticalRanges[range][0]) / colMax,
									style: 'fill:'+options.verticalRanges[range][2]+';'
								}));
		//
		//	Determine X Axis label rotate angle if X axis is dense
		var barHeight;
		if (setWidth < 50)
			options.rotateXAxisLabels = 45;
		else
			options.rotateXAxisLabels = undefined;
		//
		//	Prepare lines if line chart
		if (chartType == 'line'){
			var lines = [], line, d, circle, circleHover;
			for (var i = 1; i < _self.data[0].length; i++){
				line = elemSVG('path', null, {'stroke-width': 2, stroke: colors[i-1], d: '', fill: options.fillColors[i-1] || 'none'});
				chartArea.appendChild(line);
				lines.push(line);
			}
		}
		//
		var lastLblX = -100, curve = '';
		//	Draw the chart
		//var prevVal = [];
		for (var i = 1; i < _self.data.length; i++){
			if (_self.data[i].length == 1){
				//	A Gray Day - Date with no data (weekends)
				var rect = elemSVG('rect', null, {
								id: 'date-gray-'+getVal(_self.data[i][0]),
								x: (setWidth * (getVal(_self.data[i][0]) - rowMin) / xGap) + 1 - (_self.data[0].length == 2 ? colWidth/4 : colWidth/2),
								y: 0-options.chartArea.top,
								width: setWidth-2,
								height: areaHeight+(2*options.chartArea.top),
								style: 'fill:'+options.grayDays+';'
							});
				chartBG.appendChild(rect);
			}
			else{
				var group = elemSVG('g', null, {id: 'date-'+getVal(_self.data[i][0]), transform: 'translate('+(setWidth * (getVal(_self.data[i][0]) - rowMin) / xGap)/*+colOffset*/+', 0)'});
				// Draw Column Chart
				if (chartType == 'column'){
					//	Draw columns
					for (var j = 1; j < _self.data[i].length; j++){
						barHeight = _self.data[i][j] * areaHeight / colMax;
						var rect = elemSVG('rect', null, {
										id: 'value-'+_self.data[0][j].toLowerCase().replace(/ /g, '-')+'-'+getVal(_self.data[i][0]),
										x: ((colWidth+1)*(j-1)) + colOffset,//
										y: areaHeight - barHeight + options.chartArea.top,
										width: colWidth,
										height: barHeight,
										style: 'fill:'+colors[j-1]+';'//+
											/*//' -webkit-transform:translatex(-1000px); transform:translatex(-1000px);'+
											' -webkit-animation-delay:'+((j+i*_self.data[i].length)/10)+'s; animation-delay:'+((j+i*_self.data[i].length)/20)+'s;',
										class: 'chart-bar'*/
									});
						new chartBar(tooltip, rect, '<b>'+formatXAxis(_self.data[i][0]).join(' ')+'</b><br>'+_self.data[0][j]+': '+_self.data[i][j], _self.data[i], options);//.toFixed(2)
						group.appendChild(rect);
					}
				}
				//	Draw Line Chart
				else if (chartType == 'line'){
					for (var j = 1; j < _self.data[i].length; j++){
						if (typeof _self.data[i][j] != 'undefined'){
							barHeight = _self.data[i][j] * areaHeight / colMax;
							d = lines[j-1].getAttribute('d');
							/*if (options.curve == 0)
								curve = '';
							else if (d != '')
								curve = ' '+(((setWidth-colWidth)/2) + (setWidth * ( (( options.curve*getVal(_self.data[i-1][0])+getVal(_self.data[i][0]) ) / (options.curve+1)) - rowMin ) / xGap))+' '+
											(areaHeight - ((options.curve*_self.data[i-1][j] + _self.data[i][j]) * areaHeight / ((options.curve+1) * colMax)) + options.chartArea.top)+
										' '+(((setWidth-colWidth)/2) + (setWidth * ( (( getVal(_self.data[i-1][0])+options.curve*getVal(_self.data[i][0]) ) / (options.curve+1)) - rowMin ) / xGap))+' '+
											(areaHeight - ((_self.data[i-1][j] + options.curve*_self.data[i][j]) * areaHeight / ((options.curve+1) * colMax)) + options.chartArea.top);*/
							lines[j-1].setAttribute('d', d+(d == '' ? 'M ' : (' S '+
														(((setWidth-colWidth-(setWidth/50))/2) + (setWidth * (getVal(_self.data[i][0]) - rowMin) / xGap))+','+(areaHeight - barHeight + options.chartArea.top)+' ' ) )+//(0.8*barHeight + 0.2*(_self.data[i-1][j] * areaHeight / colMax))
														(((setWidth-colWidth+(setWidth/120))/2) + (setWidth * (getVal(_self.data[i][0]) - rowMin) / xGap))+','+(areaHeight - barHeight + options.chartArea.top)
													/*+(d == '' && options.curve > 0 ? ' C' : '')*/);
							if (options.points){
								circleHover = elemSVG('g');
								circle = elemSVG('circle', null, {cx: ((setWidth-colWidth)/2), cy: (areaHeight - barHeight + options.chartArea.top), r: (options.points / 2), stroke: 'none', 'stroke-width': 0,
									//fill: (typeof prevVal[j] != 'undefined' && prevVal[j] == _self.data[i][j] ? '#FF0000' : colors[j-1])});
									fill: colors[j-1]});
								circleHover.appendChild(circle);
								circle2 = elemSVG('circle', null, {cx: ((setWidth-colWidth)/2), cy: (areaHeight - barHeight + options.chartArea.top), r: (1 * options.points)+2, fill: 'rgba(255, 255, 255, 0)', class: 'hover'});
								circleHover.appendChild(circle2);
								new chartBar(tooltip, circleHover, '<b>'+formatXAxis(_self.data[i][0]).join(' ')+'</b><br>'+_self.data[0][j]+': '+_self.data[i][j]/*.toFixed(2)*/, _self.data[i], options);//
								group.appendChild(circleHover);
							}
							//prevVal[j] = _self.data[i][j];
						}
					}
				}
				//
				//	Draw txt labels
				if (30 + lastLblX < setWidth * (getVal(_self.data[i][0]) - rowMin) / xGap){
					var txtLbl = elemSVG('g', null, {
							transform: (typeof options.rotateXAxisLabels != 'undefined' ?
										'rotate(-'+options.rotateXAxisLabels+' '+(10+(setWidth/5))+' '+(10+context.offsetHeight-options.chartArea.bottom+options.chartArea.top)+')' : '')
						});
					txtLbl.appendChild(elemSVG('text', formatXAxis(_self.data[i][0])[0], {
						'text-anchor': 'middle',
						'font-size': 12,
						y: areaHeight+20,
						fill: options.fontColor,
						transform: 'translate('+((setWidth/2)-10)+', 5)'}));
					txtLbl.appendChild(elemSVG('text', formatXAxis(_self.data[i][0])[1], {
						'text-anchor': 'middle',
						'font-size': 12,
						y: areaHeight+30,
						fill: options.fontColor,
						transform: 'translate('+((setWidth/2)-10)+', 5)'}));
					group.appendChild(txtLbl);
					//
					lastLblX = setWidth * (getVal(_self.data[i][0]) - rowMin) / xGap;
				}
				chartArea.appendChild(group);
			}
		}
		/*if (chartType == 'line')
			for (var i = 0; i < lines.length; i++)
				chartArea.appendChild(lines[i]);*/
		//
		graph.appendChild(chartGrid);
		graph.appendChild(chartBG);
		graph.appendChild(chartArea);
		context.innerHTML = '';
		context.appendChild(graph);
		context.appendChild(tooltip);
		//
		if (typeof callback != 'undefined')
			callback(_self);
		//
		/*context.ondblclick = function(){
			if (confirm('Do you want to download this graph as SVG file?'))
				downloadSVG(graph, 'Graph for '+document.forms[0].from_date.value+' to '+document.forms[0].to_date.value);
		};*/
		//
		//	Redraw this graph on window resize
		if (typeof isRedraw == 'undefined' || !isRedraw){
			//	var redrawCallbackIndex = {objects: [], functions[]};
			if (redrawCallbackIndex.objects.indexOf(context) > -1){
				var i = redrawCallbackIndex.objects.indexOf(context);
				window.removeEventListener('resize', redrawCallbackIndex.functions[i]);
				redrawCallbackIndex.objects.splice(i, 1);
				redrawCallbackIndex.functions.splice(i, 1);
			}
			redrawCallbackIndex.functions.push(redrawOnResize);
			redrawCallbackIndex.objects.push(context);
			//window.removeEventListener('resize', redrawOnResize);
			window.addEventListener('resize', redrawOnResize, false);
		}
		//
		return graph;
	};
	//
	/*/	Quadratic bezire average
	function qCurve(_self.data, i, options, setWidth, colWidth, rowMin, xGap){
		if (options.curve == 0)
			return '';
		var x = (((setWidth-colWidth)/2) + (setWidth * ( (( getVal(_self.data[i-1][0])+getVal(_self.data[i][0]) ) / 2) - rowMin ) / xGap)),
			y = (_self.data[i-1]+_self.data[i]) / 2;
		return 'q'+x+','+y;
	}*/
	//
	var redrawTimeout,
	redrawOnResize = function(){
			//return function(){
					clearTimeout(redrawTimeout);
					redrawTimeout = setTimeout(function(){
							graph.innerHTML = '';
							_self.draw(_self.chartType, true);
						}, 250);
				//}
			};
	//
	//	Draw a horizontal line in the chart background
	function drawHorizontalLine(graph, context, options, height, value, color){
		graph.appendChild(elemSVG('path', null, {
			d: 'M'+(options.chartArea.left-5)+','+height+
			' L'+(context.offsetWidth-options.chartArea.right)+','+height, stroke: color}));
		graph.appendChild(elemSVG('text', value,
			{'text-anchor': 'end',
			'font-size': 12,
			y: height + 5,
			x: options.chartArea.left - 8,
			fill: options.fontColor}));
	}
	//
	//	Calculate the pixel Y value for a given chart data
	function topForVal(context, options, areaHeight, colMax, val){
		return context.offsetHeight - options.chartArea.bottom + options.chartArea.top - (areaHeight * val / colMax);
	}
	//
	//	Format string for X axis labels
	function formatXAxis(x){
		if (x instanceof Date)
			return [x.toString().substring(16, 24)];
		else
			return [x, ''];
	}
	//
	//	Get X axis absolute value for a DateTime object
	function getVal(x){
		if (x instanceof Date)
			return x.getTime();
		else if (x.indexOf(':') > -1)
			return timeToMts(x);//-600
		else
			return x;
	}
	//
	var hoverLatch = false;
	//	Handle tooltip for chart columns
	context.onmouseover = function(e){
		var rect = context.getBoundingClientRect();
		if (typeof options.tooltipPosition != 'undefined'){
			if (options.tooltipPosition == 'to-right'){
				tooltip.style.top = (e.clientY-rect.top-(tooltip.offsetHeight / 2)+context.offsetTop/*+graph.offsetTop*/)+'px';
				tooltip.style.left = (e.clientX-rect.left+8+context.offsetLeft/*+graph.offsetLeft*/)+'px';
			}
			else{
				tooltip.style.top = (e.clientY-rect.top-(tooltip.offsetHeight*1)+context.offsetTop-10/*+graph.offsetTop*/)+'px';
				tooltip.style.left = (e.clientX-rect.left-(tooltip.offsetWidth/2)+context.offsetLeft/*+graph.offsetLeft*/)+'px';
			}
		}
		else{
			tooltip.style.top = (e.clientY-rect.top-(tooltip.offsetHeight*1)+context.offsetTop-10/*+graph.offsetTop*/)+'px';
			tooltip.style.left = (e.clientX-rect.left-(tooltip.offsetWidth/2)+context.offsetLeft/*+graph.offsetLeft*/)+'px';
		}
		if (tooltip.style.left.substring(0,1) == '-')
			tooltip.style.left = '0px';
		if (tooltip.style.top.substring(0,1) == '-'){
			if (options.tooltipPosition == 'to-right')
				tooltip.style.top = '0px';
			else
				tooltip.style.top = (e.clientY-rect.top+context.offsetTop-20)+'px';
		}
	}
	tooltip.onmouseover = function(){
		hoverLatch = true;
		tooltip.style.opacity = 1;
	}
	tooltip.onmouseout = function(){
		if (!hoverLatch)
			return false
		tooltip.style.opacity = 0;
		hoverLatch = false;
	}
	function chartBar(tooltip, obj, tooltipText, row, options){
		if (typeof options.columnOnclick != 'undefined' && options.columnOnclick != false){
			obj.onclick = function(){
				options.columnOnclick(row);
			}
			obj.style.cursor = 'pointer';
		}
		obj.onmouseover = function(e){
			tooltip.innerHTML = tooltipText;
			if (typeof options.columnOnHover != 'undefined' && options.columnOnHover != false)
				options.columnOnHover(row, tooltip, e);
			//
			tooltip.style.display = 'block';
			tooltip.style.opacity = 1;
		}
		obj.onmouseout = function(){
			if (!hoverLatch){
				tooltip.style.opacity = 0;
			}
		}
	}
}

function elemSVG(tagname, innerHTML, options){
	var obj = document.createElementNS('http://www.w3.org/2000/svg', tagname);
	if (typeof innerHTML !== 'undefined' && innerHTML != null && innerHTML != false)
		obj.innerHTML = innerHTML;
	if (typeof options !== 'undefined')
		for (var key in options)
			obj.setAttribute(key, options[key]);
	return obj;
}

// ==============================================================================================
// ==============================================================================================
//													Google Charts
// ==============================================================================================

function drawOnChart(chart, data){
	var layout = chart.getChartLayoutInterface();
	var chartArea = layout.getChartAreaBoundingBox();
	var svg = chart.getContainer().getElementsByTagName('svg')[0];
	var xLoc = layout.getXLocation(value);
	//
	var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
	line.setAttribute('x1', x1);
	line.setAttribute('y1', y1);
	line.setAttribute('x2', x2);
	line.setAttribute('y2', y2);
	line.setAttribute('stroke', color);
	line.setAttribute('stroke-width', w);
	//
	svg.appendChild(createLine(xLoc,chartArea.top + chartArea.height,xLoc,chartArea.top,'#00cccc',4));
}

function bindChartHover(chart, index, content){
	for (var i in index){
		var user = content.querySelectorAll('[data-id="'+i+'"]')[0];
		if (user != undefined){
			user.onmouseover = function(){
				chart.setSelection([{'column': index[this.getAttribute('data-id')]}]);
			};
			user.onmouseout = function(){
				chart.setSelection([]);
			};
		}
	}
}

function timeToMts(time){
	time = time.split(':');
	return time[0]*60 + (time.length > 1 ? time[1]*1 : 0) + (time.length > 2 ? time[2]/60 : 0);
}
function mtsToTime(time){
	var mts = parseInt(time % 60), hrs = Math.floor(time / 60);
	//time = (time / 60).toString().split('.');
	return hrs+'h '+(mts < 10 ? '0' : '')+mts+'m';
}
function mtsToHrs(time){
	var mts = parseInt(time % 60), hrs = Math.floor(time / 60);
	//time = (time / 60).toString().split('.');
	return (hrs < 10 ? '0' : '')+hrs+':'+(mts < 10 ? '0' : '')+mts;
}
