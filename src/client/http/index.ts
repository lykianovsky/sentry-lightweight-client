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
			credentials: 'include',
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw response
		}

		return response.json();
	}}