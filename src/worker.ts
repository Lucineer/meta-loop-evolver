interface Env { META_KV: KVNamespace; DEEPSEEK_API_KEY?: string; }

const CSP: Record<string, string> = { 'default-src': "'self'", 'script-src': "'self' 'unsafe-inline' 'unsafe-eval'", 'style-src': "'self' 'unsafe-inline'", 'img-src': "'self' data: https:", 'connect-src': "'self' https://api.deepseek.com https://*" };

function json(data: unknown, s = 200) { return new Response(JSON.stringify(data), { status: s, headers: { 'Content-Type': 'application/json', ...CSP } }); }

async function callLLM(key: string, system: string, user: string, model = 'deepseek-chat', max = 1200): Promise<string> {
  const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST', headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: max, temperature: 0.5 })
  });
  return (await resp.json()).choices?.[0]?.message?.content || '';
}

function stripFences(t: string): string {
  t = t.trim();
  while (t.startsWith('```')) { t = t.split('\n').slice(1).join('\n'); }
  while (t.endsWith('```')) { t = t.slice(0, -3).trim(); }
  return t;
}

interface Rule { id: string; name: string; description: string; step: string; version: number; active: boolean; successRate: number; trials: number; created: string; modified: string; }
interface Experiment { id: string; ruleId: string; variant: string; metric: string; result: string; ts: string; }

function getLanding(): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Meta Loop Evolver — Cocapn</title><style>
body{font-family:system-ui,sans-serif;background:#0a0a0f;color:#e0e0e0;margin:0;min-height:100vh}
.container{max-width:800px;margin:0 auto;padding:40px 20px}
h1{color:#ef4444;font-size:2.2em}a{color:#ef4444;text-decoration:none}
.sub{color:#8A93B4;margin-bottom:2em}
.card{background:#16161e;border:1px solid #2a2a3a;border-radius:12px;padding:24px;margin:20px 0}
.card h3{color:#ef4444;margin:0 0 12px 0}
.btn{background:#ef4444;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold}
.btn:hover{background:#dc2626}
.btn2{background:#2a2a3a;color:#e0e0e0;border:1px solid #3a3a4a;padding:8px 16px;border-radius:8px;cursor:pointer}
.btn2:hover{background:#3a3a4a}
textarea,select{background:#0a0a0f;color:#e0e0e0;border:1px solid #2a2a3a;border-radius:8px;padding:10px;width:100%;box-sizing:border-box}
.rule{padding:16px;background:#1a1a0a;border-left:3px solid #ef4444;margin:8px 0;border-radius:0 8px 8px 0}
.rule .rate{font-weight:bold}.rule .rate.high{color:#22c55e}.rule .rate.mid{color:#f59e0b}.rule .rate.low{color:#ef4444}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0}
.stat{text-align:center;padding:16px;background:#16161e;border-radius:8px;border:1px solid #2a2a3a}
.stat .num{font-size:2em;color:#ef4444;font-weight:bold}.stat .label{color:#8A93B4;font-size:.8em}
.tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.75em;margin-left:4px}
.tag-active{background:#22c55e33;color:#22c55e}.tag-inactive{background:#64748b33;color:#64748b}
</style></head><body><div class="container">
<h1>🧬 Meta Loop Evolver</h1><p class="sub">Evolves the orchestration rules themselves. The fleet that modifies its own governance.</p>
<div class="stats"><div class="stat"><div class="num" id="rules">0</div><div class="label">Rules</div></div>
<div class="stat"><div class="num" id="experiments">0</div><div class="label">Experiments</div></div>
<div class="stat"><div class="num" id="avgRate">—</div><div class="label">Avg Success</div></div></div>
<div class="card"><h3>Propose Rule Mutation</h3>
<select id="step"><option value="decompose">decompose</option><option value="workflow">workflow</option><option value="monitor">monitor</option><option value="evolve">evolve</option><option value="retry">retry</option></select>
<textarea id="mutation" rows="2" placeholder="Describe the rule change..." style="margin-top:8px"></textarea>
<div style="margin-top:12px"><button class="btn" onclick="propose()">Propose Mutation</button></div></div>
<div class="card"><h3>Log Experiment Result</h3>
<select id="ruleSelect"><option value="">Select rule...</option></select>
<select id="metric" style="margin-top:8px"><option value="success">Success</option><option value="failure">Failure</option><option value="partial">Partial</option></select>
<textarea id="result" rows="2" placeholder="What happened?" style="margin-top:8px"></textarea>
<div style="margin-top:12px"><button class="btn2" onclick="logResult()">Log Result</button></div></div>
<div id="rulesList" class="card"><h3>Active Rules</h3><p style="color:#8A93B4">Loading...</p></div>
<script>
async function load(){try{const[r1,r2]=await Promise.all([fetch('/api/rules'),fetch('/api/stats')]);
const rules=await r1.json(),stats=await r2.json();
document.getElementById('rules').textContent=stats.rules||0;
document.getElementById('experiments').textContent=stats.experiments||0;
document.getElementById('avgRate').textContent=stats.avgRate||'—';
const sel=document.getElementById('ruleSelect');
sel.innerHTML='<option value="">Select rule...</option>'+rules.map(r=>'<option value="'+r.id+'">'+r.name+' (v'+r.version+')</option>').join('');
const el=document.getElementById('rulesList');
if(!rules.length){el.innerHTML='<h3>Active Rules</h3><p style="color:#8A93B4">No rules yet. Propose one above.</p>';return;}
el.innerHTML='<h3>Active Rules ('+rules.length+')</h3>'+rules.map(r=>{
const rc=r.successRate>=0.7?'high':r.successRate>=0.4?'mid':'low';
return '<div class="rule"><strong>'+r.name+'</strong> <span class="tag '+(r.active?'tag-active':'tag-inactive')+'">'+(r.active?'active':'inactive')+'</span> v'+r.version+'<br><span style="color:#8A93B4">'+r.description+'</span><br><span class="rate '+rc+'">'+(r.successRate*100).toFixed(0)+'% success</span> · '+r.trials+' trials · step: '+r.step+'</div>';}).join('');
}catch(e){}}
async function propose(){const step=document.getElementById('step').value,m=document.getElementById('mutation').value.trim();
if(!m)return;await fetch('/api/propose',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({step,mutation:m})});
document.getElementById('mutation').value='';load();}
async function logResult(){const rid=document.getElementById('ruleSelect').value,metric=document.getElementById('metric').value,result=document.getElementById('result').value.trim();
if(!rid||!result)return;await fetch('/api/experiment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ruleId:rid,metric,result})});
document.getElementById('result').value='';load();}
load();</script>
<div style="text-align:center;padding:24px;color:#475569;font-size:.75rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> · <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>
</div></body></html>`;
}

const DEFAULT_RULES: Rule[] = [
  { id: '1', name: 'Max 3 sub-problems', description: 'Decompose goals into at most 3 sub-problems to stay within CF 30s CPU limit', step: 'decompose', version: 1, active: true, successRate: 0.85, trials: 12, created: new Date().toISOString(), modified: new Date().toISOString() },
  { id: '2', name: 'Keyword heuristic scoring', description: 'Use keyword matching instead of LLM call for scoring to avoid CF timeout', step: 'decompose', version: 1, active: true, successRate: 0.9, trials: 20, created: new Date().toISOString(), modified: new Date().toISOString() },
  { id: '3', name: 'Skill-evolver on failure', description: 'Trigger skill-evolver when loop-closure step fails with error', step: 'evolve', version: 1, active: true, successRate: 0.6, trials: 5, created: new Date().toISOString(), modified: new Date().toISOString() },
  { id: '4', name: 'Synthesize at threshold', description: 'Auto-synthesize solutions when 80%+ of sub-problems have solutions', step: 'retry', version: 1, active: true, successRate: 0.7, trials: 8, created: new Date().toISOString(), modified: new Date().toISOString() },
];

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/health') return json({ status: 'ok', vessel: 'meta-loop-evolver' });
    if (url.pathname === '/vessel.json') return json({ name: 'meta-loop-evolver', type: 'cocapn-vessel', version: '1.0.0', description: 'Evolves fleet orchestration rules — the fleet that modifies its own governance', fleet: 'https://the-fleet.casey-digennaro.workers.dev', capabilities: ['rule-evolution', 'a-b-testing', 'self-governance'] });

    if (url.pathname === '/api/stats') {
      const rules = await env.META_KV.get('rules', 'json') as Rule[] || DEFAULT_RULES;
      const experiments = await env.META_KV.get('experiments', 'json') as Experiment[] || [];
      const avg = rules.length ? rules.reduce((a, r) => a + r.successRate, 0) / rules.length : 0;
      return json({ rules: rules.length, experiments: experiments.length, avgRate: `${(avg * 100).toFixed(0)}%` });
    }

    if (url.pathname === '/api/rules') return json(await env.META_KV.get('rules', 'json') as Rule[] || DEFAULT_RULES);
    if (url.pathname === '/api/experiments') return json((await env.META_KV.get('experiments', 'json') as Experiment[] || []).slice(0, 20));

    if (url.pathname === '/api/propose' && req.method === 'POST') {
      const { step, mutation } = await req.json() as { step: string; mutation: string };
      if (!mutation) return json({ error: 'mutation required' }, 400);
      const rules = await env.META_KV.get('rules', 'json') as Rule[] || DEFAULT_RULES;
      const newRule: Rule = {
        id: Date.now().toString(), name: mutation.substring(0, 60), description: mutation.substring(0, 300),
        step: step || 'general', version: 1, active: true, successRate: 0.5, trials: 0,
        created: new Date().toISOString(), modified: new Date().toISOString()
      };
      if (env.DEEPSEEK_API_KEY) {
        const existing = rules.filter(r => r.step === step).map(r => `${r.name}: ${r.description} (${(r.successRate * 100).toFixed(0)}% success)`).join('\n');
        const analysis = await callLLM(env.DEEPSEEK_API_KEY,
          `You are analyzing fleet orchestration rules. A new rule mutation has been proposed for the "${step}" step. Evaluate: (1) Does this conflict with existing rules? (2) What success rate would you estimate? (3) Should it be active by default? Reply with JSON: {"conflict":"yes/no","estimate":0.0-1.0,"active":true/false,"advice":"..."}`,
          `Existing ${step} rules:\n${existing}\n\nProposed: ${mutation}`, 'deepseek-chat', 400);
        try {
          const p = JSON.parse(stripFences(analysis));
          newRule.successRate = typeof p.estimate === 'number' ? p.estimate : 0.5;
          newRule.active = p.active !== false;
        } catch {}
      }
      rules.push(newRule);
      await env.META_KV.put('rules', JSON.stringify(rules));
      return json({ proposed: true, rule: { id: newRule.id, name: newRule.name, successRate: newRule.successRate, active: newRule.active } });
    }

    if (url.pathname === '/api/experiment' && req.method === 'POST') {
      const { ruleId, metric, result } = await req.json() as { ruleId: string; metric: string; result: string };
      const rules = await env.META_KV.get('rules', 'json') as Rule[] || DEFAULT_RULES;
      const experiments = await env.META_KV.get('experiments', 'json') as Experiment[] || [];
      const rule = rules.find((r: Rule) => r.id === ruleId);
      if (!rule) return json({ error: 'rule not found' }, 404);

      const success = metric === 'success' ? 1 : metric === 'partial' ? 0.5 : 0;
      rule.trials++;
      rule.successRate = rule.successRate * 0.8 + success * 0.2; // EMA
      rule.modified = new Date().toISOString();

      // Auto-evolve: if success rate drops below 0.3 after 5+ trials, deactivate
      if (rule.trials >= 5 && rule.successRate < 0.3 && rule.active) {
        rule.active = false;
        rule.version++;
        // LLM proposes replacement
        if (env.DEEPSEEK_API_KEY) {
          const replacement = await callLLM(env.DEEPSEEK_API_KEY,
            `A fleet orchestration rule is failing. Propose a better replacement. Reply JSON: {"name":"...","description":"..."}`,
            `Failing rule: ${rule.name} — ${rule.description}\nSuccess rate: ${(rule.successRate * 100).toFixed(0)}% after ${rule.trials} trials\nFailure pattern: ${result}`, 'deepseek-chat', 300);
          try {
            const p = JSON.parse(stripFences(replacement));
            const newRule: Rule = {
              id: (Date.now() + 1).toString(), name: String(p.name || 'evolved-rule'), description: String(p.description || 'auto-evolved'),
              step: rule.step, version: 1, active: true, successRate: 0.6, trials: 0,
              created: new Date().toISOString(), modified: new Date().toISOString()
            };
            rules.push(newRule);
            rule.description += ` [superseded by ${newRule.id}]`;
          } catch {}
        }
      }

      // Auto-promote: if success rate > 0.9 after 10+ trials, lock as stable
      if (rule.trials >= 10 && rule.successRate > 0.9) {
        rule.description += ' [STABLE]';
      }

      experiments.unshift({ id: Date.now().toString(), ruleId, variant: metric, metric: String(success), result: result.substring(0, 300), ts: new Date().toISOString() });
      if (experiments.length > 100) experiments.length = 100;
      await env.META_KV.put('rules', JSON.stringify(rules));
      await env.META_KV.put('experiments', JSON.stringify(experiments));
      return json({ logged: true, updatedRate: rule.successRate, version: rule.version });
    }

    return new Response(getLanding(), { headers: { 'Content-Type': 'text/html;charset=UTF-8', ...CSP } });
  }
};
