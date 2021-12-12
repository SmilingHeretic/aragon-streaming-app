const { assert } = require('chai')
const { assertRevert } = require('@aragon/contract-test-helpers/assertThrow')
const { newDao, newApp } = require('./helpers/dao')

const { setOpenPermission } = require('./helpers/permissions')

const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deployTestToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-test-token");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
const SuperfluidSDK = require("@superfluid-finance/js-sdk");

const Streaming = artifacts.require('Streaming.sol')
const Vault = artifacts.require('Vault.sol')

const tokens = ['WETH', "DAI"]
const errorHandler = err => {
  if (err) throw err;
};

contract('Streaming', ([appManager, superfluidDeployer, alice, bob]) => {
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
    const streamingBase = await Streaming.new()
    const vaultBase = await Vault.new()

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


    // instatinate vault
    const proxyAddressVault = await newApp(dao, 'vault', vaultBase.address, appManager)
    vault = await Vault.at(proxyAddressVault)

    // instatinate the streaming app
    const proxyAddressStreaming = await newApp(dao, 'Streaming', streamingBase.address, appManager)
    streaming = await Streaming.at(proxyAddressStreaming)

    // Set up the permissions.
    await acl.createPermission(streaming.address, vault.address, await vault.TRANSFER_ROLE(), appManager, { from: appManager })
    await setOpenPermission(acl, streaming.address, await streaming.DEPOSIT_ROLE(), appManager)
    await setOpenPermission(acl, streaming.address, await streaming.WITHDRAW_ROLE(), appManager)
    await setOpenPermission(acl, streaming.address, await streaming.WHITELIST_SUPER_TOKEN_ROLE(), appManager)
    await setOpenPermission(acl, streaming.address, await streaming.UPDATE_STREAM_ROLE(), appManager)

    // initialize vault
    vault.initialize()

    // initialize the streaming app
    const superTokenAddresses = tokens.map(token => _getSuperTokenAddress(token))
    await streaming.initialize(vault.address, superfluid.host.address, superfluid.agreements.cfa.address, superTokenAddresses)


    // mint tokens
    for (const address of [vault.address]) {
      for (const token of tokens) {
        await tokenToContract[token].mint(address, web3.utils.toWei(INITIAL_TOKENS_AMOUNT), { from: appManager })
      }
    }

    // print the state
    await _printTokenBalances(web3)
    await _printStreams(web3)
  })

  xit('Deposit', async () => {
    await streaming.deposit(_getSuperTokenAddress("WETH"), web3.utils.toWei("0.5"), { from: appManager })
    await streaming.deposit(_getSuperTokenAddress("DAI"), web3.utils.toWei("1.5"), { from: appManager })

    // print the state
    await _printTokenBalances(web3)
    await _printStreams(web3)
  })

  xit('Withdraw', async () => {
    await streaming.deposit(_getSuperTokenAddress("WETH"), web3.utils.toWei("0.5"), { from: appManager })
    await streaming.deposit(_getSuperTokenAddress("DAI"), web3.utils.toWei("1.5"), { from: appManager })

    await streaming.withdraw(_getSuperTokenAddress("WETH"), web3.utils.toWei("0.2"), { from: appManager })
    await streaming.withdraw(_getSuperTokenAddress("DAI"), web3.utils.toWei("0.7"), { from: appManager })

    // print the state
    await _printTokenBalances(web3)
    await _printStreams(web3)

  })

  it('Update stream', async () => {
    await streaming.deposit(_getSuperTokenAddress("WETH"), web3.utils.toWei("0.5"), { from: appManager })
    await streaming.deposit(_getSuperTokenAddress("DAI"), web3.utils.toWei("1.5"), { from: appManager })

    await streaming.updateStream(_getSuperTokenAddress("WETH"), alice, "10000000000000")
    await streaming.updateStream(_getSuperTokenAddress("DAI"), alice, "20000000000000")

    await streaming.updateStream(_getSuperTokenAddress("WETH"), bob, "15000000000000")
    await streaming.updateStream(_getSuperTokenAddress("DAI"), bob, "17000000000000")

    // print the state
    await _printTokenBalances(web3)
    await _printStreams(web3)

    await streaming.updateStream(_getSuperTokenAddress("WETH"), alice, "0")
    await streaming.updateStream(_getSuperTokenAddress("DAI"), bob, "18000000000000")

    // print the state
    await _printTokenBalances(web3)
    await _printStreams(web3)

  })

  xit('Attmept not whitelisted token', async () => {
    await streaming.deposit(bob, web3.utils.toWei("0.5"), { from: appManager })
  })

  xit('Whitelist SuperToken', async () => {
    await streaming.whitelistSuperToken(bob)
    await streaming.deposit(bob, web3.utils.toWei("0.5"), { from: appManager })
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
