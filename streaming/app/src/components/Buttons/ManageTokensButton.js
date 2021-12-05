import React from 'react'
import { Button } from '@aragon/ui'

function ManageTokensButton({ label, onClick }) {
  return (
    <Button
      mode="strong"
      label={label}
      onClick={onClick}
      css={'margin: 10px;'}
    />
  )
}

export default ManageTokensButton
