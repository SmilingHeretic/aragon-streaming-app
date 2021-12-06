import { MODE } from "../utils/mode-types";
import { useCallback, useState } from "react";

export function useRequestMode(requestPanelOpen) {
  const [requestMode, setRequestMode] = useState(MODE.MANAGE_TOKENS)

  const updateMode = useCallback(
    newMode => {
      setRequestMode(newMode)
      requestPanelOpen()
    },
    [setRequestMode, requestPanelOpen]
  )

  return [requestMode, updateMode]
}