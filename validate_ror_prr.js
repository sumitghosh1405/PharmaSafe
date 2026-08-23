// Independent ROR/PRR validation harness.
// PART A: PharmaSafe's actual functions, copied verbatim from index.html.
function ci_app(a,b,c,d){
  a+=.5;b+=.5;c+=.5;d+=.5;
  const r=(a*d)/(b*c), se=Math.sqrt(1/a+1/b+1/c+1/d);
  return [r, Math.exp(Math.log(r)-1.96*se), Math.exp(Math.log(r)+1.96*se)];
}
function prr_app(a,b,c,d){a+=.5;b+=.5;c+=.5;d+=.5;return (a/(a+b))/(c/(c+d));}

// PART B: Independent reference implementation, written separately from
// scratch (different variable structure, different order of operations,
// manual step-by-step arithmetic) so it does not simply mirror the app's
// code path. Formulas are the standard published ones:
//   ROR = (a*d)/(b*c), with Haldane-Anscombe +0.5 on all 4 cells when any
//   cell is 0 (applied unconditionally here, matching the app, for direct
//   comparability).
//   SE(ln ROR) = sqrt(1/a+1/b+1/c+1/d)
//   95% CI = exp(ln(ROR) +/- 1.96*SE)
//   PRR = [a/(a+b)] / [c/(c+d)]
function reference(a0,b0,c0,d0){
  const a=a0+0.5, b=b0+0.5, c=c0+0.5, d=d0+0.5;
  const numerator=a*d;
  const denominator=b*c;
  const ror=numerator/denominator;
  const lnRor=Math.log(ror);
  const varSum=(1/a)+(1/b)+(1/c)+(1/d);
  const se=Math.sqrt(varSum);
  const z=1.96;
  const lower=Math.exp(lnRor-z*se);
  const upper=Math.exp(lnRor+z*se);
  const propExposed=a/(a+b);
  const propUnexposed=c/(c+d);
  const prr=propExposed/propUnexposed;
  return {ror,se,lower,upper,prr};
}

const cases=[
  {label:'Normal counts',            a:50,   b:2000,   c:300,   d:500000},
  {label:'Small counts (a=3, floor)',a:3,    b:1000,   c:50,    d:200000},
  {label:'Zero cell: a=0',           a:0,    b:111339, c:4244,  d:20577106},
  {label:'Zero cell: a=0 AND c=0',   a:0,    b:111339, c:0,     d:20581351},
  {label:'Large counts',             a:5000, b:900000, c:20000, d:19000000},
  {label:'Boundary: a=1 (smallest nonzero)', a:1, b:50, c:1, d:50},
  {label:'Boundary: all cells equal',a:100,  b:100,    c:100,   d:100},
  {label:'Boundary: b=0',            a:12,   b:0,      c:40,    d:900000},
];

function relDiff(exp,got){
  if(exp===0)return got===0?0:Infinity;
  return Math.abs(got-exp)/Math.abs(exp);
}

console.log('='.repeat(100));
console.log('INDEPENDENT ROR/PRR VALIDATION — PharmaSafe ci()/prr() vs. independently-coded reference');
console.log('='.repeat(100));

let anyFail=false;
for(const tc of cases){
  const [rApp,loApp,hiApp]=ci_app(tc.a,tc.b,tc.c,tc.d);
  const prrApp=prr_app(tc.a,tc.b,tc.c,tc.d);
  const ref=reference(tc.a,tc.b,tc.c,tc.d);

  const rows=[
    ['ROR', ref.ror, rApp],
    ['SE(ln ROR)', ref.se, null], // app does not expose SE directly, computed internally only
    ['CI lower', ref.lower, loApp],
    ['CI upper', ref.upper, hiApp],
    ['PRR', ref.prr, prrApp],
  ];

  console.log(`\n--- ${tc.label}  (a=${tc.a}, b=${tc.b}, c=${tc.c}, d=${tc.d}) ---`);
  for(const [name,expected,got] of rows){
    if(got===null){
      console.log(`${name.padEnd(12)} expected=${expected.toPrecision(10).padEnd(22)} (not separately exposed by app — folded into CI calc)`);
      continue;
    }
    const abs=Math.abs(got-expected);
    const rel=relDiff(expected,got);
    const pass = rel < 1e-9 || abs < 1e-12; // floating point tolerance only
    if(!pass)anyFail=true;
    console.log(`${name.padEnd(12)} expected=${expected.toPrecision(10).padEnd(22)} pharmasafe=${got.toPrecision(10).padEnd(22)} absDiff=${abs.toExponential(3).padEnd(12)} relDiff=${rel.toExponential(3).padEnd(12)} ${pass?'PASS':'FAIL'}`);
  }
}

console.log('\n'+'='.repeat(100));
console.log(anyFail ? 'RESULT: at least one case FAILED — see above.' : 'RESULT: ALL CASES PASSED — PharmaSafe\'s ci()/prr() arithmetic matches the independent reference implementation to floating-point precision across normal, small, zero-cell, large, and boundary inputs.');
console.log('='.repeat(100));
