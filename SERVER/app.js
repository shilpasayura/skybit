
var fs = require('fs');
var express = require('express');

//	Load configurations
var config = JSON.parse(fs.readFileSync(__dirname+'/config.json', 'UTF-8'));

var recentData = {};
var runningLog = [];
var logging = require('./logger');
var logger = new logging(runningLog, 42);

// Establish persistant database connection
var connection = (new (require('./dbConn'))(logger, config)).connect(config);

var app = express();

// Import web observability layer
require('./observability')(app, config, connection, logger, recentData, runningLog);

// Start listening for requests
app.listen(config.port, function (){
	logger.log('WetBit is listening on port '+config.port);
});

var SerialPort = require('serialport');
var serialPort = new SerialPort('/dev/ttyACM0', {
	baudRate: 115000
});

var packet = '';
serialPort.on('data',
	function(data){
		data = data.toString().trim();
		if (data != ''){
			packet += data;
			//console.log(data);
			if (data.indexOf('}') > -1){
				processPacket(packet.substring(packet.indexOf('{')+1, packet.indexOf('}')));
				packet = packet.substring(packet.indexOf('}')+1);
			}
		}
	}
);

function processPacket(data){
	data = data.split(':');
	/*data[0] = 'testing';
	pushData = {'timestamp': new Date(), 'soil_moisture': data[2], 'soil_temperature': data[3], 'humidity': data[4],
				'light_level': data[5], 'air_temperature': data[6], 'co2_level': data[7], 'pressure': data[8]};*/
	pushData = {'node_id': data[0], 'timestamp': new Date(), 'attrib': data[3], 'value': data[4]};
	//
	if (typeof recentData[ data[0] ] == 'undefined')
		recentData[ data[0] ] = [];
	//
	recentData[ data[0] ].push(pushData);
	if (recentData[ data[0] ].length > 150)
		recentData[ data[0] ].shift();
	//
	connection.query('INSERT INTO record SET ?', pushData,
		function(err, result){
			if (err)
				console.log(err);
		});
	console.log(data);
/*
'nodeid',
'timestamp',
'soil_moisture',
'soil_temperature',
'humidity',
'light_level',
'air_temperature',
'co2_level',
'pressure'
*/
}
