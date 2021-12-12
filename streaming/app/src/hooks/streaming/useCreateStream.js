import { useApi } from "@aragon/api-react";
import { useCallback } from "react";

export function useCreateStream(onDone) {
  const api = useApi()

  return useCallback(
    amount => {
      api.createStream(amount).toPromise()
      onDone()
    },
    [api, onDone]
  )
}