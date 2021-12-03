import React, { useState } from 'react'
// import { useAragonApi } from '@aragon/api-react'
import {
  Button,
  Header,
  Main,
  SidePanel,
} from '@aragon/ui'

function App() {
  // const { accountConnected } = useAragonApi();
  // const { api, appState, path, requestPath } = useAragonApi()
  // const { isSyncing } = appState
  const [opened, setOpened] = useState(false);

  // const pathParts = path.match(/^\/tab\/([0-9]+)/)
  // const pageIndex = Array.isArray(pathParts)
  //   ? parseInt(pathParts[1], 10) - 1
  //   : 0

  return (
    <Main>
      <Header
        primary="Streaming"

        secondary={
          <>
            <Button mode="strong" label="Deposit" size={'medium'} css={'margin: 10px;'} onClick={() => setOpened(true)} />
            <Button mode="strong" label="Send" size={'medium'} css={'margin: 10px;'} onClick={() => setOpened(true)} />
            <Button mode="strong" label="Receive" size={'medium'} css={'margin: 10px 0 10px 10px;'} onClick={() => setOpened(true)} />
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
