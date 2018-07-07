
module.exports = function(runningLog, rows){

	this.log = function(txt){
		if (typeof txt == 'object')
			txt = JSON.stringify(txt);
		console.log(txt);
		runningLog.push(['info', txt]);
		this.trim();
	};

	this.warn = function(txt){
		if (typeof txt == 'object')
			txt = JSON.stringify(txt);
		console.warn('\x1b[33m' + txt + '\x1b[0m');
		runningLog.push(['warn', txt]);
		this.trim();
	};

	this.error = function(txt){
		if (typeof txt == 'object')
			txt = JSON.stringify(txt);
		console.error('\x1b[31m' + txt + '\x1b[0m');
		runningLog.push(['error', txt]);
		this.trim();
	};

	this.trim = function(){
		while (runningLog.length > rows)
			runningLog.shift();
	};

};
