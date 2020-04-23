var steem     = require('steem')
var dsteem    = require('dsteem')
var utils     = require('./utils.js');
var fs        = require('fs');
var config    = JSON.parse(fs.readFileSync("config.json"));
var client    = new dsteem.Client('https://anyx.io')
const version = 'postpromoter Steemium Fork - 1.0.0';
const wallet  = JSON.parse(fs.readFileSync("wallet.json"));

function checkAmount(bid_transfer, reversal_transfer, reversal_price, steem_price, sbd_price, pubkey) {

  let bid_amount        = parseFloat(bid_transfer.amount)
  let bid_currency      = utils.getCurrency(bid_transfer.amount)
  let reversal_amount   = parseFloat(reversal_transfer.amount)
  let reversal_currency = utils.getCurrency(reversal_transfer.amount)
  
  let bid_usd         = bid_currency == 'STEEM' ? bid_amount * steem_price : bid_amount * sbd_price
  let reversal_usd    = reversal_currency == 'STEEM' ? reversal_amount * steem_price : reversal_amount * sbd_price
  let _reversal_price = bid_usd * reversal_price
  let leftovers_usd   = reversal_usd - _reversal_price

  return leftovers_usd
}

function reverseVote(vote_to_reverse, leftovers_usd, pubkey, reversal_transfer, steem_price, sbd_price, retries) {
  return new Promise(async (resolve, reject) => {
    let postURL  = vote_to_reverse.memo.startsWith('#') ? vote_to_reverse.memo.substring(1) : vote_to_reverse.memo
    let permlink = postURL.substr(postURL.lastIndexOf('/') + 1)
    var author   = postURL.substring(postURL.lastIndexOf('@') + 1, postURL.lastIndexOf('/'))
    const vote   = {
      'voter': wallet.account.name,
      'author': author,
      'permlink': permlink,
      'weight': 0
    }
    // console.log(vote)
    try { 
      await client.broadcast.vote(vote, dsteem.PrivateKey.fromString(wallet.account.posting))
    } catch(e) {
      console.log(e)
      utils.log('Error reversing vote for: @' + vote_to_reverse.from + permlink);
      let already_reversed_err = 'itr->vote_percent != o.weight: Your current vote on this comment is identical to this vote.'
      if (err = already_reversed_err) {
        let memo    = config.transfer_memos['already_reversed']
        memo        = memo.replace(/{postURL}/g, postURL)
        utils.log(memo)
        if (pubkey.length > 0) memo = steem.memo.encode(wallet.account.memo, pubkey, ('#' + memo))
        return client.broadcast.transfer({ amount: reversal_transfer.amount, from: wallet.account.name, to: reversal_transfer.from , memo: memo}, dsteem.PrivateKey.fromString(wallet.account.active))
      }
      // Try again on error
      if(retries < 2) return setTimeout(() => { reverseVote(vote_to_reverse, retries + 1); }, 10000);
      else return reject(err)        
    }
    utils.log('Vote reversed for: @' + vote_to_reverse.from + permlink);
    // if no leftovers we close here
    if (leftovers_usd <= 0) return resolve()
    // send leftovers back
    let currency = utils.getCurrency(reversal_transfer.amount)
    let leftovers = (currency == 'STEEM') ? leftovers_usd / steem_price : leftovers_usd / sbd_price
    leftovers = parseFloat(leftovers).toFixed(3) + ' ' + currency
    let memo = config.transfer_memos['reversal_leftovers']
    memo = memo.replace(/{postURL}/g, postURL);
    utils.log(memo)
    if (pubkey.length > 0) memo = steem.memo.encode(wallet.account.memo, pubkey, ('#' + memo))
    client.broadcast.transfer({ amount: leftovers, from: wallet.account.name, to: reversal_transfer.from, memo: memo}, dsteem.PrivateKey.fromString(wallet.account.active))
    .catch((e) => {
      console.log(e)
    })
    return resolve() 
  })
}

function sendReversalComment(vote_to_reverse) {
  var content = null;

  if(config.comment_reversal_to_author_location && config.comment_reversal_to_author_location != '') {
    content = fs.readFileSync(config.comment_reversal_to_author_location, "utf8");
  } else {
    return utils.log('missing reversal_comment_to_author file or wrong path/location')
  }

  // If promotion content is specified in the config then use it to comment on the upvoted post
  if (content && content != '') {
    var parent_permlink = vote_to_reverse.memo.substr(vote_to_reverse.memo.lastIndexOf('/') + 1)
    var author = vote_to_reverse.memo.substring(vote_to_reverse.memo.lastIndexOf('@') + 1, vote_to_reverse.memo.lastIndexOf('/'))
    // Generate the comment permlink via steemit standard convention
    var permlink = 're-' + author.replace(/\./g, '') + '-' + parent_permlink + '-' + new Date().toISOString().replace(/-|:|\./g, '').toLowerCase();

    // Replace variables in the promotion content
    content = content.replace(/\{permlink\}/g, parent_permlink)
    // content = content.replace(/\{amount\}/g, reversal.amount)
    // content = content.replace(/\{currency\}/g, reversal.currency)

    // Broadcast the comment
    var comment = { 
      author: wallet.account.name, 
      permlink: permlink, 
      parent_author: author, 
      parent_permlink: parent_permlink, 
      title: permlink, 
      body: content, 
      json_metadata: '{"app":"postpromoter/' + version + '"}' 
    };
    // Broadcast the comment
    client.broadcast.comment(comment, dsteem.PrivateKey.fromString(wallet.account.posting))
    .then((res) => utils.log('reversal comment to reversed vote author has been succesfully broadcasted'))
    .catch((e) => {
      utils.log('reversal comment to reversed vote author has NOT been succesfully broadcasted')
      console.log(e)
    })
  }
}

module.exports = {
  checkAmount: checkAmount,
  reverseVote: reverseVote,
  sendReversalComment
}