"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SparkwiseApi = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class SparkwiseApi {
    constructor() {
        this.displayName = 'Sparkwise API';
        this.name = 'sparkwiseApi';
        this.icon = 'file:Sparkwise.svg';
        this.documentationUrl = 'https://sparkwise.io/';
        this.properties = [
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
        this.preAuthentication = async function (credentials) {
            n8n_workflow_1.LoggerProxy.debug('preAuthentication called');
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
            return {
                idToken: response.tokens.idToken,
            };
        };
        this.authenticate = async (credentials, requestOptions) => {
            n8n_workflow_1.LoggerProxy.debug('authenticate called');
            requestOptions.headers = {
                ...(requestOptions.headers || {}),
                Authorization: `Bearer ${credentials.idToken}`,
            };
            if (credentials.sparkwiseTenantId && credentials.sparkwiseTenantId !== '') {
                requestOptions.headers['sw-tenant-id'] = credentials.sparkwiseTenantId;
            }
            return requestOptions;
        };
        this.test = {
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
}
exports.SparkwiseApi = SparkwiseApi;
//# sourceMappingURL=SparkwiseApi.credentials.js.map