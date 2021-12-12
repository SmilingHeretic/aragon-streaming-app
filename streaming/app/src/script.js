import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'
import vaultBalanceAbi from './abi/vault-balance.json'
import vaultGetInitializationBlockAbi from './abi/vault-getinitializationblock.json'
import vaultEventAbi from './abi/vault-events.json'
import { retryEvery } from './utils/retry-every'
import streamingAbi from './abi/streaming-events.json'
import { forkJoin } from 'rxjs'

const vaultAbi = [].concat(
  vaultBalanceAbi,
  vaultGetInitializationBlockAbi,
  vaultEventAbi
)

const app = new Aragon()

// Get the vault address to initialize ourselves
retryEvery(() => {
  app.call('vault')
    .toPromise()
    .then(vaultAddress => initialize(vaultAddress))
    .catch( err =>
      console.error('Could not start background script execution due to the contract not loading the vault:', err)
    )
})

async function initialize(vaultAddress) {
  const vaultContract = app.external(vaultAddress, vaultAbi)
  // const streamingContract = app.external(streamingAddress, streamingAbi)
  const settings = {
    vault: {
      address: vaultAddress,
      contract: vaultContract,
    }
  }
  console.log(settings)

  const vaultInitializationBlock = async () => await settings.vault.contract
    .getInitializationBlock()
    .toPromise()
    .catch( err => console.error("Could not get attached vault's initialization block:", err))

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
      init: initializeState(settings),
      externals: [
        {
          contract: settings.vault.contract,
          initializationBlock: vaultInitializationBlock(),
        }
      ],
    }
  )
}

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

const initializeState = settings => async cachedState => {
  const nextState = {
    ...cachedState,
    isSyncing: true,
    vaultAddress: settings.vault.address,
  }
    return {
      ...nextState,
  }
}
