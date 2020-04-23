var fs                    = require("fs");
var config                = JSON.parse(fs.readFileSync("config.json"));
const SEC                 = 1000, MIN = SEC * 60, HOUR = MIN * 60
var dsteem				  = require('dsteem')
var utils                 = require('./utils.js')
var client				  = new dsteem.Client('https://api.steemit.com')

let current_hour          = new Date().getHours()
let current_min           = new Date().getMinutes()
let claimAccountCountdown = (current_hour % config.claimAccountCountdown) * HOUR  + current_min * MIN


if (config.claim_account_enabled) {
	utils.log('claimAccount func will start in ' + claimAccountCountdown / MIN + ' min')
	setTimeout(function(){claimAccount()}, claimAccountCountdown)
}

async function claimAccount () {
	utils.log('claiming account')
	const claim_op = [ "claim_account", { creator: wallet.acc_claiming_account.name, fee: "0.000 STEEM", extensions: [] } ]
	var ops = []
	ops.push(claim_op)
	//broadcast operation to blockchain
	client.broadcast.sendOperations(ops, dsteem.PrivateKey.fromString(wallet.acc_claiming_account.active))
	.then((res) => console.log(res))
	.catch((e) => utils.logger.error(e))
	setTimeout(function(){claimAccount()}, config.claimAccountCountdown * HOUR)
}

module.exports = {
	claimAccount: claimAccount
}