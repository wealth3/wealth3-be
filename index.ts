import Web3 from 'web3';
import * as path from 'path';
import { promises as fsp } from 'fs';
import { encode } from 'js-base64';
import { SSVKeys, KeyShares } from 'ssv-keys';

const operators = require('./internal-data/operators.json');
const keystore = require('./internal-data/keystore.json');
const operatorIds = require('./internal-data/operator-ids.json');
const keystorePassword = 'testtest';

async function abi_test() {
  let infura_url = 'https://goerli.infura.io/v3/';
  let publicKey = '0x59Efa6032F32C258CCC9644f68E8C9BCc9DDF737';
  let privateKey = '';

  let GoerliDepositAddress = "0xff50ed3d0ec03aC01D4C79aAd74928BFF48a7b2b";
  let GoerliABIPath = './contracts/goerli-abi.json';
  let depositDataPath = './deposit-cli/validator_keys/deposit-data.json';

  let web3 = new Web3(infura_url);
  web3.eth.accounts.wallet.add(privateKey);
/*
  let GoerliABI = JSON.parse(await fsp.readFile(GoerliABIPath, 'utf8'));
  let GoerliDepositContract = new web3.eth.Contract(GoerliABI, GoerliDepositAddress);

  let { pubkey, withdrawal_credentials, signature, deposit_data_root } = JSON.parse(await fsp.readFile(depositDataPath, 'utf8'))[0];

  pubkey = '0x' + pubkey;
  withdrawal_credentials = '0x' + withdrawal_credentials;
  signature = '0x' + signature;
  deposit_data_root = '0x' + deposit_data_root;

  let estimatedGas = await GoerliDepositContract.methods.deposit(pubkey, withdrawal_credentials, signature, deposit_data_root).estimateGas({ from: publicKey, value: 32e18 });

  GoerliDepositContract.methods.deposit(pubkey, withdrawal_credentials, signature, deposit_data_root).send({ 
    from: publicKey,
    value: 32e18,
    gas: estimatedGas,
  }).on('transactionHash', function(hash: String) {
    console.log('transactionHash', hash);
  }).on('confirmation', function(confirmationNumber: Number, receipt: Object) {
      
  }).on('receipt', function(receipt: Object) {
    
  });
*/


  let SSVNetworkAddress = '0xb9e155e65B5c4D66df28Da8E9a0957f06F11Bc04';
  let SSVNetworkABIPath = './contracts/ssv-network-abi.json';

  let ssvKeys = new SSVKeys();
  let keyStorePrivKey = await ssvKeys.getPrivateKeyFromKeystoreData(keystore, keystorePassword);
  let shares = await ssvKeys.buildShares(keyStorePrivKey, operatorIds, operators);

  let sharePublicKeys = shares.map((share) => share.publicKey);
  let shareEncrypted = shares.map((share) => web3.eth.abi.encodeParameter('string', share.privateKey));

  let SSVNetworkABI = JSON.parse(await fsp.readFile(SSVNetworkABIPath, 'utf8'));
  let SSVNetworkContract = new web3.eth.Contract(SSVNetworkABI, SSVNetworkAddress);

console.log(web3.eth.abi.encodeParameters(['uint32[]'], [operatorIds]), 
operatorIds);

  let registerGas = await SSVNetworkContract.methods.registerValidator(
    ssvKeys.getValidatorPublicKey(),
    operatorIds.map((op: any) => op.toString()),
    sharePublicKeys,
    shareEncrypted,
    '24890317213500000000'
  ).estimateGas({
    from: publicKey
  });



  console.log(
    ssvKeys.getValidatorPublicKey(),
    operatorIds.map(op => op.toString()),
    sharePublicKeys,
    shareEncrypted,
    '24890317213500000000'
  );

    // console.log('gas', registerGas);


}

void abi_test();  
// 
