import React from 'react'
import { Button } from '@aragon/ui'

function ReceiveButton({ label, onClick }) {
  return (
    <Button
      mode="strong"
      label={label}
      onClick={onClick}
      css={'margin: 10px 0 10px 10px;'}
    />
  )
}

export default ReceiveButton
