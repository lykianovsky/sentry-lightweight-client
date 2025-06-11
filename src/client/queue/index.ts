import {RateLimiter} from "../rate-limiter";

type QueueData = {
	callback: () => Promise<void>
}

export class Queue {
	private readonly _queue = new Set<QueueData>()
	private readonly _RATE_LIMIT_UNTIL_VALUE = 5000
	private readonly _TOO_MANY_REQUEST_STATUS_CODE = 429

	private readonly _rateLimiter: RateLimiter

	constructor() {
		this._rateLimiter = new RateLimiter()
	}

	private _isProcessing = false

	private setIsProcessing(value: boolean) {
		this._isProcessing = value
	}

	public add(callback: QueueData['callback']): void {
		this._queue.add({
			callback,
		})
		this._next()
	}

	private async _next() {
		if (this._isEmpty() || this._isProcessing) {
			return
		}

		if (this._rateLimiter.isLimited()) {
			await this._sleep(1000)
			this._next()
			return
		}

		this.setIsProcessing(true)

		const item = this._queue.values().next().value

		if (!item) {
			this.setIsProcessing(false)
			return
		}

		item.callback()
			.catch(error => {
				if (error.status === this._TOO_MANY_REQUEST_STATUS_CODE) {
					this._queue.add(item)
					this._rateLimiter.setLimit(this._RATE_LIMIT_UNTIL_VALUE)
				}
			})
			.finally(() => {
			this._queue.delete(item)
			this.setIsProcessing(false)
			this._next()
		})
	}

	private _isEmpty() {
		return this._queue.size === 0
	}

	private _sleep(ms: number) {
		return new Promise(resolve => setTimeout(resolve, ms))
	}
}