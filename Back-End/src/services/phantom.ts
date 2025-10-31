import axios from 'axios';

export type PhantomRunOptions = {
  sheetUrl?: string;
  profileUrls?: string[];
};

export type PhantomRunResult = {
  runId: string;
  status: 'running' | 'finished' | 'error';
  csvUrl?: string;
  debug?: any;
};

const PH_BASE = 'https://api.phantombuster.com/api/v2';

function getEnv() {
  const key = process.env.PHANTOMBUSTER_API_KEY;
  const agentId = process.env.PHANTOMBUSTER_AGENT_ID;
  if (!key || !agentId) throw new Error('PhantomBuster não configurado');
  return { key, agentId };
}

function extractRunId(data: any): string | undefined {
  return (
    data?.data?.id ||
    data?.data?.containerId ||
    data?.containerId ||
    data?.container?.id ||
    data?.id
  );
}

export async function launchPhantom(run: PhantomRunOptions): Promise<PhantomRunResult> {
  const { key, agentId } = getEnv();

  // monte o argumento seguindo UMA única fonte (sheet OU profileUrls)
  let argument: Record<string, any> = { onlyGetFirstResult: false };

  if (run.profileUrls && run.profileUrls.length > 0) {
    argument.profileUrls = run.profileUrls;
  } else {
    argument.spreadsheetUrl = run.sheetUrl || process.env.PHANTOMBUSTER_SHEET_URL;
  }

  // NÃO enviar sessionCookie/userAgent neste phantom (usa a auth salva na UI)
  // argument.sessionCookie / argument.userAgent => REMOVIDOS

  const resp = await axios.post(
    `${PH_BASE}/agents/launch`,
    { id: agentId, argument },
    { headers: { 'X-Phantombuster-Key-1': key } },
  );

  let runId = extractRunId(resp.data);
  if (!runId) {
    try {
      const fetch = await axios.get(`${PH_BASE}/agents/fetch?id=${encodeURIComponent(agentId)}`, {
        headers: { 'X-Phantombuster-Key-1': key },
      });
      runId =
        fetch?.data?.data?.lastLaunch?.containerId ||
        fetch?.data?.data?.lastLaunchContainerId ||
        fetch?.data?.data?.lastRun?.id ||
        undefined;
    } catch {}
  }

  return { runId: runId || 'unknown', status: 'running', debug: { launchResponse: resp.data } };
}


export async function getRunStatus(runId: string): Promise<PhantomRunResult> {
  const { key } = getEnv();
  const { data } = await axios.get(`${PH_BASE}/containers/fetch?id=${encodeURIComponent(runId)}`, {
    headers: { 'X-Phantombuster-Key-1': key },
  });

  const status: string = data?.data?.status ?? 'unknown';
  const finished = status === 'done';
  const error = status === 'error';

  let csvUrl: string | undefined;
  if (finished) {
    const output = data?.data?.output ?? {};
    csvUrl = output?.fileUrl || output?.outputFileUrl || undefined;
  }

  return { runId, status: error ? 'error' : finished ? 'finished' : 'running', csvUrl, debug: { fetchResponse: data } };
}
