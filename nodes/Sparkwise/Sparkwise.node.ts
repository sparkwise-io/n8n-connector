import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

export class Sparkwise implements INodeType {
	methods = {
		loadOptions: {
			async getEndpoints(this: ILoadOptionsFunctions) {
				try {
					const credentials = await this.getCredentials('sparkwiseApi');
					let sparkwiseUrl = credentials.sparkwiseUrl as string;
					let username = credentials.username as string;
					let password = credentials.password as string;
					let sparkwiseTenantId = credentials.sparkwiseTenant as string;

					username = username.trim();
					sparkwiseUrl = sparkwiseUrl.trim();
					sparkwiseTenantId = sparkwiseTenantId.trim();

					if (!sparkwiseUrl || !sparkwiseUrl.startsWith('http')) {
						throw new NodeOperationError(
							this.getNode(),
							'Invalid sparkwise Url: must start with http:// or https://',
						);
					}

					sparkwiseUrl = sparkwiseUrl.endsWith('/') ? sparkwiseUrl.slice(0, -1) : sparkwiseUrl;

					const loginResponse = await this.helpers.request({
						method: 'POST',
						url: `${sparkwiseUrl}/auth-v1/login`,
						headers: { 'Content-Type': 'application/json', accept: 'application/json' },
						body: { email: username, password: password },
						json: true,
					});

					const token = loginResponse.tokens.idToken;
					if (!token) {
						throw new NodeOperationError(this.getNode(), 'Login failed: No token returned');
					} else {
						console.log(token);
					}

					let headers: Record<string, string> = {
						accept: 'application/json',
						Authorization: token,
					};
					if (sparkwiseTenantId !== '') {
						headers['sw-tenant-id'] = sparkwiseTenantId;
					}

					const publications = await this.helpers.request({
						method: 'GET',
						url: `${sparkwiseUrl}/registry-v1/publications`,
						headers: headers,
						json: true,
					});

					if (!Array.isArray(publications)) {
						throw new NodeOperationError(this.getNode(), 'Publications response is not an array');
					}

					return publications
						.filter((pub: any) => pub && pub.endpointUrl)
						.map((pub: any) => {
							let endpointUrl = pub.endpointUrl;

							if (endpointUrl && !endpointUrl.startsWith('http')) {
								if (endpointUrl.startsWith('/')) {
									endpointUrl = `${sparkwiseUrl}${endpointUrl}`;
								} else {
									endpointUrl = `${sparkwiseUrl}/${endpointUrl}`;
								}
							}

							return {
								name: pub.modelName + ' (' + pub.versionID + ') ' + pub.versionName,
								value: endpointUrl,
							};
						})
						.filter((option: any) => {
							try {
								new URL(option.value);
								return true;
							} catch {
								console.warn('Invalid URL filtered out:', option.value);
								return false;
							}
						});
				} catch (error) {
					console.error('Error loading model endpoints:', error);
					throw new NodeOperationError(
						this.getNode(),
						`Failed to load model endpoints: ${error.message}`,
					);
				}
			},
		},
	};

	description: INodeTypeDescription = {
		displayName: 'Sparkwise',
		name: 'sparkwise',
		icon: 'file:Sparkwise.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["endpointUrl"]}}',
		description: 'Execute a Sparkwise model',
		defaults: {
			name: 'Sparkwise',
		},
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		credentials: [
			{
				name: 'sparkwiseApi',
				required: true,
			},
		],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Model API Endpoint Name or ID',
				name: 'endpointUrl',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getEndpoints',
				},
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				required: true,
			},
			{
				displayName: 'Model Input Values',
				name: 'body',
				type: 'fixedCollection',
				required: true,
				placeholder: 'Add Field',
				description:
					'Add input parameters to Sparkwise as fields (e.g. CurrentLocation: Amsterdam, PredictionDate: 4/24/2025)',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				options: [
					{
						name: 'fields',
						displayName: 'Field',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
								description: 'Field name',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Field value',
							},
						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const returnData = [];

		console.log('EXECUTE items:')
		console.log(items.length)
		console.log(items)

		for (let i = 0; i < items.length; i++) {
			const credentials = await this.getCredentials('sparkwiseApi');
			const endpointUrl = this.getNodeParameter('endpointUrl', i) as string;
			const bodyFields = this.getNodeParameter('body.fields', i, []) as Array<{
				name: string;
				value: string;
			}>;
			const body: { [key: string]: any } = {};
			for (const field of bodyFields) {
				if (field.name) {
					body[field.name] = field.value;
				}
			}

			if (!endpointUrl) {
				throw new NodeOperationError(this.getNode(), 'No endpoint URL selected');
			}

			try {
				new URL(endpointUrl);
			} catch {
				throw new NodeOperationError(this.getNode(), `Invalid endpoint URL: ${endpointUrl}`);
			}

			const headers: { [key: string]: string } = {
				'Content-Type': 'application/json',
			};

			if (credentials.apiKey) {
				headers['x-api-Key'] = credentials.apiKey as string;
				headers['x-functions-key'] = credentials.apiKey as string;
			}

			console.log('BODY');
			console.log(body);

			let response;
			try {
				response = await this.helpers.request({
					method: 'POST',
					url: endpointUrl,
					headers,
					body,
					json: true,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: error.message });
					continue;
				}
				throw error;
			}

			returnData.push(response);
		}
		return [this.helpers.returnJsonArray(returnData)];
	}
}
