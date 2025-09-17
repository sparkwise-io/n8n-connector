import {
	// IAuthenticateGeneric,
	IHttpRequestHelper,
	Icon,
	ICredentialType,
	ICredentialTestRequest,
	INodeProperties,
	ICredentialDataDecryptedObject,
	IHttpRequestOptions,
} from 'n8n-workflow';

import { LoggerProxy } from 'n8n-workflow';

export class SparkwiseApi implements ICredentialType {
	displayName = 'Sparkwise API';
	name = 'sparkwiseApi';
	icon: Icon = 'file:Sparkwise.svg';
	documentationUrl = 'https://sparkwise.io/';
	properties: INodeProperties[] = [
		{
			displayName: 'Sparkwise URL',
			name: 'sparkwiseUrl',
			type: 'string',
			default: 'https://service.sparkwise.io',
			description: 'The URL of your Sparkwise environment',
		},
		{
			displayName: 'Sparkwise Tenant',
			name: 'sparkwiseTenant',
			type: 'string',
			default: '',
			description: 'The tenant name within your Sparkwise environment you want to use',
		},
		{
			displayName: 'User Email (Design Time Use)',
			name: 'username',
			type: 'string',
			default: '',
			description: 'CAUTION: User is required to have "API reader" permissions',
		},
		{
			displayName: 'User Password (Design Time Use)',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'CAUTION: User login requires API reader permissions',
		},
		{
			displayName: 'API Key (Model Execution)',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
		{
			displayName: 'IdToken',
			name: 'idToken',
			type: 'hidden',
			typeOptions: {
				expirable: true,
			},
			default: '',
			description: 'stores the idToken retrieved in the preAuthentication',
		},
	];

	// preAuthentication logs in on Sparkwise using username/password to retrieve token
	// which is passed in subsequent calls to retrieve information from Sparkwise
	preAuthentication = async function (
		this: IHttpRequestHelper,
		credentials: ICredentialDataDecryptedObject,
	) {
		LoggerProxy.debug('preAuthentication called');

		const response = await this.helpers.httpRequest({
			method: 'POST',
			url: `${credentials.sparkwiseUrl}/auth-v1/login`,
			headers: { 'Content-Type': 'application/json', accept: 'application/json' },
			body: {
				email: credentials.username,
				password: credentials.password,
			},
			json: true,
			encoding: 'json',
		});

		// The idToken will be merged with the credential data so its usable in authentication method
		return {
			idToken: response.tokens.idToken,
		};
	};

	authenticate = async (
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> => {
		LoggerProxy.debug('authenticate called');

		// add idToken as Authorization header
		requestOptions.headers = {
			...(requestOptions.headers || {}),
			Authorization: `Bearer ${credentials.idToken}`,
		};

		// Conditionally add sw-tenant-id if sparkwiseTenantId is not empty
		// this is only necessary when user has multiple tenants on Sparkwise, otherwise it can be omitted
		if (credentials.sparkwiseTenantId && credentials.sparkwiseTenantId !== '') {
			requestOptions.headers['sw-tenant-id'] = credentials.sparkwiseTenantId;
		}

		return requestOptions;
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.sparkwiseUrl }}',
			url: '/auth-v1/login',
			headers: { 'Content-Type': 'application/json', accept: 'application/json' },
			body: {
				email: '={{ $credentials.username }}',
				password: '={{ $credentials.password }}',
			},
			method: 'POST',
		},
	};
}
