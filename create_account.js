const dsteem     = require('dsteem')
const fs         = require('fs')
const config     = JSON.parse(fs.readFileSync('./config.json'))
const client     = new dsteem.Client('https://api.steemit.com')
const active_key = dsteem.PrivateKey.fromString(wallet.acc_creating_account.active)
const steem      = require('steem');
var utils        = require('./utils.js')

//TODO: pass client as argument or as module export 
async function createAccount(wordsArray) {
	let newAccount = wordsArray[1]
	let ownerPubKey, activePubKey, postingPubKey, memoPubKey
	//create keys for new account
	if (wordsArray.length == 6) {
		ownerPubKey   = wordsArray[2]
		activePubKey  = wordsArray[3]
		postingPubKey = wordsArray[4]
		memoPubKey    = wordsArray[5]			
	} else {
		ownerPubKey   = wordsArray[2]
		activePubKey  = wordsArray[2]
		postingPubKey = wordsArray[2]
		memoPubKey    = wordsArray[2]				
	}

	const ownerAuth = {
	    weight_threshold: 1,
	    account_auths: [],
	    key_auths: [[ownerPubKey, 1]],
	}
	const activeAuth = {
	    weight_threshold: 1,
	    account_auths: [],
	    key_auths: [[activePubKey, 1]],
	}
	const postingAuth = {
	    weight_threshold: 1,
	    account_auths: [],
	    key_auths: [[memoPubKey, 1]],
	}

	// then create discounted account operation
	const create_op = [
	    'create_claimed_account',
	    {
	        creator: config.account,
	        new_account_name: newAccount,
	        owner: ownerAuth,
	        active: activeAuth,
	        posting: postingAuth,
	        memo_key: memoPubKey,
	        json_metadata: '',
	        extensions: [],
	    }
	]

	//check if account exists       
	var _account = await client.database.call('get_accounts', [[newAccount]])
	//account not available to register
	if (_account.length > 0) {
		throw new Error('account name already taken')
	} else {
		utils.log('account is available')
		return client.broadcast.sendOperations([create_op], active_key)
	}
}

module.exports = {
	createAccount: createAccount
}