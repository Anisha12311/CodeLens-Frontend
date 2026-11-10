import { TEXT_BY_STATE } from '../../styles/code-lens.styles';
import { parseExpr } from '../../utils/expr.utils';

/** A short expression with its values coloured by highlight state, e.g. 31 > 20 ? */
export default function ExprLine({ expression }: { expression: string }) {
  return (
    <>
      {parseExpr(expression).map((segment, index) => (
        <span
          key={`${index}:${segment.text}`}
          className={segment.state ? TEXT_BY_STATE[segment.state] : undefined}
        >
          {segment.text}
        </span>
      ))}
    </>
  );
}
