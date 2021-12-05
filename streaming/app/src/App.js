import React from 'react'
import { Header, Main, SidePanel } from '@aragon/ui'
import SendButton from "./components/Buttons/SendButton";
import ManageTokensButton from "./components/Buttons/ManageTokensButton";
import ReceiveButton from "./components/Buttons/ReceiveButton";

function App() {

  return (
    <Main>
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
      <SidePanel title='test'
                 opened={opened}
                 onClose={() => setOpened(false)}
      >

      </SidePanel>
    </Main>
  )
}

export default App
