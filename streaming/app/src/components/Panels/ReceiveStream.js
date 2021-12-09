import React, { useEffect, useRef } from "react";
import { IdentityBadge, textStyle } from '@aragon/ui'
import QRCode from 'qrcode.react'
import { InfoMessage } from "../Message";
import { useCurrentApp } from "@aragon/api-react";

const ReceiveStream = React.memo(({ panelOpened }) => {
  const { kernelAddress } = useCurrentApp();

  const inputRef = useRef(null);
  // Panel opens =>  Focus input
  useEffect(() => {
    if (panelOpened) {
      inputRef.current.focus()
    }
  }, [panelOpened])

  let errorMessage = 'Token address is not a valid Ethereum address'

  return (
    <div>
      <InfoMessage
        text={'Scan this QR code to deposit to your DAO wallet'}
      />
      <QRCode
        value={kernelAddress}
        css={'margin: 20px auto; padding-left: 0; padding-right: 0; margin-left: auto; margin-right: auto; display: block;'}
      />
      <IdentityBadge
        entity={kernelAddress}
        shorten={false}
        labelStyle={`
        ${textStyle('body3')}
        `}
      />
    </div>
  )
})
export default ReceiveStream