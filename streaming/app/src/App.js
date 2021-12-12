import React from 'react';
import { Header, Main, SidePanel, SyncIndicator } from '@aragon/ui';
import DepositButton from "./components/Buttons/DepositButton";
import WithdrawButton from "./components/Buttons/WithdrawButton";
import SendButton from "./components/Buttons/SendButton";
import ReceiveButton from "./components/Buttons/ReceiveButton";
import { AppLogicProvider, useAppLogic } from './app-logic'
import { MODE } from "./utils/mode-types";
import DepositTokens from "./components/Panels/DepositTokens";
import WithdrawTokens from "./components/Panels/WithdrawTokens";
import CreateStream from "./components/Panels/CreateStream";
import ReceiveStream from "./components/Panels/ReceiveStream";



const App = React.memo( () => {
  const { actions, requests, isSyncing, streams, panelState, mode } = useAppLogic()

  const title = mode === MODE.DEPOSIT_TOKENS
    ? 'Deposit Tokens'
    : mode === MODE.WITHDRAW_TOKENS
      ? 'Withdraw Tokens'
      : mode === MODE.CREATE_STREAM
      ? 'Send Tokens'
      : 'Deposit to DAO wallet'

  return (
    <Main>
      <SyncIndicator visible={isSyncing} />
      <Header
        primary="Streaming"

        secondary={
          <>
            <DepositButton label="Deposit" onClick={requests.depositTokens} />
            <WithdrawButton label="Withdraw" onClick={requests.withdrawTokens} />
            <SendButton label="Send" onClick={requests.createStream} />
            <ReceiveButton label="Receive" onClick={requests.receiveStream} />
          </>
        }
      />
      <SidePanel title={title}
                 opened={panelState.visible}
                 onClose={panelState.requestClose}
      >
        {mode === MODE.DEPOSIT_TOKENS ? (
          <DepositTokens
            onDeposit={actions.deposit}
            panelVisible={panelState.visible}
            panelOpened={panelState.opened}
          />
        ) : mode === MODE.WITHDRAW_TOKENS ? (
          <WithdrawTokens
            panelVisible={panelState.visible}
            panelOpened={panelState.opened}
          />
        ) : mode === MODE.CREATE_STREAM ? (
          <CreateStream
            panelVisible={panelState.visible}
            panelOpened={panelState.opened}
          />
        ) : (
          <ReceiveStream
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
