import { useApi } from "@aragon/api-react";
import { useCallback } from "react";

export function useDepositTokens(onDone) {
  const api = useApi()

  return useCallback(
    (superToken, amount) => {
      api.deposit(superToken, amount).toPromise()
      onDone()
    },
    [api, onDone]
  )
}