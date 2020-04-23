var assert = require('chai').assert
var expect = require('chai').expect
var fs     = require('fs')
var config = JSON.parse(fs.readFileSync('config.json'))
var steem  = require('steem')
var dsteem = require('dsteem')
var client = new dsteem.Client('https://anyx.io')
var chalk  = require('chalk')
const ora  = require('ora')

const test_min_vp = config.test_min_vp

if (process.env.verbose) console.log(chalk.bgWhite('testing bidbot account: @' + wallet.account.name + ' | testing bidder account: @' + config.test_account))

function wait (seconds) {
  const spinner = ora('waiting ' + seconds / 1000 + ' seconds\n').start()
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
      spinner.stop()
    }, seconds)
  })
}

function post () {
  return new Promise((resolve, reject) => {
    try {
      const new_permlink = 'postpromoter-steemium-fork-test-' + Date.parse(new Date())
      const test_post = { author: config.test_account, permlink: new_permlink, parent_permlink: 'steemium', parent_author: '', body: 'testing the postpromoter steemium fork', json_metadata: JSON.stringify({ app: 'steemium postpromoter fork' }), title: 'postpromoter-steemium-fork-test-' + Date.parse(new Date()) }
      client.broadcast.comment(test_post, dsteem.PrivateKey.fromString(wallet.test_account.active))
      .then(() => resolve())
    } catch (e) {
      reject(e)
    }
  })
}
// Postpromoter initialisation
require('../postpromoter.js')

setTimeout(function () {
  describe('steemium postpromoter fork test suite', function () {
    describe('async client test and memo encryption/decryption:', function () {
      var bidhistory = []
      var test_account = []
      var testAcc_pubkey = ''
      var amount1 = '0.003 STEEM'
      var amount2 = '0.004 STEEM'
      var amount3 = ''
      var amount4a = ''
      var amount4b = ''
      var min_bid_reversal_price = ''
      // first test, we send just a below min-bid encrypted bid request expecting a full refund
      var memo1 = '#this is just a test ' + Date.parse(new Date())
      // second test, we send a reversal request for a non-existent post in order to check refund
      var memo2 = '#reverse https://steemit.com/@' + wallet.account.name + '/this-is-a-test-post-' + Date.parse(new Date())
      // third, we will send a bid for a vote request on a self created post
      var memo3 = '#https://steemit.com/'
      // fourth, we will request reversal of the vote we just bidded for. One will be below price, the second above price.
      var memo4 = '#reverse '

      var expected_memo1_response = '#' + config.transfer_memos.below_min_bid
      var expected_memo2_response = '#' + config.transfer_memos.reversal_not_found
      // note: Postpromoter does not answer back with memo when bid has been succesfully processed, therefore, we dont test expected memo3 response
      var expected_memo4a_response = '#' + config.transfer_memos.reversal_not_funds
      var expected_memo4b_response = '#' + config.transfer_memos.reversal_leftovers

      var memo1_encrypted; var memo2_encrypted; var memo3_encrypted; var memo4_encrypted = ''
      var op1; var op2; var op3; var op4 = []
      var test_post		= {}
      var decrypt_num = 0
      var comment_history = []
      var last_post		= ''
      var vp = 10000
      var already_voted = false

      var expected_leftover = Math.random() // we randomize a expected leftovers; in other words, we randomise an "above reversal price" amount for the reversal request test

      before(async function () {
        // check there is enough VP for the tests
        const account = await client.database.call('get_accounts', [[wallet.account.name]])
        vp = account[0].voting_power
        if (vp < test_min_vp) throw new Error('not enough VP')
        // try posting a test-post
        try {
          await post()
        } catch (e) {
          // check if already existing test post and not voted
          test_account = await client.database.call('get_accounts', [[config.test_account]])
          testAcc_pubkey = test_account[0].memo_key
          comment_history = await client.database.call('get_account_history', [config.test_account, -1, 50])
          comment_history = comment_history.filter((x) => x[1].op[0] == 'comment' && x[1].op[1].author == config.test_account).map((x) => x[1].op[1])
          last_post = comment_history[comment_history.length - 1]
          const content = await client.database.call('get_content', [last_post.author, last_post.permlink])
          const vote = content.active_votes.find((x) => x.voter == wallet.account.name)

          if (last_post && last_post.permlink.indexOf('postpromoter-steemium-fork-test-') > -1 && (!vote || vote.weight == 0)) {
            if (process.env.verbose) console.log(chalk.italic.yellow('there is already an existing testing post => ' + last_post.permlink))
            test_post = { author: config.test_account, permlink: last_post.permlink, parent_permlink: 'steemium', parent_author: '', body: 'testing the postpromoter steemium fork', json_metadata: JSON.stringify({ app: 'steemium postpromoter fork' }), title: 'postpromoter-steemium-fork-test-' + Date.parse(new Date()) }
          } else { // try posting again
            if (process.env.verbose) console.log(chalk.italic.yellow('posting a new test-post: ' + new_permlink))
            await post(test_post)
          }
        }

        memo3 = memo3 + '@' + test_post.author + '/' + test_post.permlink
        memo4 = memo4 + 'https://steemit.com/@' + test_post.author + '/' + test_post.permlink

        amount3 = parseFloat(config.min_bid).toFixed(3) + ' STEEM'
        amount4a = '0.003 STEEM'
        amount4b = parseFloat(config.reversal_price * config.min_bid + expected_leftover).toFixed(3) + ' STEEM'
        min_bid_reversal_price = parseFloat(config.reversal_price * config.min_bid).toFixed(3) + ' STEEM' // the price (based on reversal price %) required to reverse a min_bid vote

        memo1_encrypted = steem.memo.encode(config.memo_key, testAcc_pubkey, memo1)
        memo2_encrypted = steem.memo.encode(config.memo_key, testAcc_pubkey, memo2)
        memo3_encrypted = steem.memo.encode(config.memo_key, testAcc_pubkey, memo3)
        memo4_encrypted = steem.memo.encode(config.memo_key, testAcc_pubkey, memo4)

        op1 = { amount: amount1, from: config.test_account, to: wallet.account.name, memo: memo1_encrypted }
        op2 = { amount: amount2, from: config.test_account, to: wallet.account.name, memo: memo2_encrypted }
        op3 = { amount: amount3, from: config.test_account, to: wallet.account.name, memo: memo3_encrypted }
        op4a = { amount: amount4a, from: config.test_account, to: wallet.account.name, memo: memo4_encrypted }
        op4b = { amount: amount4b, from: config.test_account, to: wallet.account.name, memo: memo4_encrypted }

        expected_memo1_response = expected_memo1_response.replace(/{amount}/g, amount1).replace(/{min_bid}/g, config.min_bid)
        expected_memo2_response = expected_memo2_response.replace(/{postURL}/g, memo2.split(' ')[1])
        expected_memo4a_response = expected_memo4a_response.replace(/{postURL}/g, memo4.split(' ')[1]).replace(/{reversal_price}/g, min_bid_reversal_price)
        expected_memo4b_response = expected_memo4b_response.replace(/{postURL}/g, memo4.split(' ')[1])

        if (process.env.verbose) {
          console.log(chalk.italic.green('memo1 ' + memo1))
          console.log(chalk.italic.green('memo2 ' + memo2))
          console.log(chalk.italic.green('memo3 ' + memo3))
          console.log(chalk.italic.green('memo4 ' + memo4))
          // console.log('memo3 ' + memo3)
          console.log('expected_memo1_response \n' + chalk.bold.blue(expected_memo1_response))
          console.log('expected_memo2_response \n' + chalk.bold.blue(expected_memo2_response))
          console.log('expected_memo4a_response \n' + chalk.bold.blue(expected_memo4a_response))
          console.log('expected_memo4b_response \n' + chalk.bold.blue(expected_memo4b_response))
        }
      })
      it('should encrypt and decript a memo', () => {
        assert.equal(memo1, steem.memo.decode(wallet.test_account.memo, memo1_encrypted))
      })
      it('should send a encrypted below min_bid', function () {
        // PP WORKS ONLY WITH OPS WITH TRX_ID, VIRTUAL OPS HAVE NO TRX_ID AND THEREFORE ARE IGNORED BY PP
        // note: Mocha supports Promises out-of-the-box, you just have to return the Promise. If it resolves then the test passes otherwise it fails.
        return client.broadcast.transfer(op1, dsteem.PrivateKey.fromString(wallet.test_account.active))
      })
      it('should send a encrypted reversal request for a non-existent post', async function () {
        this.retries(2)
        await wait(3000)
        return client.broadcast.transfer(op2, dsteem.PrivateKey.fromString(wallet.test_account.active))
      })
      it('should request via steem rpc node the trx history of test account', async function () {
        bidhistory = await client.database.call('get_account_history', [config.test_account, -1, 50])
        expect(bidhistory).to.have.length(51)
      })
      it('should decrypt at least two transfer memos from trx history', async function () {
        this.retries(5)
        await wait(15000)
        bidhistory = await client.database.call('get_account_history', [config.test_account, -1, 4])
        // console.log(bidhistory)
        bidhistory = bidhistory.map((x) => x[1].op[1])
        // console.log(bidhistory)
        bidhistory.forEach((bid) => {
          if (bid.memo && bid.memo.startsWith('#')) {
            bid.memo = steem.memo.decode(wallet.test_account.memo, bid.memo)
            decrypt_num++
          }
        })
        // console.log(bidhistory)
        expect(decrypt_num).to.be.least(2)
      })
      it('should find the under min-bid encrypted bid transfer', async function () {
        this.retries(5)
        await wait(15000)
        bidhistory = await client.database.call('get_account_history', [config.test_account, -1, 10])
        bidhistory = bidhistory.map((x) => x[1].op[1])
        bidhistory.forEach((op) => {
          if (op.memo && op.memo.startsWith('#')) {
            op.memo = steem.memo.decode(wallet.test_account.memo, op.memo)
          }
        })
        if (process.env.verbose) {
				    console.log(bidhistory.map((op) => op.memo))
			    	console.log(chalk.underline.red('should match: ' + memo1))
        }
        bidhistory = bidhistory.filter((op) => op.memo == memo1 && op.from == config.test_account)
        expect(bidhistory).to.have.length(1)
      })
      it('should find the reversal transfer for the non-existent post', async function () {
        this.retries(5)
        await wait(10000)
        bidhistory = await client.database.call('get_account_history', [config.test_account, -1, 10])
        bidhistory = bidhistory.map((x) => x[1].op[1])
        bidhistory.forEach((op) => {
          if (op.memo && op.memo.startsWith('#')) {
            op.memo = steem.memo.decode(wallet.test_account.memo, op.memo)
          }
        })
        if (process.env.verbose) {
				    console.log(bidhistory.map((op) => op.memo))
				    console.log(chalk.underline.red('should match: ' + memo2))
        }
        bidhistory = bidhistory.filter((op) => op.memo == memo2 && op.from == config.test_account)
        expect(bidhistory).to.have.length(1)
      })
      it('should find the under min-bid encrypted bid refund', async function () {
        this.retries(5)
        await wait(15000)
        bidhistory = await client.database.call('get_account_history', [config.test_account, -1, 10])
        bidhistory = bidhistory.map((x) => x[1].op[1])
        bidhistory.forEach((op) => {
          if (op.memo && op.memo.startsWith('#')) {
            op.memo = steem.memo.decode(wallet.test_account.memo, op.memo)
          }
        })
        if (process.env.verbose) {
				    console.log(bidhistory.map((op) => op.memo))
				    console.log(chalk.underline.red('should match: ' + expected_memo1_response))
        }
        bidhistory = bidhistory.filter((op) => op.memo == expected_memo1_response && op.from == wallet.account.name)
        expect(bidhistory.length).to.be.least(1)
      })
      it('should find the below-price reversal request refund', async function () {
        this.retries(5)
        await wait(10000)
        bidhistory = await client.database.call('get_account_history', [config.test_account, -1, 10])
        bidhistory = bidhistory.map((x) => x[1].op[1])
        bidhistory.forEach((op) => {
          if (op.memo && op.memo.startsWith('#')) {
            op.memo = steem.memo.decode(wallet.test_account.memo, op.memo)
          }
        })
        if (process.env.verbose) {
				    console.log(bidhistory.map((op) => op.memo))
				    console.log(chalk.underline.red('should match: ' + expected_memo2_response))
        }
        bidhistory = bidhistory.filter((op) => op.memo == expected_memo2_response && op.from == wallet.account.name)
        expect(bidhistory).to.have.length(1)
      })
      it('should bid on the test post for the min-bid amount', function () {
        return client.broadcast.transfer(op3, dsteem.PrivateKey.fromString(wallet.test_account.active))
      })
      it('should cast the vote', async function () {
        this.retries(10)
        await wait(15000)
        const content = await client.database.call('get_content', [test_post.author, test_post.permlink])
        const vote = content.active_votes.find((x) => x.voter == wallet.account.name)
        expect(vote).to.not.have.property('weight', 0)
        console.log(test_post.permlink)
        console.log(vote)
      })
      // it('should manually vote on the test post', function () {
      // 	if (already_voted) this.skip()
      // 	return client.broadcast.vote({ voter: wallet.account.name, author: test_post.author, permlink: test_post.permlink, weight: 1000 }, dsteem.PrivateKey.fromString(config.posting_key))
      // })
      it('should request a reversal for the last min-bid vote via encrypted memo with insufficient funds', function () {
        return client.broadcast.transfer(op4a, dsteem.PrivateKey.fromString(wallet.test_account.active))
      })
      it('should request a reversal for the last min-bid vote via encrypted memo with more funds than necessary', function () {
        return client.broadcast.transfer(op4b, dsteem.PrivateKey.fromString(wallet.test_account.active))
      })
      it('should find the insufficient funds reversal refund', async function () {
        this.retries(5)
        await wait(15000)
        bidhistory = await client.database.call('get_account_history', [config.test_account, -1, 10])
        bidhistory = bidhistory.map((x) => x[1].op[1])
        bidhistory.forEach((op) => {
          if (op.memo && op.memo.startsWith('#')) {
            op.memo = steem.memo.decode(wallet.test_account.memo, op.memo)
          }
        })
        if (process.env.verbose) {
				    console.log(bidhistory.map((op) => op.memo))
				    console.log(chalk.underline.red('should match: ' + expected_memo4a_response))
        }
        bidhistory = bidhistory.filter((op) => op.memo == expected_memo4a_response && op.from == wallet.account.name)
        expect(bidhistory.length).to.be.least(1)
      })
      it('should reverse the vote', async function () {
        this.retries(5)
        await wait(15000)
        comment_history = await client.database.call('get_account_history', [config.test_account, -1, 50])
        comment_history = comment_history.filter((x) => x[1].op[0] == 'comment' && x[1].op[1].author == config.test_account).map((x) => x[1].op[1])
        last_post = comment_history[comment_history.length - 1]
        const content = await client.database.call('get_content', [last_post.author, last_post.permlink])
        const vote = content.active_votes.find((x) => x.voter == wallet.account.name)
        expect(vote).to.be.an('object')
        assert.isAbove(vote.weight, 0)
      })
      it('should find leftovers reversal refund', async function () {
        this.retries(5)
        await wait(15000)
        bidhistory = await client.database.call('get_account_history', [config.test_account, -1, 10])
        bidhistory = bidhistory.map((x) => x[1].op[1])
        bidhistory.forEach((op) => {
          if (op.memo && op.memo.startsWith('#')) {
            op.memo = steem.memo.decode(wallet.test_account.memo, op.memo)
          }
        })
        if (process.env.verbose) {
				    console.log(bidhistory.map((op) => op.memo))
				    console.log(chalk.underline.red('should match: ' + expected_memo4b_response))
        }
        bidhistory = bidhistory.filter((op) => op.memo == expected_memo4b_response && op.from == wallet.account.name)
        expect(bidhistory.length).to.be.least(1)
      })
    })
  })

  run()
}, 5000)
