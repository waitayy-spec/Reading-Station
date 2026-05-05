import { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export default function PageHeader({ title, subtitle, right }: Props) {
  return (
    <div className="page-header card">
      <div>
        <div className="mascot">🐰📚</div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {right ? <div>{right}</div> : null}
    </div>
  );
}
