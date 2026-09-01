interface CompareExpandButtonProps {
  onClick: () => void;
  label?: string;
}

export default function CompareExpandButton({
  onClick,
  label = "Expand comparison",
}: CompareExpandButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-ng-green hover:border-ng-green/30 hover:bg-emerald-50/50 transition-colors shadow-sm"
      aria-label={label}
      title={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M3.25 3.25A.75.75 0 014 2h4.5a.75.75 0 010 1.5H5.56l4.97 4.97a.75.75 0 11-1.06 1.06L4.5 4.56v2.94a.75.75 0 01-1.5 0V3.25zm13.5 0A.75.75 0 0117 2h-4.5a.75.75 0 010 1.5h2.94l-4.97 4.97a.75.75 0 101.06 1.06L15.5 4.56v2.94a.75.75 0 001.5 0V3.25zM3.25 16.75A.75.75 0 014 18h4.5a.75.75 0 000-1.5H5.56l4.97-4.97a.75.75 0 10-1.06-1.06L4.5 15.44v-2.94a.75.75 0 00-1.5 0v4.5zM16.75 16.75a.75.75 0 01-.75.75h-4.5a.75.75 0 010-1.5h2.94l-4.97-4.97a.75.75 0 111.06-1.06l4.97 4.97v-2.94a.75.75 0 011.5 0v4.5z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
