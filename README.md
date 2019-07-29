# Steemium PostPromoter Fork

## Intro
This fork does not modify any of the original postpromoter features.

This fork expands the original postpromoter capabilities with new features, but always tries to respect the original code by integrating new modules and by trying to modify the main module as little as possible.


## Fork Features
  ### Encrypted memos
  Bids and vote reversal requests can now be both encrypted or unencrypted. Upon encrypted transfers, postpromoter will always answer encrypting the memo.
  ### Reverse bids
  Bidbot owners can now set a price for a vote reversal. For instance, accountA bids for vote on one of its posts. Then accountB sends a vote reversal request for accountA post. 
  AccountB can pay a fraction of the original bid amount paid by account A.
  ### Auto account claiming
Since bidbots account will usually sit on large amounts of SP, it is often convenient to expend RC (resource credits) on new accounts.
  ### Mocha test Module
Since we are implementing relatively new and complex features, we want to make sure there is a open available testing module so that each user can independently make sure everything works before going into production.
**Among the tests, these are some of the currently available:**
* Memo encryption / decryption
* dsteem Asynchronous client requests
* Bid for vote under min_bid and confirming a refund
* Bid for vote and confirming vote
* Check via blockchain that refunds have been properly sent
* Sending above vote-reversal price and confirming leftovers have been properly refunded

## Encryted memo configuration

Encrypted memo is enabled out-of-the-box. **No configuration required**. Upon encrypted memo detection, the postpromoter mechanic downstream will behave normally once memo is decrypted with the bidbot memo key.

## Reversal configuration

First, enable the reversal in config file (config.json), setting 'reversal_mode' to `true`. 

Second, define a reversal price. For example, 25% of original bid price, set `reversal_price' in config file as '0.25'.
Users will simply send encrypted memos along with the bid with the keyword "reversal" before post URL. 

For example: 
```
"#reverse https://steemit/@example/my-example-post-to-reversal" 
```
(notice the space between 'reverse' and 'post URL')


## Installation
```
$ git clone https://github.com/AusPrinzip/postpromoter.git
$ npm install
```

## Configuration
First rename config-example.json to config.json:
```
$ mv config-example.json config.json
```

Then set the following options in config.json:
```
{
  "rpc_nodes": [
    "https://api.steemit.com",
    "https://rpc.buildteam.io",
    "https://steemd.minnowsupportproject.org",
    "https://steemd.privex.io",
    "https://gtg.steem.house:8090"
  ],
  "reversal_mode": false,
  "reversal_price": 0.10,
  "backup_mode": false,
  "disabled_mode": false,
  "detailed_logging": false,
  "owner_account": "bot_owner_account_name",
  "account": "your_bot_account_name",
  "memo_key": "your_private_memo_key",
  "posting_key": "your_private_posting_key",
  "active_key": "your_private_active_key",
  "test_account": "your_testing_account",
  "test_memo_key": "memo_test_key",
  "test_posting_key":"`posting_test_key",
  "test_active_key":"active_test_key",
  "auto_claim_rewards" : true,
  "post_rewards_withdrawal_account": "withdraw_liquid_post_rewards_to_account",
  "min_bid": 0.1,
  "max_bid": 50,
  "max_bid_whitelist": 999,
  "batch_vote_weight": 100,
  "min_post_age": 20,
  "max_post_age": 84,
  "allow_comments": false,
  "currencies_accepted": ["SBD", "STEEM"],
  "refunds_enabled": true,
  "min_refund_amount": 0.002,
  "no_refund": ["bittrex", "poloniex", "openledger", "blocktrades", "minnowbooster", "ginabot"],
  "comment_location": "comment.md",
  "max_per_author_per_round": 1,
  "price_source": "bittrex",
  "blacklist_settings": {
    "flag_signal_accounts": ["spaminator", "cheetah", "steemcleaners", "mack-bot"],
    "blacklist_location": "blacklist",
    "shared_blacklist_location": "",
    "whitelist_location": "",
    "whitelist_only": false,
    "refund_blacklist": false,
    "blacklist_donation_account": "steemcleaners",
    "blacklisted_tags": ["nsfw"],
    "global_api_blacklists": ["buildawhale", "steemcleaners", "minnowbooster"]
  },
  "auto_withdrawal": {
    "active": true,
    "accounts": [
      {
        "name": "$delegators",
        "stake": 8000,
        "overrides": [
          { "name": "delegator_account", "beneficiary": "beneficiary_account" }
        ]
      },
      {
        "name": "yabapmatt",
        "stake": 2000
      }
    ],
    "frequency": "daily",
    "execute_time": 20,
    "memo": "# Daily Earnings - {balance} | Thank you!"
  },
  "affiliates": [
    { "name": "memo_prefix", "fee_pct": 150, "beneficiary": "payout_account" }
  ],
  "api": {
    "enabled": true,
    "port": 3000
  },
  "transfer_memos": {
    "already_reversed": "Vote already reversed for {postURL}",
    "reversal_leftovers": "Leftovers from reversal request for {postURL}",
    "reversal_not_found": "The post you request a reversal for could not be found {postURL}",
    "reversal_not_funds": "Your reversal request sent amount {amount} is not enough for {postURL}. Please send {reversal_price}% of the original bid value to be reversed in STEEM or SBD. This services sends back leftovers, so feel free to send a rough estimation",
    "bot_disabled": "Refund for invalid bid: {amount} - The bot is currently disabled.",
    "below_min_bid": "Refund for invalid bid: {amount} - Min bid amount is {min_bid}.",
    "above_max_bid": "Refund for invalid bid: {amount} - Max bid amount is {max_bid}.",
    "above_max_bid_whitelist": "Refund for invalid bid: {amount} - Max bid amount for whitelisted users is {max_bid_whitelist}.",
    "invalid_currency": "Refund for invalid bid: {amount} - Bids in {currency} are not accepted.",
    "no_comments": "Refund for invalid bid: {amount} - Bids not allowed on comments.",
    "already_voted": "Refund for invalid bid: {amount} - Bot already voted on this post.",
    "max_age": "Refund for invalid bid: {amount} - Posts cannot be older than {max_age}.",
    "min_age": "Your bid has been added to the following round since the post is less than {min_age} minutes old.",
    "invalid_post_url": "Refund for invalid bid: {amount} - Invalid post URL in memo.",
    "blacklist_refund": "Refund for invalid bid: {amount} - The author of this post is on the blacklist.",
    "blacklist_no_refund": "Bid is invalid - The author of this post is on the blacklist.",
    "blacklist_donation": "Bid from blacklisted/flagged user sent as a donation. Thank you!",
    "flag_refund": "Refund for invalid bid: {amount} - This post has been flagged by one or more spam / abuse indicator accounts.",
    "flag_no_refund": "Bid is invalid - This post has been flagged by one or more spam / abuse indicator accounts.",
    "blacklist_tag": "Bid is invalid - This post contains the [{tag}] tag which is not allowed by this bot.",
    "bids_per_round": "Bid is invalid - This author already has the maximum number of allowed bids in this round.",
    "round_full": "The current bidding round is full. Your bid has been submitted into the following round.",
    "next_round_full": "Cannot deliver min return for this size bid in the current or next round. Please try a smaller bid amount.",
    "forward_payment": "Payment forwarded from @{tag}.",
    "whitelist_only": "Bid is invalid - Only posts by whitelisted authors are accepted by this bot.",
    "affiliate": "Affiliate payment - {tag}"
  }
}

```

### Blacklist
You can add a list users whose bids will not be accepted and who will not receive any refund by adding their Steem account to the "blacklist" file. Set the "blacklist_location" property to point to the location of your blacklist file, or you can use a URL to point to a shared blacklist on the internet. The file should contain only one steem account name on each line and nothing else as in the following example:

```
blacklisted_account_1
blacklisted_account_2
blacklisted_account_3
```

Additionally you can add a list of "flag_signal_accounts" which means that if any accounts on that list have flagged the post at the time the bid is sent then the bot will treat it as blacklisted.

## Run
```
$ nodejs postpromoter.js
```

This will run the process in the foreground which is not recommended. We recommend using a tool such as [PM2](http://pm2.keymetrics.io/) to run the process in the background as well as providing many other great features.

## API Setup
If you would like to use the API functionality set the "api.enabled" setting to "true" and choose a port. You can test if it is working locally by running:

```
$ curl http://localhost:port/api/bids
```

If that returns a JSON object with bids then it is working.

It is recommended to set up an nginx reverse proxy server (or something similar) to forward requests on port 80 to the postpromoter nodejs server. For instructions on how to do that please see: https://medium.com/@utkarsh_verma/configure-nginx-as-a-web-server-and-reverse-proxy-for-nodejs-application-on-aws-ubuntu-16-04-server-872922e21d38

In order to be used on the bot tracker website it will also need an SSL certificate. For instructions to get and install a free SSL certificate see: https://certbot.eff.org/
