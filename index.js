import  { BskyAgent} from '@atproto/api';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { CronJob } from 'cron';
import * as process from 'process';

dotenv.config();


// Create a Bluesky Agent
const agent = new BskyAgent({
  "service": "https://bsky.social"
})

async function main() {

  await agent.login({
    identifier: process.env.BLUESKY_USERNAME,
    password: process.env.BLUESKY_PASSWORD,
  });
  try {
    const response = await axios.get(
      "https://www.horadecodar.dev/api/get-quote"
    );
    const quote = response.data.quote;
    await agent.post({
      text: quote,
    });
    console.log("Just posted!");
  } catch (error) {
    console.error(error);
  }
}

// main();


// Run this on a cron job
//const scheduleExpressionMinute = '* * * * *'; // Run once every minute for testing
const scheduleExpression = "0 9 * * *"; // Run daily, at 9 am

const job = new CronJob(scheduleExpression, main); // change to scheduleExpressionMinute for testing

 job.start();
