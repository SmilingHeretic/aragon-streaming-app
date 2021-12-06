import React from 'react'
import { AragonApi, useAppState } from '@aragon/api-react'

import appStateReducer from './app-state-reducer'
import { useSidePanel } from './hooks/useSidePanel'
import { useRequestActions } from "./hooks/useRequestAction";
import { useRequestMode } from "./hooks/useRequestMode";
import { useReceiveStream } from "./hooks/streaming/useReceiveStream";
import { useCreateStream } from "./hooks/streaming/useCreateStream";
import { useManageTokens } from "./hooks/streaming/useManageTokens";
import { useUpdateStream } from "./hooks/streaming/useUpdateStream";

export function useAppLogic() {
  const { ready, isSyncing, streams = [] } = useAppState()

  const panelState = useSidePanel()
  const [mode, setMode] = useRequestMode(panelState.requestOpen)

  const actions = {
    manageTokens: useManageTokens(panelState.requestClose),
    createStream: useCreateStream(panelState.requestClose),
    receiveStream: useReceiveStream(panelState.requestClose),
    updateStream: useUpdateStream(panelState.requestClose),
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
