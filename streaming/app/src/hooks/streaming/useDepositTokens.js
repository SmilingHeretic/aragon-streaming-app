import { useApi } from "@aragon/api-react";
import { useCallback } from "react";

export function useDepositTokens(onDone) {
  const api = useApi()

  return useCallback(
    amount => {
      api.depositTokens(amount).toPromise()
      onDone()
    },
    [api, onDone]
  )
}