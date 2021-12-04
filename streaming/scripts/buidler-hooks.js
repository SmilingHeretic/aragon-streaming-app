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
const { networks } = require("../buidler.config");

let appManager
let superfluidDeployer
let vault

const errorHandler = err => {
  if (err) throw err;
};


module.exports = {
  // Called before a dao is deployed.
  preDao: async ({ log }, { web3, artifacts }) => {
    if (network.name === "localhost") {
      console.log("> Deploying Superfluid framework...")
      await deployFramework(errorHandler, {
        web3,
        from: superfluidDeployer
      });
      console.log("> Superfluid framework deployed")

      console.log("> Deploying tokens...")
      await deployTestToken(errorHandler, [":", "DAI"], {
        web3,
        from: superfluidDeployer
      });
      await deploySuperToken(errorHandler, [":", "DAI"], {
        web3,
        from: superfluidDeployer
      });
      await deployTestToken(errorHandler, [":", "LINK"], {
        web3,
        from: superfluidDeployer
      });
      await deploySuperToken(errorHandler, [":", "LINK"], {
        web3,
        from: superfluidDeployer
      });
      console.log("> Tokens deployed")
    }
  },

  // Called after a dao is deployed.
  postDao: async (
    { dao, _experimentalAppInstaller, log },
    { web3, artifacts }
  ) => {
    await _getAccounts(web3)
    await _deployVault()
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
    return [vault.address]
  },

  // Called after the app's proxy is updated with a new implementation.
  postUpdate: async ({ proxy, log }, { web3, artifacts }) => { },
}

async function _deployVault() {
  const VaultMock = artifacts.require('VaultMock')

  vault = await VaultMock.new({ from: appManager })
  console.log(`> Vault deployed: ${vault.address}`)
  console.log(`> Block number: ${await web3.eth.getBlockNumber()}`)
}

async function _getAccounts(web3) {
  ([appManager, superfluidDeployer] = await web3.eth.getAccounts())
}
