import { useApi } from "@aragon/api-react";
import { useCallback } from "react";

export function useUpdateStream(onDone) {
  const api = useApi()

  return useCallback(
    (superToken, amount) => {
      api.updateStream(superToken, amount).toPromise()
      onDone()
    },
    [api, onDone]
  )
}