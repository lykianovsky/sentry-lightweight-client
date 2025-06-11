import {Contexts, Event, SeverityLevel, StackFrame} from "@sentry/core";

type Pattern  = {
	name: string
	regexp: RegExp
}

export class InformationBuilder {
	private _isBrowser: boolean = typeof window !== 'undefined';

	private _osPatterns: Pattern[] = [
		{ name: 'Windows 10', regexp: /Windows NT 10\.0/ },
		{ name: 'Windows 8.1', regexp: /Windows NT 6\.3/ },
		{ name: 'Windows 8', regexp: /Windows NT 6\.2/ },
		{ name: 'Windows 7', regexp: /Windows NT 6\.1/ },
		{ name: 'macOS', regexp: /Mac OS X (\d+[_\d]*)/ },
		{ name: 'Android', regexp: /Android (\d+[\.\d]*)/ },
		{ name: 'iOS', regexp: /iPhone OS (\d+[_\d]*)/ },
		{ name: 'Linux', regexp: /Linux/ },
	];

	private _browserPatterns: Pattern[] = [
		{ name: 'Edge', regexp: /Edg\/([\d.]+)/ },
		{ name: 'Opera', regexp: /OPR\/([\d.]+)/ },
		{ name: 'Chrome', regexp: /Chrome\/([\d.]+)/ },
		{ name: 'Safari', regexp: /Version\/([\d.]+).*Safari/ },
		{ name: 'Firefox', regexp: /Firefox\/([\d.]+)/ },
		{ name: 'Internet Explorer', regexp: /MSIE (\d+\.\d+);/ },
		{ name: 'Internet Explorer', regexp: /Trident\/.*rv:(\d+\.\d+)/ },
	];

	private _parseUserAgent(ua: string, patterns: Pattern[]): { name: string; version?: string } {
		for (const { name, regexp} of patterns) {
			const match = ua.match(regexp);
			if (match) {
				const version = match[1]?.replace(/_/g, '.')
				return { name, version};
			}
		}

		return { name: 'Unknown' };
	}

	private _getContexts(): Contexts {
		if (this._isBrowser) {
			const os = this._parseUserAgent(navigator.userAgent, this._osPatterns)
			const browser = this._parseUserAgent(navigator.userAgent, this._browserPatterns)
			return {
				os: {
					name: os.name,
					version: os.version
				},
				browser: {
					name: browser.name,
					version: browser.version,
				},
				runtime: {
					name: 'javascript',
				},
			};
		}

		return {
			os: {
				name: process.platform,
				version: process.version,
			},
			runtime: {
				name: 'node',
				version: process.version,
			},
		}
	}

	private _parseStack(error: Error): StackFrame[] | undefined {
		return error.stack?.split('\n')
			.filter(line => line.trim())
			.map(line => ({ filename: line.trim() }))
	}

	private _generateEventId() {
		// Создаём 32-символьную HEX-строку (16 байт)
		const bytes = new Uint8Array(16);

		for (let i = 0; i < 16; i++) {
			bytes[i] = Math.floor(Math.random() * 256);
		}

		// Форматируем по стандарту UUID v4
		bytes[6] = (bytes[6] & 0x0f) | 0x40;  // Версия 4
		bytes[8] = (bytes[8] & 0x3f) | 0x80;  // Вариант 1

		// Преобразуем в HEX-строку без дефисов
		return Array.from(bytes)
			.map(b => b.toString(16).padStart(2, '0'))
			.join('');
	}

	public get(error: Error, options?: Event): Event {
		return {
			event_id: this._generateEventId(),
			timestamp: Math.floor(Date.now() / 1000),
			platform: 'javascript',
			level: 'error',
			contexts: this._getContexts(),
			request: {
				url: this._isBrowser ? window.location.href : ''
			},
			exception: {
				values: [{
					type: error.name,
					value: error.message,
					stacktrace: {
						frames: this._parseStack(error)
					}
				}]
			},
			...options
		};
	}
}