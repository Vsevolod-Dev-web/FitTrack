// Текст с пунктирным подчёркиванием и всплывающей подсказкой при наведении
export function InfoTip({ children, tip }) {
  return (
    <span
      title={tip}
      className="border-b border-dotted border-stone-400 cursor-help"
    >
      {children}
    </span>
  );
}
