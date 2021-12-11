/*
 * These hooks are called by the Aragon Buidler plugin during the start task's lifecycle. Use them to perform custom tasks at certain entry points of the development build process, like deploying a token before a proxy is initialized, etc.
 *
 * Link them to the main buidler config file (buidler.config.js) in the `aragon.hooks` property.
 *
 * All hooks receive two parameters:
 * 1) A params object that may contain other objects that pertain to the particular hook.
 * 2) A "bre" or BuidlerRuntimeEnvironment object that contains enviroment objects like web3, Truffle artifacts, etc.
 *
 * Please see AragonConfigHooks, in the plugin's types for further details on these interfaces.
 * https://github.com/aragon/buidler-aragon/blob/develop/src/types.ts#L31
 */
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deployTestToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-test-token");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
const { networks } = require("../buidler.config");

const tokens = ['ETH', "DAI"]
const errorHandler = err => {
  if (err) throw err;
};

// ganache addresses
let appManager
let superfluidDeployer
let alice, bob

let vault
let superfluid
let tokenToContract = {}

module.exports = {
  // Called before a dao is deployed.
  preDao: async ({ log }, { web3, artifacts }) => { },

  // Called after a dao is deployed.
  postDao: async (
    { dao, _experimentalAppInstaller, log },
    { web3, artifacts }
  ) => {
    await _getAccounts(web3)
    await _deployVault()
    await _deploySuperfluidFramework(web3)
    await _deployTokens(web3)
    await _initializeSuperfluidFramework(web3)
    await _getTokenAddresses(web3)
    console.log(`> Block number: ${await web3.eth.getBlockNumber()}`)
  },

  // Called after the app's proxy is created, but before it's initialized.
  preInit: async (
    { proxy, _experimentalAppInstaller, log },
    { web3, artifacts }
  ) => { },

  // Called after the app's proxy is initialized.
  postInit: async (
    { proxy, _experimentalAppInstaller, log },
    { web3, artifacts }
  ) => { },

  // Called when the start task needs to know the app proxy's init parameters.
  // Must return an array with the proxy's init parameters.
  getInitParams: async ({ log }, { web3, artifacts }) => {
    return [vault.address, superfluid.host.address, superfluid.agreements.cfa.address]
  },

  // Called after the app's proxy is updated with a new implementation.
  postUpdate: async ({ proxy, log }, { web3, artifacts }) => { },
}

async function _getAccounts(web3) {
  ([appManager, superfluidDeployer, alice, bob] = await web3.eth.getAccounts())
}

async function _deployVault() {
  const VaultMock = artifacts.require('VaultMock')

  vault = await VaultMock.new({ from: appManager })
  console.log(`> Vault deployed: ${vault.address}`)
}

async function _deploySuperfluidFramework(web3) {
  console.log("> Deploying Superfluid framework...")
  await deployFramework(errorHandler, {
    web3,
    from: superfluidDeployer,
  });
}

async function _initializeSuperfluidFramework(web3) {
  superfluid = new SuperfluidSDK.Framework({
    web3,
    version: "test",
    tokens: tokens
  });
  await superfluid.initialize()
}

async function _deployTokens(web3) {
  console.log("> Deploying tokens...")
  for (const token of tokens) {
    await deployTestToken(errorHandler, [":", token], {
      web3,
      from: superfluidDeployer
    });
    await deploySuperToken(errorHandler, [":", token], {
      web3,
      from: superfluidDeployer
    });
  }
  console.log("> Tokens deployed")
}

async function _getTokenAddresses(web3) {
  tokens.forEach(async token => {
    const superToken = `${token}x`
    tokenToContract[superToken] = superfluid.tokens[superToken];
    tokenToContract[token] = await superfluid.contracts.TestToken.at(await superfluid.tokens[token].address);
  })
}

async function _printState(web3) {

}
