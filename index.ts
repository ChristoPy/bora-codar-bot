import { AtpAgent } from "@atproto/api";
import { TwitterApi } from "twitter-api-v2";
import { CronJob } from "cron";

interface QuoteResponse {
  quote: string;
}

const agent = new AtpAgent({
  service: "https://bsky.social",
});

// Create a Twitter client (if credentials are provided)
// The client variable can be of type TwitterApi or undefined
let twitterClient: TwitterApi | undefined;

if (
  process.env.TWITTER_APP_KEY &&
  process.env.TWITTER_APP_SECRET &&
  process.env.TWITTER_ACCESS_TOKEN &&
  process.env.TWITTER_ACCESS_SECRET
) {
  twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY,
    appSecret: process.env.TWITTER_APP_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  });
  console.log("Twitter client configured.");
} else {
  console.log("Twitter credentials not found, skipping client setup.");
}

async function main() {
  console.log("Cron job triggered. Fetching quote...");

  try {
    const response = await fetch("https://www.horadecodar.dev/api/get-quote");

    if (!response.ok) {
      throw new Error(`Failed to fetch quote: ${response.statusText}`);
    }

    const data = (await response.json()) as QuoteResponse;
    const quote = data.quote;
    console.log(`Quote fetched: "${quote}"`);

    // 2. Post to Bluesky (if credentials exist)
    if (process.env.BLUESKY_USERNAME && process.env.BLUESKY_PASSWORD) {
      try {
        await agent.login({
          identifier: process.env.BLUESKY_USERNAME,
          password: process.env.BLUESKY_PASSWORD,
        });
        await agent.post({
          repo: agent.session?.did, // Use the agent's session DID
          collection: "app.bsky.feed.post",
          record: {
            text: quote,
            createdAt: new Date().toISOString(),
          },
        });
        console.log("Successfully posted on Bluesky!");
      } catch (error) {
        console.error("Error posting to Bluesky:", error);
      }
    } else {
      console.log("Bluesky credentials not found, skipping post.");
    }

    // 3. Post to Twitter (if client was initialized)
    if (twitterClient) {
      try {
        await twitterClient.v2.tweet(quote);
        console.log("Successfully posted on Twitter!");
      } catch (error) {
        console.error("Error posting to Twitter:", error);
      }
    } else {
      console.log("Twitter client not configured, skipping post.");
    }
  } catch (error) {
    console.error("An error occurred in the main function:", error);
  }
}

// --- Cron Job Setup ---
// Run daily at 9 am
const scheduleExpression = "0 9 * * *";

console.log("Setting up daily cron job...");
const job = new CronJob(scheduleExpression, main);

job.start();

console.log(
  `Bot started. Next post scheduled for: ${job
    .nextDate()
    .toFormat("yyyy-MM-dd HH:mm:ss")}`
);
