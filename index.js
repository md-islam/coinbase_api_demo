var Client = require('node-rest-client').Client;
var client = new Client();
var csv = require('fast-csv');
var csvStream = csv.format({
	headers: true
});
var fs = require('fs');
var ws = fs.createWriteStream("data.csv");

const readline = require('readline');
const r1 = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

var date = new Date();
console.log(date.toString());

var readLineRecursive = function() {

	r1.question('Enter coinbase command: ', function(answer) {
		ans = answer.trim().toUpperCase();
		if (ans.toUpperCase() === "BUY" || ans === "" || ans.toUpperCase() === "SELL") {
			console.log("No amount specified");
			readLineRecursive();

			// case when currency is entered
		} else if (ans.split(" ").length == 3 && (ans.split(" ")[0].toUpperCase() === "BUY" || ans.split(" ")[0].toUpperCase() === "SELL") && ans.split(" ")[1] == parseInt(ans.split(" ")[1], 10) && ans.split(" ")[2].length == 3) {
			console.log("valid input-->", ans.split(" "));
			// direct way 
			var amount_for_btc = ans.split(" ")[1];
			var currency = ans.split(" ")[2].toLowerCase();
			var type = ans.split(" ")[0].toUpperCase();
			client.get("https://api.coinbase.com/v1/currencies/exchange_rates", function(data, response) {

				//Let's do this shit
				var btcToCurrencyKey = "btc_to_".concat(currency);
				var currencyToBtcKey = currency.concat("_to_btc");
				var btcToCurrencyValue = data[btcToCurrencyKey];
				var currencyToBTCValue = data[currencyToBtcKey];
				// console.log(data.usd_to_xau);
				if (btcToCurrencyValue != null && btcToCurrencyValue !== "" && currencyToBTCValue != null && currencyToBTCValue !== "") {
					console.log("Order to", ans.split(" ")[0].toUpperCase(),
						amount_for_btc, currency.toUpperCase(), "worth of BTC queued @", btcToCurrencyValue, "BTC/" + currency.toUpperCase(),
						"(" + currencyToBTCValue * amount_for_btc + " BTC)")


					//Order to BUY 10 USD worth of BTC queued @ 627.98 BTC/USD (0.015529913767197603 BTC)

					writeToCSV({
						"timestamp": new Date().toString(),
						"buy/sell type": type,
						"amount": amount_for_btc,
						"currency": currency,
						"converstionRateToBTC": currencyToBTCValue * amount_for_btc
					});



				}

				readLineRecursive();
			});


		} else if (ans.split(" ").length == 2 && (ans.split(" ")[0].toUpperCase() === "BUY" || ans.split(" ")[0].toUpperCase() === "SELL") && ans.split(" ")[1] == parseInt(ans.split(" ")[1], 10)) { //&& ans.split(" ")[2].length == 3){
			// console.log()
			console.log("Order to", ans.split(" ")[0].toUpperCase(), ans.split(" ")[1], "BTC queued")
			var type = ans.split(" ")[0].toUpperCase();
			var amount_for_btc = ans.split(" ")[1];
			var currency = "BDT";

			client.get("https://api.coinbase.com/v1/currencies/exchange_rates", function(data, response) {
				var btcRate = data.btc_to_btc
				writeToCSV({
					"timestamp": new Date().toString(),
					"buy/sell type": type,
					"amount": amount_for_btc,
					"currency": currency,
					"converstionRateToBTC": btcRate * amount_for_btc
				});

				// console.log("valid input-->", ans.split(" "));
				readLineRecursive();

			});


		} else if (ans.split(" ").length == 1 && ans.split(" ")[0].toUpperCase() === "ORDERS") {
			console.log("ORDERS");
			readFromCSV();
		} else {
			console.log("Enter valid input like 'BUY 10 USD' OR 'SELL 10'")
			readLineRecursive();
		}
	});
};

readLineRecursive();

// ws.on("finish", function(){
// 	console.log("DONE!");
// });


var writeToCSV = function(obj) {
	csvStream.write(obj);
	csvStream.pipe(ws);
}

var readFromCSV = function() {
	var stream = fs.createReadStream("data.csv");
	// var csvStream = csv
	//    .parse()
	//    .on("data", function(data){
	//         console.log(data);
	//    })
	//    .on("end", function(){
	//         console.log("done");
	//    });
	//    stream.pipe(csvStream);
	csv
		.fromStream(stream, {
			headers: ["timestamp", "buy/sell type", "amount", "currency", "converstionRateToBTC"]
		})
		.on("data", function(data) {
			console.log(data);
		})
		.on("end", function() {
			console.log("done");
		});
	readLineRecursive();
}