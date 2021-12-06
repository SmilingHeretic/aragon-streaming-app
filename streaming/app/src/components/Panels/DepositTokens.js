import React, { useEffect, useRef, useState } from "react";
import { Field, TextInput, Button } from '@aragon/ui'
import { ErrorMessage, InfoMessage } from "../Message";

const NO_ERROR = Symbol('NO_ERROR')
const TOKEN_ADDRESS_NOT_VALID = Symbol('TOKEN_ADDRESS_NOT_VALID')
const initialState = { value: '', error: NO_ERROR }

const DepositTokens = React.memo(({ panelVisible, panelOpened }) => {
  const [address, setAddress, setError] = useAddress(panelVisible)

  const inputRef = useRef(null)
  // Panel opens =>  Focus input
  useEffect(() => {
    if (panelOpened) {
      inputRef.current.focus()
    }
  }, [panelOpened])

  const handleFormSubmit = event => {
    event.preventDefault()

    const error = validate(address.value, tokens)
    if (error) {
      setError(error)
      return
    }

    onAddToken(address.value)
  }

  let errorMessage
  if (address.error === TOKEN_ADDRESS_NOT_VALID) errorMessage = 'Token address is not a valid Ethereum address'

  return (
    <div>
      <form onSubmit={handleFormSubmit}>

        <Field label="Wallet address">
          <TextInput
            name="address"
            wide
            onChange={setAddress}
            value={address.value}
            ref={inputRef}
            required
          />
        </Field>
        <Field label="Budget in Eth">
          <TextInput
            name="amount"
            wide
            onChange={setAddress}
            value={address.value}
            ref={inputRef}
            required
          />
        </Field>
        <Button mode="strong" wide type="submit">
          Deposit
        </Button>
        <InfoMessage
          title="Token Management"
          text={'Use this action to manage your streaming budget'}
        />
        {errorMessage && <ErrorMessage text={errorMessage} />}
      </form>
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

const validate = (address, tokens) => {
  if (!isAddress(address)) return TOKEN_ADDRESS_NOT_VALID

  return null
}

export default DepositTokens