"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SparkwiseApi = void 0;
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
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                auth: {
                    username: '={{ $credentials.username }}',
                    password: '={{ $credentials.password }}',
                },
                body: {
                    email: '={{ $credentials.username }}',
                    password: '={{ $credentials.password }}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: 'https://service.acc.sparkwise.io',
                url: '/auth-v1/login',
                method: 'POST',
            },
        };
    }
}
exports.SparkwiseApi = SparkwiseApi;
//# sourceMappingURL=SparkwiseApi.credentials.js.map