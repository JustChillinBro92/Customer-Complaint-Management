import "./layout.css";

export function WorkflowStrip() {
  return (
    <section className="workflow-strip">
      <div className="workflow-step active">
        <span>01</span>
        <div>
          <b>Complaint intake</b>
          <small>Capture source details</small>
        </div>
      </div>
      <div className="workflow-line"></div>
      <div className="workflow-step">
        <span>02</span>
        <div>
          <b>QA assessment</b>
          <small>Review and classify</small>
        </div>
      </div>
      <div className="workflow-line"></div>
      <div className="workflow-step">
        <span>03</span>
        <div>
          <b>Investigation</b>
          <small>Assign follow-up</small>
        </div>
      </div>
    </section>
  );
}
