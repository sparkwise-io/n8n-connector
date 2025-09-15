"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sparkwise = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const SPARKWISE_CREDENTIALS_TYPE = 'sparkwiseApi';
class Sparkwise {
    constructor() {
        this.methods = {
            loadOptions: {
                async getEndpoints() {
                    try {
                        const credentials = await this.getCredentials(SPARKWISE_CREDENTIALS_TYPE);
                        let sparkwiseUrl = credentials.sparkwiseUrl;
                        let username = credentials.username;
                        let password = credentials.password;
                        let sparkwiseTenantId = credentials.sparkwiseTenant;
                        username = username.trim();
                        sparkwiseUrl = sparkwiseUrl.trim();
                        sparkwiseTenantId = sparkwiseTenantId.trim();
                        if (!sparkwiseUrl || !sparkwiseUrl.startsWith('http')) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Invalid sparkwise Url: must start with http:// or https://');
                        }
                        sparkwiseUrl = sparkwiseUrl.endsWith('/') ? sparkwiseUrl.slice(0, -1) : sparkwiseUrl;
                        const loginResponse = await this.helpers.httpRequestWithAuthentication.call(this, SPARKWISE_CREDENTIALS_TYPE, {
                            method: 'POST',
                            url: `${sparkwiseUrl}/auth-v1/login`,
                            headers: { 'Content-Type': 'application/json', accept: 'application/json' },
                            body: { email: username, password: password },
                            json: true,
                        });
                        const token = loginResponse.tokens.idToken;
                        if (!token) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Login failed: No token returned');
                        }
                        let headers = {
                            accept: 'application/json',
                            Authorization: token,
                        };
                        if (sparkwiseTenantId !== '') {
                            headers['sw-tenant-id'] = sparkwiseTenantId;
                        }
                        const publications = await this.helpers.httpRequestWithAuthentication.call(this, SPARKWISE_CREDENTIALS_TYPE, {
                            method: 'GET',
                            url: `${sparkwiseUrl}/registry-v1/publications`,
                            headers: headers,
                            json: true,
                        });
                        if (!Array.isArray(publications)) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Publications response is not an array');
                        }
                        return publications
                            .filter((pub) => pub && pub.endpointUrl)
                            .map((pub) => {
                            let endpointUrl = pub.endpointUrl;
                            if (endpointUrl && !endpointUrl.startsWith('http')) {
                                if (endpointUrl.startsWith('/')) {
                                    endpointUrl = `${sparkwiseUrl}${endpointUrl}`;
                                }
                                else {
                                    endpointUrl = `${sparkwiseUrl}/${endpointUrl}`;
                                }
                            }
                            return {
                                name: pub.modelName + ' (' + pub.versionID + ') ' + pub.versionName,
                                value: endpointUrl,
                            };
                        })
                            .filter((option) => {
                            try {
                                new URL(option.value);
                                return true;
                            }
                            catch {
                                return false;
                            }
                        });
                    }
                    catch (error) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to load model endpoints: ${error.message}`);
                    }
                },
            },
        };
        this.description = {
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
            inputs: ['main'],
            outputs: ['main'],
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
                    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                    required: true,
                },
                {
                    displayName: 'Model Input Values',
                    name: 'body',
                    type: 'fixedCollection',
                    required: true,
                    placeholder: 'Add Field',
                    description: 'Add input parameters to Sparkwise as fields (e.g. CurrentLocation: Amsterdam, PredictionDate: 4/24/2025)',
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
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            const credentials = await this.getCredentials('sparkwiseApi');
            const endpointUrl = this.getNodeParameter('endpointUrl', i);
            const bodyFields = this.getNodeParameter('body.fields', i, []);
            const body = {};
            for (const field of bodyFields) {
                if (field.name) {
                    body[field.name] = field.value;
                }
            }
            if (!endpointUrl) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'No endpoint URL selected');
            }
            try {
                new URL(endpointUrl);
            }
            catch {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Invalid endpoint URL: ${endpointUrl}`);
            }
            const headers = {
                'Content-Type': 'application/json',
            };
            if (credentials.apiKey) {
                headers['x-api-Key'] = credentials.apiKey;
                headers['x-functions-key'] = credentials.apiKey;
            }
            let response;
            try {
                response = await this.helpers.httpRequestWithAuthentication.call(this, SPARKWISE_CREDENTIALS_TYPE, {
                    method: 'POST',
                    url: endpointUrl,
                    headers,
                    body,
                    json: true,
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ error: error.message });
                    continue;
                }
                if (error.httpCode === '404') {
                    const resource = this.getNodeParameter('resource', 0);
                    const errorOptions = {
                        message: `${resource.charAt(0).toUpperCase() + resource.slice(1)} not found`,
                        description: 'The requested resource could not be found. Please check your input parameters.',
                    };
                    throw new n8n_workflow_1.NodeApiError(this.getNode(), error, errorOptions);
                }
                if (error.httpCode === '401') {
                    throw new n8n_workflow_1.NodeApiError(this.getNode(), error, {
                        message: 'Authentication failed',
                        description: 'Please check your credentials and try again.',
                    });
                }
                throw new n8n_workflow_1.NodeApiError(this.getNode(), error);
            }
            returnData.push(response);
        }
        return [this.helpers.returnJsonArray(returnData)];
    }
}
exports.Sparkwise = Sparkwise;
//# sourceMappingURL=Sparkwise.node.js.map