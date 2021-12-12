import { useApi } from "@aragon/api-react";
import { useCallback } from "react";

export function useWithdrawTokens(onDone) {
  const api = useApi()

  return useCallback(
    (superToken, amount) => {
      api.withdraw(superToken, amount).toPromise()
      onDone()
    },
    [api, onDone]
  )
}