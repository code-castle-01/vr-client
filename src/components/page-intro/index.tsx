import type { ReactNode } from "react";

type PageIntroProps = {
  description: string;
  kicker?: string;
  extra?: ReactNode;
  title: string;
};

export const PageIntro = ({
  description,
  extra,
  kicker = "Gestion",
  title,
}: PageIntroProps) => {
  return (
    <div className="vr-page-intro">
      <div className="vr-page-kicker">{kicker}</div>
      <h1 className="vr-page-title">{title}</h1>
      <p className="vr-page-description">{description}</p>
      {extra ? <div style={{ marginTop: 18 }}>{extra}</div> : null}
    </div>
  );
};
