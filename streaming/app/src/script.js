import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'
import vaultBalanceAbi from './abi/vault-balance.json'
import vaultGetInitializationBlockAbi from './abi/vault-getinitializationblock.json'
import vaultEventAbi from './abi/vault-events.json'
import { retryEvery } from './utils/retry-every'

const vaultAbi = [].concat(
  vaultBalanceAbi,
  vaultGetInitializationBlockAbi,
  vaultEventAbi
)

const app = new Aragon()

// Get the vault address to initialize ourselves
await retryEvery(() =>
  app
    .call('vault')
    .toPromise()
    .then(vaultAddress => initialize(vaultAddress))
    .catch(err => {
      console.error(
        'Could not start background script execution due to the contract not loading the vault:',
        err
      )
      throw err
    })
)

async function initialize(vaultAddress) {
  console.log(vaultAddress)
  const vaultContract = app.external(vaultAddress, vaultAbi)

  let vaultInitializationBlock

  try {
    vaultInitializationBlock = await vaultContract
      .getInitializationBlock()
      .toPromise()
  } catch (err) {
    console.error("Could not get attached vault's initialization block:", err)
  }
  console.log(vaultInitializationBlock)

  return app.store(
    async (state, event) => {
      const { address: eventAddress, event: eventName } = event
      const nextState = {
        ...state,
      }

      if (eventName === events.SYNC_STATUS_SYNCING) {
        return { ...nextState, isSyncing: true }
      } else if (eventName === events.SYNC_STATUS_SYNCED) {
        return { ...nextState, isSyncing: false }
      }
    },
    {
      init: initializeState(),
      externals: [
        {
          contract: vaultContract,
          initializationBlock: vaultInitializationBlock,
        },
      ],
    }
  )
}

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

function initializeState() {
  return async cachedState => {
    return {
      ...cachedState,
    }
  }
}
