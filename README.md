# Promobot, Maintained by Steemium

## Note

This is a fork of postpromoter but so far it does not modify any of the original features.

## Additional Features

### Encrypted memos
All incoming requests (vote bids, reversal requests...) can be can now be both encrypted or unencrypted. 

Upon encrypted transfers, postpromoter will always answer encrypting the memo. The postpromoter mechanic downstream will behave normally once memo is decrypted with the bidbot account memo key.

Encrypted memo is enabled out-of-the-box. **No configuration required**.


### Auto discounted account claiming
Bidbots accounts usually have large amounts of unused RC that can be used to claim discounted account creation "tickets".

Enable it under `account_claim_enabled`and set a refresh rate at `claimAccountCountdown`in hours.

### Sell Account Creation
Allow users and dApps to purchase new accounts. Discounted claimed accounts are needed in order to sell accounts.

Enable account selling in config.json under the boolean `account_creation_enabled`.

Set a price for each account creation (in USD) under `create_account_price_usd`(In case more funds are sent, the system will automatically send leftovers along with the confirmation).

The memo *keyword* is **"createaccount"** followed by the new account name, and lastly followed by the owner public key, active public key, posting public key and memo public key (respectively). 

**For ease of use, and in case you just want to provide one single public key for all scopes (owner, active, posting & memo) just provide one single public key (in WIF format) in the memo.**

Account creation transfer memo request can be encrypted.

Transfer Memo example (encrypted): 
```
#createaccount test.account STM7UkRnx6h2oumyYCRBkZYaUZqikyjiFGFvJ8i5vKCnQmCRC8D8W STM7UkRnx6h2oumyYCRBkZYaUZqikyjiFGFvJ8i5vKCnQmCRC8D8W STM7UkRnx6h2oumyYCRBkZYaUZqikyjiFGFvJ8i5vKCnQmCRC8D8W STM7UkRnx6h2oumyYCRBkZYaUZqikyjiFGFvJ8i5vKCnQmCRC8D8W 
```

(*) *No account recovery support is given*


**In order to avoid depleting temporarily your account Resource Credits (RC) it is recommeded to set a conservative `claimAccountCountdown`value at first**

### Reverse votes
Bidbot owners can now set a price for a vote reversal. For instance, *accountA* bids for vote on one of its posts. Then *accountB* sends a vote reversal request for *accountA* post. 
*AccountB* can pay a fraction of the original bid amount paid by *accountA*.

First, enable the reversal in config file (config.json), setting `reversal_enabled` to `true`. 

Second, define a reversal price. For example, 20% of original bid price, set `reversal_price` in config file as `0.20`.
Users will simply send encrypted memos along with the bid with the keyword **"reverse"** before post URL. 

Vote reversal transfer memo request can be encrypted.

Transfer Memo example (encrypted): 
```
#reverse https://steemit/@example/my-example-post-to-reversal 
```
(notice the space between 'reverse' and 'post URL')

#### Steemconnect hot signing links (HSL)
For ease of use, your postpromoter instance will post a HSL on the upvoted post comment. This way, users can easily access the reversal feature without manual transfers. 

With HSL all you need to do is clicking on the link and, when prompted, authenticating via steemconnect.

### Mocha test Module
Tests will target both original and new features making sure your instance and configuration are ready for production. For testing purposes, the test account will post a test-post for testing operations (voting, unvoting etc..)
**Among the tests, these are some of the currently available:**
* Memo encryption / decryption
* dsteem Asynchronous client requests
* Bid for vote under min_bid and confirming a refund
* Bid for vote and confirming vote
* Check via blockchain that refunds have been properly sent
* Sending above vote-reversal price and confirming leftovers have been properly refunded
* Check vote reversal has been succesfully un-casted

**Important: If you want to run tests before production (recommended) please make sure to set in config file a testing account (testing account will serve a a fake/dummy account for bidding and requesting vote reversal)**

````
$ npm test
````
Verbose mode:
```
$ npm run test-verbose
```

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
  "test_min_vp": 1000,
  "reversal_enabled": false,
  "reversal_price": 0.20,
  "claim_account_enabled": false,
  "claimAccountCountdown": 1,
  "create_account_enabled": false,
  "create_account_price_usd": 1,
  "backup_mode": false,
  "disabled_mode": false,
  "detailed_logging": false,
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
  "comment_reversal_location":"comment_reversal.md",
  "comment_reversal__to_author_location":"comment_reversal_to_author.md",
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
    "504": "504",
    "create_acc": "@{name} account creation succeeded. Leftovers included.",
    "invalid_formatting": "Invalid memo formatting",
    "create_acc_taken": "{name} is already taken.",
    "create_acc_insufficient": "Please send at {create_account_price_usd}$ for account creation (Leftovers will be sent back automatically)",
    "already_reversed": "Vote already reversed for {postURL}",
    "reversal_leftovers": "Leftovers from reversal request for {postURL}",
    "reversal_not_found": "The post you request a reversal for could not be found {postURL}",
    "reversal_not_funds": "Your reversal request amount for {postURL} is not enough. Please send {reversal_price}. This services sends back leftovers, so feel free to send a rough estimation",
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

### Fill up wallet.json with your keys for each role
```


  {
    "account": {
      "name": "",
      "active": "",
      "posting":"",
      "memo": "",
    },
    "owner_account": {
      "name": "",
      "active": "",
      "posting":"",
      "memo": "",
    },
    "test_account": {
      "name": "",
      "active": "",
      "posting":"",
      "memo": "",
    },
    "acc_creating_account": {
      "name": "",
      "active": "",
      "posting":"",
      "memo": "",
    },
    "acc_claiming_account": {
      "name": "",
      "active": "",
      "posting":"",
      "memo": "",
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
