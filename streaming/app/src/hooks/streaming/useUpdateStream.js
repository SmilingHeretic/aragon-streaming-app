import { useApi } from "@aragon/api-react";
import { useCallback } from "react";

export function useUpdateStream(onDone) {
  const api = useApi()

  return useCallback(
    amount => {
      api.updateStream(amount).toPromise()
      onDone()
    },
    [api, onDone]
  )
}