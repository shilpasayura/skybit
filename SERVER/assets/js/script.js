
arc.nav('index', q('#index')[0], function(context, params){
	var ul = context.q('ul')[0];
	arc.ajax('/nodes', {
		method: 'GET',
		callback: function(data){
			data = JSON.parse(data.responseText);
			ul.innerHTML = '';
			for (var i = 0; i < data.nodes.length; i++)
				ul.appendChild(arc.elem('li', '<a href="#node/'+data.nodes[i]+'">'+data.nodes[i]+'</a>'));
		}
	});
});

var chartsReloadTimeout;
var lex = {'SOM': ['Soil Moisture', '#3366cc'],
		'STM': ['Soil Temperature', '#cc3366'],
		'HUM': ['Humidity', '#33cc66'],
		'LTL': ['Light Level', '#cc6633'],
		'ATM': ['Air Temperature', '#cc6633'],
		'PRS': ['Pressure', '#6644bb'],
		'CO2': ['CO2 Level', '#666666']};
arc.nav('node', q('#node')[0], function(context, params){
	var h2 = context.q('h2')[0];
	var ul = context.q('ul')[0];
	h2.innerHTML = params[0];
	var refresh = function(){
		arc.ajax('/node/'+params[0], {
			method: 'GET',
			callback: function(data){
				data = JSON.parse(data.responseText);
				graphData = {}, attribs = [];
				for (var i = 0; i < data.data.length; i++){
					if (typeof graphData[ data.data[i].attrib ] == 'undefined'){
						graphData[ data.data[i].attrib ] = [['Time', data.data[i].attrib]];
						attribs.push(data.data[i].attrib);
					}
					graphData[ data.data[i].attrib ].push([new Date(data.data[i].timestamp), data.data[i].value]);
				}
				ul.innerHTML = '';
				for (var attr in lex)
					if (attribs.indexOf(attr) > -1){
						var group = arc.elem('li');
						group.appendChild(arc.elem('h3', lex[attr][0]));
						var chartArea = group.appendChild(arc.elem('div', null, {class: 'chart'}));
						ul.appendChild(group);
						//
						var chart = new ArcChart(chartArea, graphData[ attr ], [lex[attr][1]],
							{
								chartArea:{left:40, right:20, bottom:60, top:10},
								//fontFamily: 'Linotte-Regular',
								points: 6,
								curve: 0
							});
						var res = chart.draw('line');
					}
				//console.log(graphData);
				chartsReloadTimeout = setTimeout(refresh, 2500);
			}
		});
	};
	refresh();
}, function(){
	clearTimeout(chartsReloadTimeout);
});

if (window.location.hash == '#index')
	window.onpopstate();
else
	window.location.hash = '#index';