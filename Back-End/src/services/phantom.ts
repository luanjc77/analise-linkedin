import axios from 'axios';

export type PhantomRunOptions = {
  sheetUrl?: string;
  profileUrls?: string[];
  numberOfProfilesPerLaunch?: number;
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
  const mode = (process.env.PHANTOMBUSTER_MODE || 'visitor').toLowerCase();
  if (!key || !agentId) throw new Error('PhantomBuster não configurado');
  if (!['visitor', 'scraper'].includes(mode)) throw new Error('PHANTOMBUSTER_MODE inválido (use visitor|scraper)');
  return { key, agentId, mode };
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

function buildArgument(mode: 'visitor' | 'scraper', run: PhantomRunOptions) {
  const hasUrls = !!(run.profileUrls && run.profileUrls.length);
  const sheet = run.sheetUrl || process.env.PHANTOMBUSTER_SHEET_URL;

  if (mode === 'visitor') {
    const arg: Record<string, any> = { onlyGetFirstResult: false };
    if (hasUrls) arg.profileUrls = run.profileUrls;
    else arg.spreadsheetUrl = sheet;
    return arg;
  }

  // --- modo scraper: injeta cookie/UA por argumento ---
  const sessionCookie = process.env.PHANTOMBUSTER_SESSION_COOKIE;
  const userAgent = process.env.PHANTOMBUSTER_USER_AGENT;
  if (!sessionCookie || !userAgent) {
    throw new Error('No modo scraper, configure PHANTOMBUSTER_SESSION_COOKIE e PHANTOMBUSTER_USER_AGENT no .env');
  }

  const arg: Record<string, any> = {
    sessionCookie,
    userAgent,
    numberOfProfilesPerLaunch: run.numberOfProfilesPerLaunch || 10,
  };

  if (hasUrls) arg.profileUrls = run.profileUrls;
  else arg.spreadsheetUrl = sheet;

  return arg;
}

export async function launchPhantom(run: PhantomRunOptions): Promise<PhantomRunResult> {
  const { key, agentId, mode } = getEnv();

  const argument = buildArgument(mode as any, run);

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

  return { runId: runId || 'unknown', status: 'running', debug: { launchResponse: resp.data, mode } };
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
