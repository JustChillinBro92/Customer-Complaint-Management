import { Info, Paperclip, Send, Sparkles } from "lucide-react";
import "./copilot.css";

export function ComplaintCopilot({ assistant, isUpdating, isExtracting, isMessagePending, fileRef, onFile, onChatInput }) {
  const isBusy = isMessagePending || isUpdating || isExtracting;
  return <section className="ai-section">
    <div className="copilot-heading"><div className="copilot-mark"><Sparkles size={16} /></div><div><p className="eyebrow">COMPLAINT COPILOT</p><h2>Ask about this complaint</h2><p>Use the assistant to extract complaint details and risk signals.</p></div><span className="online"><i></i>{isBusy ? "Working" : "Ready"}</span></div>
    <div className="messages">{assistant.map((message, index) => <div className={`message ${message.role}`} key={`${message.role}-${index}`}><span>{message.role === "assistant" ? <Sparkles size={13} /> : "You"}</span><p>{message.text}</p></div>)}{isBusy && <div className="thinking-indicator" role="status" aria-label="AI is thinking"><span className="thinking-ring"><Sparkles size={13} /></span></div>}</div>
    <div className="assistant-input"><label className="attach-button" htmlFor="complaint-file-input" aria-label="Attach complaint file" title="Attach complaint file"><Paperclip size={16} /></label><input id="assistant-input" placeholder="Type a message or attach a complaint..." onKeyDown={(event) => event.key === "Enter" && onChatInput()} /><input id="complaint-file-input" ref={fileRef} className="file-input" type="file" hidden accept=".txt,.eml" onChange={onFile} /><button className="send-button" aria-label="Send message" onClick={onChatInput} disabled={isBusy}><Send size={15} /></button></div>
    <small className="disclaimer"><Info size={12} /> AI suggestions are advisory. Verify all information before submission.</small>
  </section>;
}
