import { CalendarDays, ChevronDown } from 'lucide-react'

export function Field({ config, value, onChange }) {
  const [name, label, type, options] = config
  const common = {
    value: value || '',
    onChange: (event) => onChange(name, event.target.value),
    placeholder: type === 'textarea' ? 'Describe the reported issue, observed evidence, and requested action...' : `Enter ${label.toLowerCase()}`
  }
  return <label className={`field ${type === 'textarea' ? 'field-wide' : ''}`}><span>{label}</span>{type === 'select' ? <span className="select-wrap"><select {...common}>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={15} /></span> : type === 'textarea' ? <textarea {...common} rows="4" /> : <span className="input-wrap"><input {...common} type={type} />{type === 'date' && <CalendarDays size={15} />}</span>}</label>
}
