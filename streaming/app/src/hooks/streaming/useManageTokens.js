import { useApi } from "@aragon/api-react";
import { useCallback } from "react";

export function useManageTokens(onDone) {
  const api = useApi()

  return useCallback(
    (updateMode, address) => {
      console.log(updateMode)
      if (updateMode === 'add') api.manageTokens(address, 'add').toPromise()
      if (updateMode === 'withdraw') api.manageTokens(address, 'withdraw').toPromise()
      onDone()
    },
    [api, onDone]
  )
}