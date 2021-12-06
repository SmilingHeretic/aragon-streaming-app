import React, { useCallback, useState } from 'react'
import { AragonApi, useAppState, useApi } from '@aragon/api-react'

import { useSidePanel } from './hooks/useSidePanel'
import appStateReducer from './app-state-reducer'
import { MODE } from './utils/mode-types'

export function useRequestMode(requestPanelOpen) {
  const [requestMode, setRequestMode] = useState(MODE.MANAGE_TOKENS)

  const updateMode = useCallback(
    newMode => {
      setRequestMode(newMode)
      requestPanelOpen()
    },
    [setRequestMode, requestPanelOpen]
  )

  return [requestMode, updateMode]
}

// Requests to set new mode and open side panel
export function useRequestActions(request) {
  const manageTokens = useCallback(() => {
    request(MODE.MANAGE_TOKENS)
  }, [request])

  const createTokens = useCallback(() => {
    request(MODE.CREATE_STREAM)
  }, [request])

  const receiveTokens = useCallback(() => {
    request(MODE.RECEIVE_STREAM)
  }, [request])


  return { manageTokens, createTokens, receiveTokens }
}

export function useManageTokens(onDone) {
  const api = useApi()

  return useCallback(
    (updateMode, address) => {
      console.log(updateMode)
      if (updateMode === 'add') api.manageTokens(address, 'add').toPromise()
      if (updateMode === 'withdraw') api.manageTokens(address, 'withdraw').toPromise()
      onDone()
    },
    [api, onDone]
  )
}

export function useCreateStream(onDone) {
  const api = useApi()

  return useCallback(
    amount => {
      api.createStream(amount).toPromise()
      onDone()
    },
    [api, onDone]
  )
}

export function useReceiveStream(onDone) {
  const api = useApi()

  return useCallback(
    amount => {
      api.receiveStream(amount).toPromise()
      onDone()
    },
    [api, onDone]
  )
}

export function useAppLogic() {
  const { ready, isSyncing, streams = [] } = useAppState()

  const panelState = useSidePanel()
  const [mode, setMode] = useRequestMode(panelState.requestOpen)

  const actions = {
    manageTokens: useManageTokens(panelState.requestClose),
    createStream: useCreateStream(panelState.requestClose),
    receiveStream: useReceiveStream(panelState.requestClose),
  }

  const requests = useRequestActions(setMode)

  return {
    actions,
    requests,
    isSyncing: isSyncing || !ready,
    streams,
    panelState,
    mode,
  }
}

export function AppLogicProvider({ children }) {
  return <AragonApi reducer={appStateReducer}>{children}</AragonApi>
}
