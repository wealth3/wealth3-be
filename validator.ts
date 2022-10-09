import Web3 from 'web3';
import fs from 'fs';
import { SSVKeys, KeyShares } from 'ssv-keys';

// We'll be using default operators for the generation of keyshares
// Top 4 operators on SSV Network as per 10/9
const operators = require('./internal-data/operators.json');
const operatorIds = require('./internal-data/operator-ids.json');

// Keystore passwords for everything is 'testtest'
const keystorePassword = 'testtest';

// Constants used for web3
const infura_url = 'https://goerli.infura.io/v3/48a593ad67094cbf84b0af0d4abba3b9';

// Hardcode wallet that will be doing the deposits of ETH
// TODO: Use the PoolOperator address once 32 ETH has been deposited overall
const publicKey = '0x59Efa6032F32C258CCC9644f68E8C9BCc9DDF737';
const privateKey = '0x268cbd1c09d4ba7940377c1655719dfd663cecfc7145d21d9b5444a00b643186';

// Create web3.js element and connect wallet
const web3 = new Web3(infura_url);
web3.eth.accounts.wallet.add(privateKey);

// Count of deposits that have been used
// Deposits are being done over validators that were generated previously through the
// ./deposit new-mnemonic command
// TODO: Save on environment variable
let used_deposits = 2;

// Contract addresses
const GoerliDepositAddress = '0xd6fc34c065cf912db3dc4e91b79597faece7d1ed'; // 0.0001 deposit
// const GoerliDepositAddress = '0xff50ed3d0ec03aC01D4C79aAd74928BFF48a7b2b'; // 32 ETH deposit
const SSVNetworkAddress = '0xb9e155e65B5c4D66df28Da8E9a0957f06F11Bc04'; // 

// Contracts ABIs path, loading and generation
const GoerliABIPath = './contracts/goerli-abi.json';
const GoerliABI = JSON.parse(fs.readFileSync(GoerliABIPath, 'utf8'));
const GoerliDepositContract = new web3.eth.Contract(GoerliABI, GoerliDepositAddress);
const SSVNetworkABIPath = './contracts/ssv-network-abi.json';
const SSVNetworkABI = JSON.parse(fs.readFileSync(SSVNetworkABIPath, 'utf8'));
const SSVNetworkContract = new web3.eth.Contract(SSVNetworkABI, SSVNetworkAddress);

// Validator keys deposit information path
const depositDataPath = './deposit-cli/validator_keys/deposit-data.json';

// Function that will be depositing funds to activate a validator, once the transaction is confirmed, we register the validator using SSV.network
async function depositValidator() {
  console.log('depositValidator');

  // Read from latest used deposit, the information required to interact with the deposit contract.
  let { pubkey, withdrawal_credentials, signature, deposit_data_root } = JSON.parse(fs.readFileSync(depositDataPath, 'utf8'))[used_deposits];

  pubkey = '0x' + pubkey; withdrawal_credentials = '0x' + withdrawal_credentials;
  signature = '0x' + signature; deposit_data_root = '0x' + deposit_data_root;

  let value = web3.utils.toWei('0.0001', 'ether');

  let estimatedGas = await GoerliDepositContract.methods.deposit(pubkey, withdrawal_credentials, signature, deposit_data_root).estimateGas({ from: publicKey, value });
  
  GoerliDepositContract.methods.deposit(pubkey, withdrawal_credentials, signature, deposit_data_root).send({ 
    from: publicKey,
    value,
    gas: estimatedGas,
  }).on('transactionHash', function(hash: String) {
    console.log('Deposit validator tx hash:', hash);
  }).on('receipt', async function(receipt: Object) {
    await registerValidator();

    // Update the used_deposits for the next deposit
    used_deposits++;
  });

  // TODO: In case of error revert the used deposits.
} 

// Function that will be registering a validator on SSV.network once the deposit has been made
async function registerValidator() {
  console.log('registerValidator');

  // Share building using ssv-keys
  let ssvKeys = new SSVKeys();
  let keystore = JSON.parse(fs.readFileSync(`./internal-data/keystore-${used_deposits}.json`, 'utf8'));
  let keyStorePrivKey = await ssvKeys.getPrivateKeyFromKeystoreData(keystore, keystorePassword);
  let shares = await ssvKeys.buildShares(keyStorePrivKey, operatorIds, operators);

  // Generate information required for the registerValidator method
  let operatorIdsParsed = operatorIds.map((op: any) => op.toString());
  let sharePublicKeys = shares.map((share) => share.publicKey);
  let shareEncrypted = shares.map((share) => web3.eth.abi.encodeParameter('string', share.privateKey));
  let SSVAmount = web3.utils.toWei("30", "ether"); 
  // TODO: Make the amount of SSV a variable
  // Allow the amount to be handled by the smart contract

  let registerGas = await SSVNetworkContract.methods.registerValidator(ssvKeys.getValidatorPublicKey(), operatorIdsParsed, sharePublicKeys, shareEncrypted, SSVAmount).estimateGas({
    from: publicKey
  });

  SSVNetworkContract.methods.registerValidator(
    ssvKeys.getValidatorPublicKey(),
    operatorIdsParsed,
    sharePublicKeys,
    shareEncrypted,
    SSVAmount
  ).send({ from: publicKey, gas: registerGas * 2 })
  .on('transactionHash', function(hash: String) {
    console.log('Register validator tx hash:', hash);
  }).on('receipt', function(receipt: Object) {
    console.log('Registered validator');
  });

  // TODO: Handle error cases
}

export {
  depositValidator,
  registerValidator
};
