import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ClipboardCheck,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { complaintApi } from "../../services/complaintApi";
import "./records.css";

function ReviewSection({ title, children }) {
  return (
    <section className="review-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function ComplaintRecords({ onBack }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState("");
  const [error, setError] = useState("");

  const loadRecords = async () => {
    setLoading(true);
    setError("");
    try {
      setRecords(await complaintApi.list());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadRecords();
  }, []);

  const runReview = async (complaintId) => {
    setReviewing(complaintId);
    setError("");
    try {
      const updated = await complaintApi.review(complaintId);
      setRecords((current) =>
        current.map((record) =>
          record.complaint_id === complaintId ? updated : record,
        ),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setReviewing("");
    }
  };

  return (
    <main className="records-page">
      <div className="records-heading">
        <div>
          <button className="back-link" onClick={onBack}>
            <ArrowLeft size={15} /> New complaint
          </button>
          <p className="eyebrow">QUALITY RECORDS</p>
          <h1>Complaint records</h1>
          <p className="subheading">
            Review saved complaints and run the AI quality assessment.
          </p>
        </div>
        <button className="button quiet records-refresh" onClick={loadRecords}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>
      {error && <div className="records-error">{error}</div>}
      {loading ? (
        <div className="records-empty">
          <LoaderCircle className="spin" size={22} /> Loading records...
        </div>
      ) : records.length === 0 ? (
        <div className="records-empty">
          <ClipboardCheck size={22} /> No saved complaints yet.
        </div>
      ) : (
        <div className="records-list">
          {records.map((record) => {
            const fields = record.fields || {};
            const analysis = record.analysis;
            return (
              <article className="record-card" key={record.complaint_id}>
                <div className="record-card-head">
                  <div>
                    <span className="record-id">{record.complaint_id}</span>
                    <h2>{fields.productName || "Untitled complaint"}</h2>
                    <p>
                      {fields.customerName || "Customer not provided"} ·{" "}
                      {fields.batchNumber || "Batch not provided"}
                    </p>
                  </div>
                  <div className="record-actions">
                    <time>
                      {new Date(record.created_at).toLocaleDateString()}
                    </time>
                    <button
                      className="button primary"
                      onClick={() => runReview(record.complaint_id)}
                      disabled={reviewing === record.complaint_id}
                    >
                      {reviewing === record.complaint_id ? (
                        <>
                          <LoaderCircle className="spin" size={14} />{" "}
                          Reviewing...
                        </>
                      ) : (
                        "Run AI review"
                      )}
                    </button>
                  </div>
                </div>
                {analysis && (
                  <div className="review-grid">
                    <ReviewSection title="Complaint summary">
                      <p>{analysis.summary}</p>
                    </ReviewSection>
                    <ReviewSection title="Completeness">
                      <p>
                        <strong>
                          {analysis.completeness?.score}% complete
                        </strong>{" "}
                        · {analysis.completeness?.explanation}
                      </p>
                      {analysis.completeness?.missing_fields?.length > 0 && (
                        <small>
                          Missing:{" "}
                          {analysis.completeness.missing_fields.join(", ")}
                        </small>
                      )}
                    </ReviewSection>
                    <ReviewSection title="AI risk classification">
                      <p>
                        <strong>
                          {analysis.risk_classification?.severity}
                        </strong>{" "}
                        severity ·{" "}
                        <strong>
                          {analysis.risk_classification?.priority}
                        </strong>{" "}
                        priority
                      </p>
                      <small>{analysis.risk_classification?.rationale}</small>
                    </ReviewSection>
                    <ReviewSection title="Root cause recommendation">
                      <p>
                        {Array.isArray(analysis.root_cause_recommendation)
                          ? analysis.root_cause_recommendation.join(" ")
                          : analysis.root_cause_recommendation}
                      </p>
                    </ReviewSection>
                    <ReviewSection title="CAPA recommendation">
                      <p>
                        {Array.isArray(analysis.capa_recommendation)
                          ? analysis.capa_recommendation.join(" ")
                          : analysis.capa_recommendation}
                      </p>
                    </ReviewSection>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
