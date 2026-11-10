import { INLINE_CODE } from '../../styles/code-lens.styles';
import { splitCode } from '../../utils/expr.utils';

/** Plain text where `backticked` names render as inline code. */
export default function RichText({ text }: { text: string }) {
  return (
    <>
      {splitCode(text).map((part, index) =>
        part.isCode ? (
          <code key={`${index}:${part.text}`} className={INLINE_CODE}>
            {part.text}
          </code>
        ) : (
          <span key={`${index}:${part.text}`}>{part.text}</span>
        ),
      )}
    </>
  );
}
