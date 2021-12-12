import { MODE } from "../utils/mode-types";
import { useCallback } from "react";

// Requests to set new mode and open side panel
export function useRequestActions(request) {
  const manageTokens = useCallback(() => {
    request(MODE.MANAGE_TOKENS)
  }, [request])

  const depositTokens = useCallback(() => {
    request(MODE.DEPOSIT_TOKENS)
  }, [request])

  const withdrawTokens = useCallback(() => {
    request(MODE.WITHDRAW_TOKENS)
  }, [request])

  const createStream = useCallback(() => {
    request(MODE.CREATE_STREAM)
  }, [request])

  const receiveStream = useCallback(() => {
    request(MODE.RECEIVE_STREAM)
  }, [request])

  const updateStream = useCallback(() => {
    request(MODE.UPDATE_STREAM)
  }, [request])

  return { manageTokens, depositTokens, withdrawTokens, createStream, receiveStream, updateStream }
}