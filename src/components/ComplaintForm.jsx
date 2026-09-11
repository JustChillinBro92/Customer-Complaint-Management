import { CheckCircle2, ClipboardCheck, RotateCcw } from 'lucide-react'
import { Field } from './Field'
import { complaintSections } from './formConfig'

export function ComplaintForm({ fields, saveStatus, savedId, onChange, onReset, onSave }) {
  return <section className="form-card"><div className="card-intro"><div><span className="step-label">STEP 01</span><h2>Complaint record</h2><p>Enter the reported event details. Required fields are marked with an asterisk.</p></div><span className="draft-tag">DRAFT / UNSUBMITTED</span></div>{complaintSections.map((section, index) => <div className="form-section" key={section.title}><div className="section-heading"><span>0{index + 1}</span><h3>{section.title}</h3></div><div className="field-grid">{section.fields.map((config) => <Field key={config[0]} config={config} value={fields[config[0]]} onChange={onChange} />)}</div></div>)}<div className="form-actions"><button className="button quiet" onClick={onReset}><RotateCcw size={15} /> Reset form</button><button className="button primary" onClick={onSave} disabled={saveStatus === 'saving'}>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? <><CheckCircle2 size={15} /> Saved {savedId}</> : <><ClipboardCheck size={15} /> Save complaint</>}</button></div></section>
}
