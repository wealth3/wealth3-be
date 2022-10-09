import * as PushAPI from "@pushprotocol/restapi";
import * as ethers from "ethers";
import fetch from "node-fetch"
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
const PK = process.env.PRIVATE_KEY; // channel private key
const Pkey = `0x${PK}`;
const signer = new ethers.Wallet(Pkey);
const sendNotification = async(recipient, amount) => {
  try {
    const apiResponse = await PushAPI.payloads.sendNotification({
      signer,
      type: 3, // target
      identityType: 2, // direct payload
      notification: {
        title: `Your Wealth3 vault is expiring soon!`,
        body: `Please enter your Wealth3 dashboard to make a new deposit or update your Proof of Life, otherwise your vault will expire and your ${ethers.utils.formatEther(amount)} ETH will be executed soon.`
      },
      payload: {
        title: `Your Wealth3 vault is expiring soon!`,
        body: `Please enter your Wealth3 dashboard to make a new deposit or update your Proof of Life, otherwise your vault will expire and your ${ethers.utils.formatEther(amount)} ETH will be executed soon.`,
        cta: 'https://wealth3.app',
        img: ''
      },
      recipients: `eip155:5:${recipient}`, // recipient address
      channel: 'eip155:5:0x8919029c7F6343F1475A7A121e3d4568CA6D0d2E', // your channel address
      env: 'staging'
    });
    
    // apiResponse?.status === 204, if sent successfully!
    console.log('API repsonse: ', apiResponse);
  } catch (err) {
    console.error('Error: ', err);
  }
}
const subgraph = "https://api.thegraph.com/subgraphs/name/bilinkis/wealth3";
let query = `{\n  vaults(first:1000){ \n id \n contractTime \n lastProofOfLife \n amount \n proofOfLifeFreq}  }`
  let body = JSON.stringify({
    query: query,
  });

  let vaults = await fetch(subgraph, {
    method: "POST",
    body: body,
    headers: {
      "Content-Type": "application/json",
    },
  });
  let { data } = await vaults.json();
  console.log(data.vaults)
  for (let i = 0; i<data.vaults.length;i++){
    console.log()
    if((Date.now() + 60 * 60 * 24 * 30) < (data.vaults[i].lastProofOfLife + data.vaults[i].proofOfLifeFreq)){
      await sendNotification(data.vaults[i].id, data.vaults[i].amount)
    }
  }


//sendNotification();