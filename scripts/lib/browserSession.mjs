// Isolated CDP tab for asset tooling. No user tab navigation or global state.
export async function openBrowserSession(port = 9333) {
  const endpoint = `http://127.0.0.1:${port}`;
  const target = await (await fetch(`${endpoint}/json/new?about:blank`, { method: 'PUT' })).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  const errors = [];
  let id = 0;
  const rejectPending = error => {
    for (const request of pending.values()) {
      clearTimeout(request.timer);
      request.reject(error);
    }
    pending.clear();
  };
  socket.addEventListener('message', ({ data }) => {
    const reply = JSON.parse(data);
    if (reply.method === 'Runtime.exceptionThrown') errors.push(reply.params.exceptionDetails);
    const request = pending.get(reply.id);
    if (!request) return;
    clearTimeout(request.timer);
    pending.delete(reply.id);
    reply.error ? request.reject(new Error(JSON.stringify(reply.error))) : request.resolve(reply.result);
  });
  socket.addEventListener('close', () => rejectPending(new Error('Browser connection closed')));
  socket.addEventListener('error', () => rejectPending(new Error('Browser connection failed')));
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Browser connection timed out')), 10000);
      socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Browser connection failed')); }, { once: true });
    });
  } catch (error) {
    socket.close();
    await fetch(`${endpoint}/json/close/${target.id}`);
    throw error;
  }
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error(`Browser request timed out: ${method}`));
    }, 30000);
    pending.set(requestId, { resolve, reject, timer });
    try {
      socket.send(JSON.stringify({ id: requestId, method, params }));
    } catch (error) {
      clearTimeout(timer);
      pending.delete(requestId);
      reject(error);
    }
  });
  return {
    send,
    errors,
    async evaluate(expression) {
      const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    },
    async close() {
      rejectPending(new Error('Browser session ended'));
      socket.close();
      await fetch(`${endpoint}/json/close/${target.id}`);
    },
  };
}
