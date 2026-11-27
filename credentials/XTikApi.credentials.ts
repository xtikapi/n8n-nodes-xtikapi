import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class XTikApi implements ICredentialType {
  name = 'xTikApi';
  displayName = 'XTikAPI';
  documentationUrl = 'https://xtikapi.com/settings/apikeys';

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Your XTikAPI API key (starts with dk_). Get free trial credit at https://xtikapi.com/settings/apikeys',
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://xtikapi.com',
      description: 'Base URL of the XTikAPI gateway',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.baseUrl || "https://xtikapi.com"}}',
      url: '/v1/status',
      method: 'GET',
    },
  };
}
