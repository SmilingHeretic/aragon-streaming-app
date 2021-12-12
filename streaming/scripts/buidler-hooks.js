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
const { hash } = require('eth-ens-namehash')
const { networks } = require("../buidler.config");

const tokens = ['WETH', "DAI"]

const errorHandler = err => {
  if (err) throw err;
};

const newApp = async (dao, appName, baseAppAddress, rootAccount) => {
  const receipt = await dao.newAppInstance(
    hash(`${appName}.aragonpm.test`), // appId - Unique identifier for each app installed in the DAO; can be any bytes32 string in the tests.
    baseAppAddress, // appBase - Location of the app's base implementation.
    '0x', // initializePayload - Used to instantiate and initialize the proxy in the same call (if given a non-empty bytes string).
    false, // setDefault - Whether the app proxy is the default proxy.
    { from: rootAccount }
  )

  // Find the deployed proxy address in the tx logs.
  const logs = receipt.logs
  const log = logs.find((l) => l.event === 'NewAppProxy')
  const proxyAddress = log.args.proxy

  return proxyAddress
}

// ganache addresses
let appManager
let superfluidDeployer
let alice, bob

let acl
let vault
let streaming
let superfluid
let tokenToContract = {}

const INITIAL_TOKENS_AMOUNT = "2"
const INITIAL_SUPER_TOKENS_AMOUNT = "1.5"

module.exports = {
  // Called before a dao is deployed.
  preDao: async ({ log }, { web3, artifacts }) => { },

  // Called after a dao is deployed.
  postDao: async (
    { dao, _experimentalAppInstaller, log },
    { web3, artifacts }
  ) => {
    // Get ACL
    acl = await artifacts.require("ACL").at(await dao.acl());

    await _getAccounts(web3)
    await _deployVault(dao)
    await _deploySuperfluidFramework(web3)
    await _deployTokens(web3)
    await _initializeSuperfluidFramework(web3)
    await _getTokenContracts(web3)
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
  ) => {
    streaming = proxy
    await _mintTokens(web3)
    await _upgradeTokens(web3)
    await _openStreams(web3)
    await _printTokenBalances(web3)
    await _printStreams(web3)
  },

  // Called when the start task needs to know the app proxy's init parameters.
  // Must return an array with the proxy's init parameters.
  getInitParams: async ({ log }, { web3, artifacts }) => {
    const superTokenAddresses = tokens.map(token => _getSuperTokenAddress(token))
    return [vault.address, superfluid.host.address, superfluid.agreements.cfa.address, superTokenAddresses]
  },

  // Called after the app's proxy is updated with a new implementation.
  postUpdate: async ({ proxy, log }, { web3, artifacts }) => { },
}

async function _getAccounts(web3) {
  ([appManager, superfluidDeployer, alice, bob] = await web3.eth.getAccounts())
}

async function _deployVault(dao) {
  const Vault = artifacts.require('Vault.sol')
  const vaultBase = await Vault.new()
  const proxyAddressVault = await newApp(dao, 'vault', vaultBase.address, appManager)
  vault = await Vault.at(proxyAddressVault)
  vault.initialize()
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

async function _getTokenContracts(web3) {
  for (const token of tokens) {
    const superToken = _tokenToSuper(token)
    tokenToContract[superToken] = superfluid.tokens[superToken];
    tokenToContract[token] = await superfluid.contracts.TestToken.at(await superfluid.tokens[token].address);
  }
}

async function _mintTokens(web3) {
  for (const address of [vault.address, alice]) {
    for (const token of tokens) {
      await tokenToContract[token].mint(address, web3.utils.toWei(INITIAL_TOKENS_AMOUNT), { from: appManager })
    }
  }
}

async function _whitelistSuperTokens(web3) {
  const WHITELIST_SUPER_TOKEN_ROLE = await streaming.WHITELIST_SUPER_TOKEN_ROLE()
  await acl.createPermission(
    alice,
    streaming.address,
    WHITELIST_SUPER_TOKEN_ROLE,
    appManager,
    { from: appManager }
  );
  for (const token of tokens) {
    await streaming.whitelistSuperToken(_getSuperTokenAddress(token), { from: alice })
  }
}

async function _upgradeTokens(web3) {
  for (const token of tokens) {
    await tokenToContract[token].approve(_getSuperTokenAddress(token), web3.utils.toWei(INITIAL_TOKENS_AMOUNT), { from: alice })
    await tokenToContract[_tokenToSuper(token)].upgrade(web3.utils.toWei(INITIAL_TOKENS_AMOUNT), { from: alice })
    await tokenToContract[_tokenToSuper(token)].transfer(streaming.address, web3.utils.toWei(INITIAL_SUPER_TOKENS_AMOUNT), { from: alice })
  }
}

async function _openStreams(web3) {
  await superfluid.user({
    address: alice,
    token: _getSuperTokenAddress("WETH")
  }).flow({ flowRate: "10000000000000", recipient: streaming.address });

  await superfluid.user({
    address: alice,
    token: _getSuperTokenAddress("DAI")
  }).flow({ flowRate: "20000000000000", recipient: streaming.address });
}


async function _printTokenBalances(web3) {
  console.log(`> Block number: ${await web3.eth.getBlockNumber()}`)

  const users = [
    { name: 'streaming', address: streaming.address },
    { name: 'vault', address: vault.address },
    { name: 'alice', address: alice }
  ]

  for (const user of users) {
    console.log(`Name: ${user.name}, address: ${user.address}`)
    for (const token of tokens) {
      console.log(`Token: ${token}, balance: ${await tokenToContract[token].balanceOf(user.address)}`)
      console.log(`Token: ${_tokenToSuper(token)}, balance: ${await tokenToContract[_tokenToSuper(token)].balanceOf(user.address)}`)
    }
  }
}

async function _printStreams(web3) {
  for (const token of tokens) {
    const details = (await superfluid.user({
      address: alice,
      token: _getSuperTokenAddress(token)
    }).details()).cfa
    console.log("Alice's streams")
    console.log(token)
    console.log(details)
    console.log("outFlows")
    console.log(details.flows.outFlows)
  }

}

function _tokenToSuper(token) {
  return `${token}x`
}

function _getSuperTokenAddress(token) {
  return tokenToContract[_tokenToSuper(token)].address
}