const chrome = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");

async function search(searchText) {
  searchText = searchText.replace("#", "%23");
  const browser = await puppeteer.launch({
    args: chrome.args,
    executablePath: await chrome.executablePath,
    headless: chrome.headless,
  });
  const page = await browser.newPage();
  await page.goto(
    `https://twitter.com/search?f=tweets&vertical=default&q=${searchText}`
  );
  const tweets = await page.evaluate(function() {
    const TWEET_SELECTOR = ".js-stream-tweet";
    let elements = Array.from(document.querySelectorAll(TWEET_SELECTOR));
    let ret = [];
    for (var i = 0; i < elements.length; i += 1) {
      let tweet = {};
      const TWEET_TEXT_SELECTOR = ".tweet-text";
      tweet.text = elements[i].querySelector(TWEET_TEXT_SELECTOR).textContent;

      const TWEET_TIMESTAMP_SELECTOR = ".tweet-timestamp";
      tweet.timestamp = elements[i]
        .querySelector(TWEET_TIMESTAMP_SELECTOR)
        .getAttribute("title");

      const TWEET_ID_SELECTOR = "data-tweet-id";
      tweet.id = elements[i].getAttribute(TWEET_ID_SELECTOR);

      const TWEET_USERNAME = ".username";
      tweet.username = elements[i].querySelector(TWEET_USERNAME).textContent;

      const TWEET_NAME = ".fullname";
      tweet.name = elements[i].querySelector(TWEET_NAME).textContent;

      const TWEET_AVATAR = ".avatar";
      tweet.avatar = elements[i]
        .querySelector(TWEET_AVATAR)
        .getAttribute("src");

      ret.push(tweet);
    }
    return ret;
  });

  await browser.close();

  return tweets;
}

module.exports = async function(req, res) {
  console.log(req.query.search);
  const tweets = await search(req.query.search);
  res.statusCode = 200;
  res.json(tweets);
};
