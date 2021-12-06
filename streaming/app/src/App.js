import React from 'react'
import { Header, Main, SidePanel, SyncIndicator } from '@aragon/ui'
import SendButton from "./components/Buttons/SendButton";
import ManageTokensButton from "./components/Buttons/ManageTokensButton";
import ReceiveButton from "./components/Buttons/ReceiveButton";
import { AppLogicProvider, useAppLogic } from './app-logic'
import { MODE } from "./utils/mode-types";
import DepositTokens from "./components/Panels/DepositTokens";

const App = React.memo( () => {
  const { actions, requests, isSyncing, streams, panelState, mode } = useAppLogic()

  const title = mode === MODE.MANAGE_TOKENS
    ? 'Manage Tokens'
    : mode === MODE.CREATE_STREAM
      ? 'Send Tokens'
      : 'Receive Tokens'

  return (
    <Main>
      <SyncIndicator visible={isSyncing} />
      <Header
        primary="Streaming"

        secondary={
          <>
            <ManageTokensButton label="Manage Tokens" onClick={requests.manageTokens} />
            <SendButton label="Send" onClick={requests.createStream} />
            <ReceiveButton label="Receive" onClick={requests.receiveStream} />
          </>
        }
      />
      <SidePanel title={title}
                 opened={panelState.visible}
                 onClose={panelState.requestClose}
      >
        {mode === MODE.MANAGE_TOKENS ? (
          <DepositTokens
            panelVisible={panelState.visible}
            panelOpened={panelState.opened}
          />
        ) : mode === MODE.CREATE_STREAM ? (
          <DepositTokens
            panelVisible={panelState.visible}
            panelOpened={panelState.opened}
          />
        ) : (           <DepositTokens
            panelVisible={panelState.visible}
            panelOpened={panelState.opened}
          />
          )
        }
      </SidePanel>
    </Main>
  )
})

export default () => {
  return (
    <AppLogicProvider>
      <App />
    </AppLogicProvider>
  )
}
