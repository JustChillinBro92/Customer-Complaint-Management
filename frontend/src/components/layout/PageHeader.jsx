import { ArrowUpRight } from "lucide-react";
import "./layout.css";

export function PageHeader() {
  return (
    <>
      <div className="breadcrumb">
        <span>Complaints</span>
        <ArrowUpRight size={13} />
        <b>New complaint</b>
      </div>
      <section className="page-heading">
        <div>
          <h1>Log customer complaint</h1>
          <p className="subheading">
            Capture, assess, and route a product quality concern with
            AI-assisted intake.
          </p>
        </div>
        <div className="heading-status">
          <span className="status-dot"></span> Draft{" "}
          <small>Autosaved just now</small>
        </div>
      </section>
    </>
  );
}
