import {HttpClient} from "./http";
import {InformationBuilder} from "./information";
import {Queue} from "./queue";
import {Event} from "@sentry/core";

const DSN_PARSE_PATTERN = /^(https?:\/\/)([^@]+)@([^/]+)(\/\d+)/

type Options = {
	dsn: string
}

export class Client {
	private readonly _dsn: Options['dsn']
	private readonly _http: HttpClient
	private readonly _informationBuilder: InformationBuilder
	private readonly _queue: Queue

	constructor(options: Options) {
		this._dsn = options.dsn
		this._http = new HttpClient({url: this._getSentryEndpoint()})
		this._informationBuilder = new InformationBuilder()
		this._queue = new Queue()
	}

	private _getSentryEndpoint() {
		const {origin, pathname, projectId} = this._parseDsn();
		return `${origin}/api${pathname}/store/?sentry_key=${projectId}&sentry_version=7`;
	}

	private _parseDsn() {
		const match = this._dsn.match(DSN_PARSE_PATTERN);

		if (!match) {
			throw new Error(`Invalid Sentry DSN - ${this._dsn}. Check is dsn format valid`);
		}

		const [, protocol, projectId, host, pathname] = match;
		return {
			origin: `${protocol}${host}`,
			pathname,
			projectId,
		};
	}

	public capture(value: string | Error, options?: Event) {
		const error = value instanceof Error ? value : new Error(value)
		const data = this._informationBuilder.get(error, options)

		const request = () => {
			return this._http.post(data)
		}

		this._queue.add(request)
	}
}