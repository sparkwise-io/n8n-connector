import {
	Icon,
	ICredentialType,
	INodeProperties
} from 'n8n-workflow';

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
	];
}
