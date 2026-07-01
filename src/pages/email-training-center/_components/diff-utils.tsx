export type DiffToken = { text: string; type: 'same' | 'del' | 'ins' };

export function computeWordDiff(a: string, b: string): { left: DiffToken[]; right: DiffToken[] } {
  const tokA = a.split(/(\s+)/);
  const tokB = b.split(/(\s+)/);
  const m = tokA.length;
  const n = tokB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = tokA[i - 1] === tokB[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const left: DiffToken[] = [];
  const right: DiffToken[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tokA[i - 1] === tokB[j - 1]) {
      left.unshift({ text: tokA[i - 1], type: 'same' });
      right.unshift({ text: tokB[j - 1], type: 'same' });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      right.unshift({ text: tokB[j - 1], type: 'ins' });
      j--;
    } else {
      left.unshift({ text: tokA[i - 1], type: 'del' });
      i--;
    }
  }
  return { left, right };
}

export function DiffText({ tokens }: { tokens: DiffToken[] }) {
  return (
    <>
      {tokens.map((tok, idx) =>
        tok.type === 'same'
          ? <span key={idx}>{tok.text}</span>
          : tok.type === 'del'
            ? <mark key={idx} className="bg-red-200/80 text-red-900 rounded-[2px]">{tok.text}</mark>
            : <mark key={idx} className="bg-green-200/80 text-green-900 rounded-[2px]">{tok.text}</mark>
      )}
    </>
  );
}
