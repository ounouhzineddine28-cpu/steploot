import type {ReactNode} from 'react';

export default function SectionHeading({
  kicker,
  title,
  action
}: {
  kicker: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <p className="kicker mb-2 font-mono text-xs font-medium text-accent">{kicker}</p>
        <h2 className="text-2xl font-extrabold md:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}
