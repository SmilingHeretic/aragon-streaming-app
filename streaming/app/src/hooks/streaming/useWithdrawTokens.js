import { useApi } from "@aragon/api-react";
import { useCallback } from "react";

export function useWithdrawTokens(onDone) {
  const api = useApi()

  return useCallback(
    amount => {
      api.withdrawTokens(amount).toPromise()
      onDone()
    },
    [api, onDone]
  )
}