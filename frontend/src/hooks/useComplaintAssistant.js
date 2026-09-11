import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { addMessage, applyAssistantUpdate } from '../store'
import { complaintApi } from '../services/complaintApi'

export function useComplaintAssistant(fields) {
  const dispatch = useDispatch()
  const [isAsking, setIsAsking] = useState(false)

  const ask = async (message) => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || isAsking) return
    dispatch(addMessage({ role: 'user', text: trimmedMessage }))
    setIsAsking(true)
    try {
      const response = await complaintApi.askAssistant(trimmedMessage, fields)
      dispatch(applyAssistantUpdate({ fields: response.field_updates, message: response.assistant_message }))
    } catch {
      dispatch(addMessage({ role: 'assistant', text: 'I could not reach the assistant service. Please edit the fields directly or try again.' }))
    } finally {
      setIsAsking(false)
    }
  }

  return { ask, isAsking }
}
