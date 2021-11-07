import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import {
  Box,
  Button,
  GU,
  Header,
  IconMinus,
  IconPlus,
  Main,
  SyncIndicator,
  Tabs,
  Text,
  textStyle,
} from '@aragon/ui'
import styled from 'styled-components'

function App() {
  const { api, appState, path, requestPath } = useAragonApi()
  const { isSyncing } = appState

  const pathParts = path.match(/^\/tab\/([0-9]+)/)
  const pageIndex = Array.isArray(pathParts)
    ? parseInt(pathParts[1], 10) - 1
    : 0

  return (
    <Main>
      {isSyncing && <SyncIndicator />}
      <Header
        primary="Streaming"
      />
    </Main>
  )
}

export default App
