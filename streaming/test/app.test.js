const { assert } = require('chai')
const { assertRevert } = require('@aragon/contract-test-helpers/assertThrow')
const { newDao, newApp } = require('./helpers/dao')
const { setOpenPermission } = require('./helpers/permissions')

const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deployTestToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-test-token");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
const SuperfluidSDK = require("@superfluid-finance/js-sdk");

const Streaming = artifacts.require('Streaming.sol')
const VaultMock = artifacts.require('VaultMock.sol')

const tokens = ['WETH', "DAI"]
const errorHandler = err => {
  if (err) throw err;
};




contract('Streaming', ([appManager, superfluidDeployer, alice, bob]) => {
  let appBase
  let vault
  let streaming
  let superfluid
  let tokenToContract = {}

  const INITIAL_TOKENS_AMOUNT = "2"
  const INITIAL_SUPER_TOKENS_AMOUNT = "1.5"

  // a lot of duplicated code from buidler-hooks.js. It's a good idea to import the functions from one place later.
  before('deploy dao and app', async () => {
    // Deploy the app's base contract.
    const { dao, acl } = await newDao(appManager)

    // Deploy the app's base contract.
    const appBase = await Streaming.new()

    // deploy Superfluid framework
    await deployFramework(errorHandler, {
      web3,
      from: superfluidDeployer,
    });

    // deploy tokens
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

    // initialize Superfluid Framework
    superfluid = new SuperfluidSDK.Framework({
      web3,
      version: "test",
      tokens: tokens
    });
    await superfluid.initialize()


    // get token contracts
    for (const token of tokens) {
      const superToken = _tokenToSuper(token)
      tokenToContract[superToken] = superfluid.tokens[superToken];
      tokenToContract[token] = await superfluid.contracts.TestToken.at(await superfluid.tokens[token].address);
    }


    // deploy vault
    vault = await VaultMock.new({ from: appManager })

    // mint tokens
    for (const address of [vault.address]) {
      for (const token of tokens) {
        await tokenToContract[token].mint(address, web3.utils.toWei(INITIAL_TOKENS_AMOUNT), { from: appManager })
      }
    }

    // instatinate the streaming app
    const proxyAddress = await newApp(dao, 'Streaming', appBase.address, appManager)
    streaming = await Streaming.at(proxyAddress)

    // Set up the permissions.
    // await setOpenPermission(acl, vault.address, await vault.TRANSFER_ROLE(), appManager)
    await setOpenPermission(acl, streaming.address, await streaming.DEPOSIT_ROLE(), appManager)
    await setOpenPermission(acl, streaming.address, await streaming.WITHDRAW_ROLE(), appManager)
    await setOpenPermission(acl, streaming.address, await streaming.WHITELIST_SUPER_TOKEN_ROLE(), appManager)
    await setOpenPermission(acl, streaming.address, await streaming.UPDATE_STREAM_ROLE(), appManager)

    // initialize the streaming app
    const superTokenAddresses = tokens.map(token => _getSuperTokenAddress(token))
    await streaming.initialize(vault.address, superfluid.host.address, superfluid.agreements.cfa.address, superTokenAddresses)

    // print the state
    await _printTokenBalances(web3)
    await _printStreams(web3)

  })
  /*
    beforeEach('deploy dao and app', async () => {
      const { dao, acl } = await newDao(appManager)
  
      // Instantiate a proxy for the app, using the base contract as its logic implementation.
      const proxyAddress = await newApp(dao, 'streaming', appBase.address, appManager)
      app = await CounterApp.at(proxyAddress)
  
      // Set up the app's permissions.
      await setOpenPermission(acl, app.address, await app.INCREMENT_ROLE(), appManager)
      await setOpenPermission(acl, app.address, await app.DECREMENT_ROLE(), appManager)
  
      // Initialize the app's proxy.
      await app.initialize(INIT_VALUE)
    })
  */
  it('something', async () => {

  })

  xit('something', async () => {

  })

  xit('something', async () => {

  })

  xit('something', async () => {

  })

  async function _printTokenBalances(web3) {
    console.log(`> Block number: ${await web3.eth.getBlockNumber()}`)

    const users = [
      { name: 'streaming', address: streaming.address },
      { name: 'vault', address: vault.address },
      { name: 'alice', address: alice }
    ]

    for (const user of users) {
      console.log()
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
        address: streaming.address,
        token: _getSuperTokenAddress(token)
      }).details())
      console.log()
      console.log("Streaming app streams")
      console.log(token)
      console.log("netFlow")
      console.log(details.cfa.netFlow)
      console.log("inFlows")
      console.log(details.cfa.flows.inFlows)
      console.log("outFlows")
      console.log(details.cfa.flows.outFlows)

    }

  }

  function _tokenToSuper(token) {
    return `${token}x`
  }

  function _getSuperTokenAddress(token) {
    return tokenToContract[_tokenToSuper(token)].address
  }


})
