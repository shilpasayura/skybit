
var mysql = require('mysql');

module.exports = function(logger, config){

	_this = this,
	this.connection = null,
	this.retryTimeout = 2000,

	this.connect = function(config){
		if (typeof config.databaseConnection == 'undefined' || typeof config.databaseConnection.retryMinTimeout == 'undefined')
			config.databaseConnection = {retryMinTimeout: 2000, retryMaxTimeout: 60000};
		_this.retryTimeout = config.databaseConnection.retryMinTimeout;
		//
		_this.persistantConnection();
		//
		return _this.connection;
	},

	this.persistantConnection = function(){
		try{
			_this.connection.end();
		}catch(e){}
		//
		_this.connection = mysql.createConnection(config.database);
		_this.connection.connect(
			function (err){
				if (err){
					logger.error('Error connecting to database: '+err.code);
					setTimeout(_this.persistantConnection, _this.retryTimeout);
					logger.log('Retrying in '+(_this.retryTimeout / 1000)+' seconds');
					if (_this.retryTimeout < config.databaseConnection.retryMaxTimeout)
						_this.retryTimeout += 1000;
				}
				else{
					_this.retryTimeout = config.databaseConnection.retryMinTimeout;
					logger.log('Connected to database');
				}
			}
		);
		_this.connection.on('error',
			function (err){
				logger.error('Database error: '+err.code);
				if (err.code === 'PROTOCOL_CONNECTION_LOST')
					_this.persistantConnection();
			}
		);
	}

};
