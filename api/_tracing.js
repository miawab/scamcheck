// Optional Sentry agent tracing: shows each check as an agent run with its model and tool steps.
//
//   invoke_agent scamcheck          one "is this a scam?" check
//     execute_tool rule_check       the keyword rules (what they found)
//     chat gemma-4-…                Gemma explains it (latency, tokens, failures)
//
//   invoke_agent scamcheck-lookup   one "has anyone reported it?" search
//     execute_tool web_search       SerpApi
//     chat gemma-4-…                Gemma reads the results
//
// Set SENTRY_DSN to turn it on; without it every helper here just runs the work.
// Only the redacted message is recorded (numbers already replaced), never IPs (sendDefaultPii: false).
import * as Sentry from '@sentry/node';

const on = Boolean(process.env.SENTRY_DSN);
if (on) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    sendDefaultPii: false,
    environment: process.env.VERCEL_ENV || 'local',
  });
}

const messages = (role, text) => JSON.stringify([{ role, parts: [{ type: 'text', content: String(text).slice(0, 2000) }] }]);

function span(op, name, attributes, fn) {
  if (!on) return fn({ setAttribute() {}, setAttributes() {} });
  return Sentry.startSpan({ op, name, attributes }, fn);
}

export function agent(name, input, fn) {
  return span('gen_ai.invoke_agent', `invoke_agent ${name}`, {
    'gen_ai.operation.name': 'invoke_agent',
    'gen_ai.agent.name': name,
    'gen_ai.input.messages': messages('user', input),
  }, fn);
}

export function chat(agentName, provider, model, prompt, fn) {
  return span('gen_ai.chat', `chat ${model}`, {
    'gen_ai.operation.name': 'chat',
    'gen_ai.provider.name': provider,
    'gen_ai.request.model': model,
    'gen_ai.agent.name': agentName,
    'gen_ai.input.messages': messages('user', prompt),
  }, fn);
}

export function tool(agentName, name, description, args, fn) {
  return span('gen_ai.execute_tool', `execute_tool ${name}`, {
    'gen_ai.operation.name': 'execute_tool',
    'gen_ai.agent.name': agentName,
    'gen_ai.tool.name': name,
    'gen_ai.tool.description': description,
    'gen_ai.tool.call.arguments': JSON.stringify(args),
  }, fn);
}

export function failed(e) {
  if (on) Sentry.captureException(e);
}

// Serverless functions can freeze right after responding; send what we have first.
export const flush = () => (on ? Sentry.flush(2000) : Promise.resolve());

export const outputMessages = (text) => messages('assistant', text);
