import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { addMessage, applyAssistantUpdate } from '../store'
import { complaintApi } from '../services/complaintApi'

export function useComplaintAssistant(fields) {
  const dispatch = useDispatch()
  const [isUpdating, setIsUpdating] = useState(false)

  const updateComplaint = async (message) => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || isUpdating) return
    dispatch(addMessage({ role: 'user', text: trimmedMessage }))
    setIsUpdating(true)
    try {
      const response = await complaintApi.updateComplaint(trimmedMessage, fields)
      dispatch(applyAssistantUpdate({ fields: response.field_updates, message: response.assistant_message }))
    } catch {
      dispatch(addMessage({ role: 'assistant', text: 'I could not reach the assistant service. Please edit the fields directly or try again.' }))
    } finally {
      setIsUpdating(false)
    }
  }

  return { updateComplaint, isUpdating }
}
