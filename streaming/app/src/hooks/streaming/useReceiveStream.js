import { useApi } from "@aragon/api-react";
import { useCallback } from "react";

export function useReceiveStream(onDone) {
  const api = useApi()

  return useCallback(
    amount => {
      api.receiveStream(amount).toPromise()
      onDone()
    },
    [api, onDone]
  )
}