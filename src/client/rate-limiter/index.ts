export class RateLimiter {
	private _limitedUntil: number | null = null;

	public isLimited(): boolean {
		if (!this._limitedUntil) {
			return false
		}

		return Date.now() < this._limitedUntil;
	}

	public setLimit(ms: number): void {
		this._limitedUntil = Date.now() + ms;
	}
}