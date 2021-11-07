import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'
import vaultBalanceAbi from './abi/vault-balance.json'
import vaultGetInitializationBlockAbi from './abi/vault-getinitializationblock.json'
import vaultEventAbi from './abi/vault-events.json'


const vaultAbi = [].concat(
  vaultBalanceAbi,
  vaultGetInitializationBlockAbi,
  vaultEventAbi
)

const app = new Aragon()

/*
 * Calls `callback` exponentially, everytime `retry()` is called.
 * Returns a promise that resolves with the callback's result if it (eventually) succeeds.
 *
 * Usage:
 *
 * retryEvery(retry => {
 *  // do something
 *
 *  if (condition) {
 *    // retry in 1, 2, 4, 8 seconds… as long as the condition passes.
 *    retry()
 *  }
 * }, 1000, 2)
 *
 */
const retryEvery = async (
  callback,
  { initialRetryTimer = 1000, increaseFactor = 3, maxRetries = 3 } = {}
) => {
  const sleep = time => new Promise(resolve => setTimeout(resolve, time))

  let retryNum = 0
  const attempt = async (retryTimer = initialRetryTimer) => {
    try {
      return await callback()
    } catch (err) {
      if (retryNum === maxRetries) {
        throw err
      }
      ++retryNum

      // Exponentially backoff attempts
      const nextRetryTime = retryTimer * increaseFactor
      console.log(
        `Retrying in ${nextRetryTime}s... (attempt ${retryNum} of ${maxRetries})`
      )
      await sleep(nextRetryTime)
      return attempt(nextRetryTime)
    }
  }

  return attempt()
}

// Get the vault address to initialize ourselves
retryEvery(() =>
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
