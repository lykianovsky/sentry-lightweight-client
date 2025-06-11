type Options = {
	url: string
}

export class HttpClient {
	private readonly _url: Options['url'];

	constructor(options: Options) {
		this._url = options.url;
	}

	async post<Body = any, Response = any>(data: Body): Promise<Response> {
		const response = await fetch(this._url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw response
		}

		// Симуляция 50% вероятности 429
		const random = Math.random();

		if (random < 0.5) {
			console.warn('Simulating 429 Too Many Requests');
			const error = new Error('Too Many Requests') as any;
			error.status = 429;
			throw error;
		}

		return response.json();
	}}