import React, { useEffect, useRef, useState } from "react";
import { Tabs, Button } from '@aragon/ui';
import DepositTokens from "./DepositTokens";
import WithdrawTokens from "./WithdrawTokens";
import ReceiveStream from "./ReceiveStream";
import CreateStream from "./CreateStream";
import { useAppLogic } from '../../app-logic'

const NO_ERROR = Symbol('NO_ERROR')
const TOKEN_ADDRESS_NOT_VALID = Symbol('TOKEN_ADDRESS_NOT_VALID')
const initialState = { value: '', error: NO_ERROR }

const ManageTokens = React.memo(({ currencies, onManageToken, panelVisible, panelOpened }) => {
  const { panelState } = useAppLogic();
  const [selected, setSelected] = useState(false)
  console.log(selected)

  const inputRef = useRef(null)
  // Panel opens =>  Focus input
  useEffect(() => {
    if (panelOpened) {
      inputRef.current.focus()
    }
  }, [panelOpened])

  return (
    <div css={'margin: 0 auto;'}>
      <Button
        label={'Deposit'}
        css={'margin: 10px;'}
        disabled={!!selected}
        onClick={setSelected}
      />
      <Button
        label={'Withdraw'}
        css={'margin: 10px'}
        disabled={!selected}
        onClick={setSelected}
      />
      { selected ? (
        <DepositTokens
          panelVisible={panelState.visible}
          panelOpened={panelState.opened}

        />
      ) : (
        <WithdrawTokens
          panelVisible={panelState.visible}
          panelOpened={panelState.opened}
        />
      )
      }
    </div>
  )
})

const useAddress = panelVisible => {
  const [address, setAddress] = useState(initialState)

  const handleAddressChange = event => {
    const { value } = event.target
    setAddress(address => ({ ...address, value }))
  }

  const handleAddressError = error => {
    setAddress(address => ({ ...address, error }))
  }

  // Panel closes => Reset address and error state
  useEffect(() => {
    if (!panelVisible) {
      setAddress(initialState)
    }
  }, [panelVisible])

  return [address, handleAddressChange, handleAddressError]
}

export default ManageTokens