import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export class XTikApi implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'XTikAPI',
    name: 'xTikApi',
    icon: 'file:xtikapi.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] === "callEndpoint" ? $parameter["endpointId"] : $parameter["operation"]}}',
    description:
      'Read public posts, videos, comments, profiles, and trends across 19 social media platforms (Douyin, Xiaohongshu, WeChat, TikTok, YouTube, Instagram, X, Reddit)',
    defaults: {
      name: 'XTikAPI',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'xTikApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Call Any Endpoint (229 Endpoints)',
            value: 'callEndpoint',
            description: 'Call any XTikAPI endpoint by ID (e.g. douyin.videos.search, tiktok.videos.search, wechat_mp.posts.list)',
            action: 'Call an XTikAPI endpoint',
          },
          {
            name: 'Search Endpoint Catalog (Free)',
            value: 'searchCatalog',
            description: 'Discover available endpoints, HTTP methods, parameters, and USD pricing',
            action: 'Search the XTikAPI catalog',
          },
        ],
        default: 'callEndpoint',
      },
      {
        displayName: 'Endpoint ID',
        name: 'endpointId',
        type: 'string',
        required: true,
        displayOptions: { show: { operation: ['callEndpoint'] } },
        default: 'tiktok.videos.search',
        placeholder: 'douyin.videos.search',
        description:
          'Endpoint ID from https://xtikapi.com/apis (e.g. douyin.videos.search, xiaohongshu.notes.search, wechat_mp.posts.list, youtube.comments.list)',
      },
      {
        displayName: 'Parameters (JSON)',
        name: 'paramsJson',
        type: 'json',
        displayOptions: { show: { operation: ['callEndpoint'] } },
        default: '{\n  "keyword": "ai agents"\n}',
        description: 'Request parameters as a JSON object. GET/POST method is resolved automatically from the XTikAPI catalog.',
      },
      {
        displayName: 'Max Price (USD)',
        name: 'maxPriceUsd',
        type: 'number',
        typeOptions: { minValue: 0, numberPrecision: 4 },
        displayOptions: { show: { operation: ['callEndpoint'] } },
        default: 0.05,
        description: 'Safety budget guard (X-Max-Price header). Set to 0 to disable.',
      },
      {
        displayName: 'Idempotency Key',
        name: 'idempotencyKey',
        type: 'string',
        displayOptions: { show: { operation: ['callEndpoint'] } },
        default: '',
        description: 'Optional 8-128 character key for 24h safe retries without double billing',
      },
      {
        displayName: 'Search Query',
        name: 'query',
        type: 'string',
        displayOptions: { show: { operation: ['searchCatalog'] } },
        default: '',
        placeholder: 'douyin comments',
        description: 'Optional keyword to filter endpoints',
      },
      {
        displayName: 'Platform',
        name: 'platform',
        type: 'string',
        displayOptions: { show: { operation: ['searchCatalog'] } },
        default: '',
        placeholder: 'douyin, xiaohongshu, tiktok, wechat_mp, youtube, x, reddit',
        description: 'Optional platform ID filter',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials('xTikApi');
    const baseUrl = String(credentials.baseUrl || 'https://xtikapi.com').replace(/\/$/, '');

    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i) as string;

        if (operation === 'searchCatalog') {
          const query = (this.getNodeParameter('query', i, '') as string).trim().toLowerCase();
          const platform = (this.getNodeParameter('platform', i, '') as string).trim().toLowerCase();
          const catalogRes = (await this.helpers.httpRequest({
            method: 'GET',
            url: `${baseUrl}/v1/catalog`,
            json: true,
          })) as { endpoints: IDataObject[] };

          let endpoints = catalogRes.endpoints ?? [];
          if (platform) {
            endpoints = endpoints.filter((e) => String(e.platform).toLowerCase() === platform);
          }
          if (query) {
            const terms = query.split(/\s+/).filter(Boolean);
            endpoints = endpoints.filter((e) => {
              const hay = `${e.id} ${e.summary} ${e.description}`.toLowerCase();
              return terms.every((t) => hay.includes(t));
            });
          }
          returnData.push({ json: { count: endpoints.length, endpoints }, pairedItem: { item: i } });
          continue;
        }

        const endpointId = (this.getNodeParameter('endpointId', i) as string).trim();
        const rawParams = this.getNodeParameter('paramsJson', i, '{}');
        const params: IDataObject =
          typeof rawParams === 'string' ? (JSON.parse(rawParams || '{}') as IDataObject) : (rawParams as IDataObject);
        const maxPriceUsd = this.getNodeParameter('maxPriceUsd', i, 0) as number;
        const idempotencyKey = (this.getNodeParameter('idempotencyKey', i, '') as string).trim();

        const spec = (await this.helpers.httpRequest({
          method: 'GET',
          url: `${baseUrl}/v1/catalog/${encodeURIComponent(endpointId)}`,
          json: true,
        })) as { method: 'GET' | 'POST'; path: string };

        const headers: IDataObject = {};
        if (maxPriceUsd > 0) headers['X-Max-Price'] = String(maxPriceUsd);
        if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

        const response = await this.helpers.httpRequestWithAuthentication.call(this, 'xTikApi', {
          method: spec.method,
          url: `${baseUrl}${spec.path}`,
          headers,
          qs: spec.method === 'GET' ? params : undefined,
          body: spec.method === 'POST' ? params : undefined,
          json: true,
        });

        returnData.push({ json: response as IDataObject, pairedItem: { item: i } });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: error instanceof Error ? error.message : String(error) },
            pairedItem: { item: i },
          });
          continue;
        }
        throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
      }
    }

    return [returnData];
  }
}
